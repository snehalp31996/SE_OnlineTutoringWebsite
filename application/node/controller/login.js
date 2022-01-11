/**
 *
 * This file used when the user attempt to login, it contacts the database and retrieves the required user
 * data before then checking credentials. If the credentials are validated it stores a token in the database and
 * user data to be used in future instances of validation.
 *

 */

const express = require('express');
const router = express.Router();

const loginHashing = require("../model/loginHashing");

const { database, mysql } = require('../model/mysqlConnection');

/**
 * This function is called during every route processing stage. It checks if the user has been logged in and validated
 * and if so appends data into the response locals for the view to process when displaying the page.
 * After checking if the user is logged in the callback is fired to continue the callstack.
 * @param request the request from the user passed from the previous function in the callstack
 * @param response the response to be delivered to the user
 * @param callback the next function in the callstack
 */
function validateUser(request, response, callback) {

    // Set this data immediately to be used by the next callback if needed.
    request.loginValidated = false;
    response.locals.userLoggedIn = false;

    // If the session has the userID stored in it we know the user is logged in.
    if(request.session.userID) {

        // Update the request data to inform the next function call that the user is logged in.
        request.loginValidated = true;

        // Check if the user is a tutor and if so set the response data to true signaling the rendered view
        // to modify the view to suit a tutor rather than a student.
        response.locals.userIsTutor = false;
        if(request.session.userIsTutor) {
            response.locals.userIsTutor = true;
        }

        // Update the response to contain the user logged in flag and the user's first name for the header
        response.locals.userLoggedIn = true;
        response.locals.userFirstName = request.session.firstName;
    }
    callback()
}

/**
 * This function is called when the user attempts to log in from the login page.
 * It parses out the supplied data from the user before building and querying the database.
 * If the username is found in the database it attempts to validate the supplied password using the helper function.
 * If everything is valid it sets the session data before finally passing to the next function in the callstack.
 *
 * @param request the request from the user passed from the previous function in the callstack
 * @param response the response to be delivered to the user
 * @param callback the next function in the callstack
 */
function validateUserForLogin(request, response, callback) {

    // Get the user email and user entered password from the request body. This is the data from the form on the
    // login page and uses the body-parser middleware module loaded in app.js to be visible here.
    let userEmail = request.body.userEmail;
    let enteredPassword = request.body.enteredPassword;

    // Create query for database. We want to get all basic user data to finalize login as well as left outer joining
    // on the tutors table in case the user is a tutor. If the user is not on the tutors table the tutors.tutor_id
    // column will be null. We also make sure that the user email is valid. if the user entered an invalid email
    // this query will return an empty array
    let query = `SELECT users.user_id,\n` +
        `       users.first_name,\n` +
        `       users.email,\n` +
        `       users.password_hashed,\n` +
        `       users.password_salt\n` +
        `FROM users\n` +
        `WHERE users.email = ?`;
    query = mysql.format(query,[userEmail]);

    // Perform the query on the database passing the result to our anonymous callback function.
    database.query(query, (err, result) => {

        // If we hit an error with the mysql connection or query we just return the above empty data
        // since we have no data to display from the database. This should never happen in production.
        if(err) {
            console.log(`Encountered an error when performing query: ${query}`)
        }
        else {

            // If there is a result we know the user email is at least valid.
            if(result.length > 0) {

                // Call helper method with the data from the database and the entered password. If the password
                // matches our database's hash we will enter the If.
                if(loginHashing.validatePassword(result[0]['password_hashed'],
                    result[0]['password_salt'],
                    enteredPassword)) {

                    // Set up the session data appending the first name, userID and if the user is a tutor.
                    request.session.firstName = result[0]['first_name'];
                    request.session.userID = result[0]['user_id'];
                }
            }
        }

        // pass the data to the next callback in the queue.
        callback();
    });
}

/**
 * Route path for get /login, when the user first attempts to load into the login page. If the user is already logged in
 * redirects to /.
 */
router.get('/', (req, res) => {

    if(req.loginValidated) {
        res.redirect("/");
    }
    else {
        res.render("login");
    }
});

/**
 * Route for posting data to /login, when the user attempts to submit data to log in, passes data to the validation
 * function before getting called back here. If the data is valid redirects to / if not passes data to the view to
 * show the invalid username / password error
 */
router.post('/', validateUserForLogin, validateUser, (req, res) => {

    if(req.loginValidated) {

        if(req.session.lazyRegistration) {
            res.redirect(req.session.lazyRegistration.referringPage);
        }
        else {
            res.redirect("/");
        }
    }
    else {
        res.render("login", {
            invalidAttempt: true
        });
    }
});

module.exports = {
    router: router,
    validateUser
};