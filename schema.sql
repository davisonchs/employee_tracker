DROP DATABASE IF EXISTS employee;
CREATE DATABASE employee;

USE employee;

CREATE TABLE departments (
  id SERIAL PRIMARY KEY,
  department_name VARCHAR(30) unique NOT NULL
  );

CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  title VARCHAR(30) unique NOT NULL,
  salary DECIMAL(10, 2) NOT NULL,
  department_id INT NOT NULL,
  FOREIGN KEY (department_id) REFERENCES department(id)
  );

CREATE TABLE employees (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(30) NOT NULL,
  last_name VARCHAR(30) NOT NULL,
  role_id INT NOT NULL,
  manager_id INT,
  FOREIGN KEY (role_id) REFERENCES role(id),
  FOREIGN KEY (manager_id) REFERENCES employee(id)
  );
  