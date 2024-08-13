const { Pool } = require('pg'); // Import the Pool class from pg

// Create a new pool instance with your database configuration
const pool = new Pool({
    user: 'postgres', // Replace with your database username
    host: 'localhost',
    database: 'employee_tracker', // Replace with your database name
    password: 'Iphone15pro*', // Replace with your database password
    port: 5432,
});

module.exports = pool; // Export the pool instance
