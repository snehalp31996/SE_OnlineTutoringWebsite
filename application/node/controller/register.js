/**
 *
 * This file is used when the user attempt to register. It takes the data user inputs and
 * inserts it into the database. If user is already logged in and attempts to register, it 
 * redirects them to the home page. Otherwise, it continues to the registration page. If user
 * is already registered and they attempt to register again, they are redirected to the login
 * page. Otherwise, it continues to the registration page.
 *
 * @author Rollin Kung and Cameron Robinson.
 * @date 12/10/2021
 * @since  0.0.1
 */

const express = require('express');
const router = express.Router();

const loginHashing = require("../model/loginHashing");

const {database, mysql} = require('../model/mysqlConnection');

/**
 * This function is called when user submits data on the registration page. The data
 * that the user has given is inserted into the database.
 * @param request the request from the user that will be inserted into the database
 * @param callback 
 */
function registerUser(request, response, callback){

    const hashedPassword = loginHashing.hashPasswordForRegistration(request.body.password);

    const email = request.body.email;
    const password_hashed = hashedPassword.hash;
    const password_salt = hashedPassword.salt;
    const first_name = request.body.first_name;
    const last_name = request.body.last_name;
    const major = request.body.major_dropdown;

    const sqlSearch = "SELECT * FROM users WHERE email = ?";
    const search_query = mysql.format(sqlSearch,[email]);

    request.registered = false;

    database.query (search_query, async (err, result) => {  
        
        if (err) throw (err)
        
        if (result.length != 0) {
            console.log("------> User already exists");

            callback()
        } 
        else {
            let majorIdQuery = "SELECT major_id FROM major WHERE major_short_name = ?";
            majorIdQuery = mysql.format(majorIdQuery,[major]);
            
            database.query (majorIdQuery, async (err, result)=> {  
                
                let majorId = result[0]['major_id']

                if (result.length > 0) {

                    const sqlInsert = "INSERT INTO users (email, password_hashed, password_salt, first_name, last_name, major) VALUES (?,?,?,?,?,?)";
                    const insert_query = mysql.format(sqlInsert,[email, password_hashed, password_salt, first_name, last_name, majorId]);
                    database.query (insert_query, (err, result)=> {   
                
                        if (err) throw (err);

                        request.registered = true;
                        callback()
                    })
                }
                else {

                    // TODO: Set "unknown error" here. This is if the user somehow selects an unknown major.
                    callback()
                }
            });

        }
    })
}

/***
 * If the user attempt to load the register page but is already logged in we will redirect them to /
 * otherwise we render the register page.
 */
router.get('/', (req, res) => {

    if(req.loginValidated) {

        res.redirect("/");
    }
    else {
        res.render("register");
    }
});

/***
 * When the user submits the registration form the data is directed here, we call the register user function above
 * to insert the user into the database. After that function completes we are passed back here. We either 
 * render the login page from here and pass the userRegistered value to the 
 * login page to show a thank you for registering message or we rerender the 
 * register page and display an error message
 */
router.post('/', registerUser, (req, res) => {

    if(req.registered) {

        res.render("login", {
            userRegistered: true
        });
    }
    else {

        // TODO: Display error message here.
        res.render("register", {
            userRegistered: false
        });
    }
});

module.exports = router;