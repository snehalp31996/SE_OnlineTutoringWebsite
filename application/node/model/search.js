/**
 * Model file that controls the interaction to the database for the search bar.
 *
 * This file queries the database and retrieves the search categories and the results of a user search.
 * The search categories are dynamically rendered from the database's major table and the search method
 * creates a query using %LIKE and WHERE to return only the options that the user requested.
 *
 * @author Cameron Robinson.
 * @date 10/21/2021
 * @since  0.0.1
 */

/*
TODO:
 Should move this connection out of this file to a more global declaration.
 Keeping here for now.
*/
const mysql = require("mysql");

const database = mysql.createConnection({
    host: 'localhost',
    user: process.env.DB_USER || "admin",
    password: process.env.DB_PASSWORD || "admin-648T3",
    database: process.env.DATABASE || "csc648t3_testing"
})
database.connect((err) => {
    if(err) throw err;
    console.log("connected");
});

/***
 * searchCategories currently retrieves the short and long names of all majors in the database. This can be updated
 * at a later point when we have all of the search categories set in stone. This allows us to dynamically adjust
 * what the users are allowed to select during search to filter the results by. The results found here are appended
 * to the request variable before the callback is called.
 *
 * @param request the request from the user to be processed by the server.
 * @param response the response that will eventually be rendered to the user
 * @param callback the next method in the call stack before the response is rendered to the user.
 */
function searchCategories(request, response, callback) {

    // Set up the query to select all of the data from the majors table in the database.
    let query = `SELECT * FROM major`;

    // Perform the query on the database passing the result to our anonymous callback function.
    database.query(query, (err, result) => {

        // Append default data to the request before calling callback, this make sure we at least return
        // an empty array of no results if something goes wrong, hopefully preventing a crash.
        request.majors_short_name = []
        request.majors_long_name = []

        // If we hit an error with the mysql connection or query we just return the above empty data
        // since we have no data to display from the database. This should never happen in production.
        if(err) {
            console.log(`Encountered an error when performing query: ${query}`)
        }
        else {

            // Go through all of the resulting data and append it to the two lists
            for(let i = 0; i < result.length; i++) {

                let item = result[i]
                request.majors_short_name.push(item['major_short_name']);
                request.majors_long_name.push(item['major_long_name']);
            }
        }

        // pass the data to the next callback in the queue.
        callback()
    });
}

/***
 * This function performs the search of the mysql database and passes all values found into a callback function.
 *
 * @param request The request from the user sent to the server, contains all data needed to perform the search
 * @param response The response that will be rendered to the user in the final callback method.
 * @param callback The function that we pass the data to after finishing the search.
 */
function search(request, response, callback) {

    // Extract the search query and category from the request. These are set by the form on the page.
    let searchTerm = request.query.search;
    let category = request.query.category;

    // Create the query based on the data passed. By default we return everything from the table.
    let query = `SELECT users.user_id,\n` +
                `       users.first_name,\n` +
                `       users.last_name,\n` +
                `       users.major,\n` +
                `       tutors.tutor_id,\n` +
                `       tutors.image,\n` +
                `       major.major_long_name,\n` +
                `       major.major_short_name\n` +
                `FROM tutors\n` +
                `JOIN users ON users.user_id = tutors.tutor_id\n` +
                `JOIN major ON users.major = major.major_id`;
    if(searchTerm !== '' && category !== '') {
        query = `SELECT users.user_id,\n` +
                `       users.first_name,\n` +
                `       users.last_name,\n` +
                `       users.major,\n` +
                `       tutors.tutor_id,\n` +
                `       tutors.image,\n` +
                `       major.major_long_name,\n` +
                `       major.major_short_name\n` +
                `FROM tutors\n` +
                `JOIN users ON users.user_id = tutors.tutor_id\n` +
                `JOIN major ON users.major = major.major_id\n` +
                `WHERE major.major_short_name = '${category}' AND \n` +
                `(users.first_name LIKE '%${searchTerm}%' OR users.last_name LIKE '%${searchTerm}%')`;
    }
    else if(searchTerm !== '' && category === '') {
        query = `SELECT users.user_id,\n` +
                `       users.first_name,\n` +
                `       users.last_name,\n` +
                `       users.major,\n` +
                `       tutors.tutor_id,\n` +
                `       tutors.image,\n` +
                `       major.major_long_name,\n` +
                `       major.major_short_name\n` +
                `FROM tutors\n` +
                `JOIN users ON users.user_id = tutors.tutor_id\n` +
                `JOIN major ON users.major = major.major_id\n` +
                `WHERE (users.first_name LIKE '%${searchTerm}%' OR users.last_name LIKE '%${searchTerm}%')`;
    }
    else if(searchTerm === '' && category !== '') {
        query = `SELECT users.user_id,\n` +
                `       users.first_name,\n` +
                `       users.last_name,\n` +
                `       users.major,\n` +
                `       tutors.tutor_id,\n` +
                `       tutors.image,\n` +
                `       major.major_long_name,\n` +
                `       major.major_short_name\n` +
                `FROM tutors\n` +
                `JOIN users ON users.user_id = tutors.tutor_id\n` +
                `JOIN major ON users.major = major.major_id\n` +
                `WHERE major.major_short_name = '${category}'`;
    }

    // Perform the query on the database passing the result to our anonymous callback function.
    database.query(query, (err, result) => {

        // Append default data to the request before calling callback.
        request.searchResult = "";
        request.searchTerm = "";
        request.category = "";
        request.images = []

        // If we hit an error with the mysql connection or query we just return the above empty data
        // since we have no data to display from the database. This should never happen in production.
        if(err) {
            console.log(`Encountered an error when performing query: ${query}`)
        }
        else {

            // We have received data from the database.
            // Extract all of the images from the result and convert them from mysql blob to a viewable image.
            let images = [];
            for(let i = 0; i < result.length; i++) {

                let image = result[i]['image'];
                if(image !== null) {
                    /*
                    TODO: according to spec this should be a thumbnail. Not sure if
                     we're supposed to convert here or on upload. Something to ask about?
                    */
                    image = Buffer.from(image.toString('base64'))
                    images.push(image)
                }
            }

            // Append the actual data to the request.
            request.searchResult = result;
            request.searchTerm = searchTerm;
            request.category = category;
            request.images = images;
        }

        callback();
    });
}

module.exports = {search, searchCategories};