/**
 *
 * This file contains the database object that is the connection to the database. Requiring this file will allow
 * access to the database object to make queries on the database.
 *
 * @author Cameron Robinson and Snehal Patil.
 * @date 11/17/2021
 * @since  0.0.1
 */

const mysql = require("mysql");

/**
 * Create the database connection, either pulling the environment data or using the default data here.
 */
const database = mysql.createConnection({
    host: 'localhost',
    user: process.env.DB_USER || "admin",
    password: process.env.DB_PASSWORD || "admin-648T3",
    database: process.env.DATABASE || "csc648t3_testing"
});

/**
 * Make the connection to the database, if the connection does not work, throw an error.
 */
database.connect((err) => {
    if(err) throw err;
    console.log("Connected to mysql database.");
});

module.exports = {
    database: database,
    mysql: mysql
}