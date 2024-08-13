const inquirer = require('inquirer');
const pool = require('./lib/connection'); // Ensure this path is correct

// Function to handle user menu options
function manageEmployees() {
    inquirer.prompt([
        {
            type: "list",
            message: "What would you like to do?",
            name: "option",
            choices: [
                "View All Employees",
                "Add Employee",
                "Update Employee Role",
                "View All Roles",
                "Add Role",
                "View All Departments",
                "Add Department",
                "Quit"
            ]
        }
    ])
    .then((res) => {
        switch (res.option) {
            case "View All Employees":
                viewAllEmployees();
                break;
            case "Add Employee":
                addEmployee();
                break;
            case "Update Employee Role":
                updateEmployeeRole();
                break;
            case "View All Roles":
                viewAllRoles();
                break;
            case "Add Role":
                addRole();
                break;
            case "View All Departments":
                viewAllDepartments();
                break;
            case "Add Department":
                addDepartment();
                break;
            case "Quit":
                console.log("Goodbye!");
                process.exit();
                break;
        }
    })
    .catch((err) => {
        console.error("An error occurred:", err.message);
    });
}

// Function to view all employees
let viewAllEmployees = async () => {
    console.log("\nViewing all Employees...");
    const client = await pool.connect();
    try {
        const response = await client.query(`
            SELECT e.id AS employee_id, 
                   e.first_name || ' ' || e.last_name AS employee,
                   m.first_name || ' ' || m.last_name AS manager, 
                   roles.title AS job_title, 
                   departments.name AS department, 
                   roles.salary  
            FROM employees e
            JOIN roles ON e.role_id = roles.id
            JOIN departments ON roles.department_id = departments.id
            LEFT JOIN employees m ON m.id = e.manager_id
            ORDER BY departments.id ASC
        `);
        console.table(response.rows);
    } catch (err) {
        console.error("An error occurred:", err.message);
    } finally {
        client.release();
    }
    manageEmployees();
};

// Function to add a new employee
let addEmployee = async () => {
    console.log("\nAdding an employee...");
    const client = await pool.connect();
    try {
        const roles = await client.query("SELECT * FROM roles");
        const managers = await client.query(`
            SELECT e.first_name || ' ' || e.last_name AS employee_name, 
                   roles.title,
                   e.id AS manager_id
            FROM employees e
            JOIN roles ON e.role_id = roles.id
            WHERE roles.title LIKE '%anager%' OR roles.title LIKE '%ead%'
        `);

        // Debugging output
        console.log('Roles:', roles.rows);
        console.log('Managers:', managers.rows);

        const roleChoices = roles.rows.map(role => ({ name: role.title, value: role.id }));
        const managerChoices = managers.rows.map(manager => ({ name: `${manager.employee_name} --- ${manager.title}`, value: manager.manager_id }));

        console.log('Role Choices:', roleChoices);
        console.log('Manager Choices:', managerChoices);

        const answers = await inquirer.prompt([
            { type: "input", message: "Enter the employee's first name: ", name: "first_name" },
            { type: "input", message: "Enter the employee's last name: ", name: "last_name" },
            { type: "list", message: "Select the employee's role: ", name: "role_id", choices: roleChoices },
            { type: "list", message: "Select the employee's manager: ", name: "manager_id", choices: managerChoices }
        ]);

        await client.query(
            "INSERT INTO employees (first_name, last_name, role_id, manager_id) VALUES ($1, $2, $3, $4)",
            [answers.first_name, answers.last_name, answers.role_id, answers.manager_id]
        );

        const response = await client.query("SELECT * FROM employees");
        console.table(response.rows);
    } catch (err) {
        console.error("An error occurred:", err.message);
    } finally {
        client.release();
    }
    manageEmployees();
};


// Function to update an employee's role
let updateEmployeeRole = async () => {
    console.log("\nUpdating an employee role...");
    const client = await pool.connect();
    try {
        const employees = await client.query("SELECT * FROM employees");
        const roles = await client.query("SELECT * FROM roles");

        const roleChoices = roles.rows.map(role => ({ name: `Role title: ${role.title} --- Role Id: ${role.id}`, value: role.id }));
        const employeeChoices = employees.rows.map(employee => ({ name: `${employee.first_name} ${employee.last_name} --- Current Role: ${employee.role_id}`, value: employee.id }));

        const answers = await inquirer.prompt([
            { type: "list", message: "Select the employee whose role you would like to update: ", name: "employee_id", choices: employeeChoices },
            { type: "list", message: "Select the employee's new role: ", name: "role_id", choices: roleChoices }
        ]);

        await client.query(
            "UPDATE employees SET role_id = $2 WHERE id = $1",
            [answers.employee_id, answers.role_id]
        );

        const response = await client.query("SELECT * FROM employees");
        console.table(response.rows);
    } catch (err) {
        console.error("An error occurred:", err.message);
    } finally {
        client.release();
    }
    manageEmployees();
};

// Function to view all roles
let viewAllRoles = async () => {
    console.log("\nViewing all roles...");
    try {
        const client = await pool.connect();
        const response = await client.query("SELECT * FROM roles");

        console.log('Roles:', response.rows); // Debugging output

        if (response.rows.length === 0) {
            console.log('No roles found.');
        } else {
            console.table(response.rows);
        }

        client.release();
    } catch (err) {
        console.log('Error:', err.message);
    }
    manageEmployees();
};


// Function to add a new role
let addRole = async () => {
    console.log("\nAdding a new role to an existing department...");
    console.info("To add a new role, you must first select a department.");
    console.info("If the department does not exist, add it first.");
    const client = await pool.connect();
    try {
        const departments = await client.query("SELECT * FROM departments");
        const departmentChoices = departments.rows.map(department => ({ name: department.name, value: department.id }));

        const answers = await inquirer.prompt([
            { type: "list", message: "Select the department for this role: ", name: "department_id", choices: departmentChoices },
            { type: "input", message: "Enter a title for the new role: ", name: "title", validate: (title) => /^[a-zA-Z\s]+$/.test(title.trim()) ? true : 'Please enter a valid title' },
            { type: "input", message: "Enter the annual salary for the new role: ", name: "salary", validate: (salary) => {
                let pay = parseFloat(salary);
                return (!isNaN(pay) && pay >= 10000.00 && pay <= 1000000.00) ? true : 'Enter a valid salary amount up to 6 digits and 2 decimal places (e.g., 123456.89)';
            }}
        ]);

        const title = answers.title.charAt(0).toUpperCase() + answers.title.slice(1).toLowerCase();

        await client.query(
            "INSERT INTO roles (department_id, title, salary) VALUES ($1, $2, $3)",
            [answers.department_id, title, answers.salary]
        );

        console.log(`\nRole '${title}' added successfully.`);
    } catch (err) {
        console.error("An error occurred:", err.message);
    } finally {
        client.release();
    }
    manageEmployees();
};

// Function to view all departments
let viewAllDepartments = async () => {
    console.log("\nViewing all departments...");
    const client = await pool.connect();
    try {
        const response = await client.query("SELECT id, name FROM departments");
        console.table(response.rows);
    } catch (err) {
        console.error("An error occurred:", err.message);
    } finally {
        client.release();
    }
    manageEmployees();
};

// Function to add a new department
let addDepartment = async () => {
    console.log("\nAdding a department to the department table...");
    const client = await pool.connect();
    try {
        const currentDepartments = await client.query("SELECT * FROM departments");
        console.log("Here are the current departments in the database: ");
        console.table(currentDepartments.rows);

        const answers = await inquirer.prompt([
            { type: "input", message: "Enter the name of the department: ", name: "department_name", validate: (department_name) => department_name.trim().length > 0 ? true : 'Please enter a valid department name' }
        ]);

        const department_name = answers.department_name.charAt(0).toUpperCase() + answers.department_name.slice(1).toLowerCase();

        await client.query(
            "INSERT INTO departments (name) VALUES ($1)",
            [department_name]
        );

        console.log(`\nDepartment '${department_name}' added successfully.`);
    } catch (err) {
        console.error("An error occurred:", err.message);
    } finally {
        client.release();
    }
    manageEmployees();
};

manageEmployees();
