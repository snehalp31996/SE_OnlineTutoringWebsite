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

const express = require('express');
const router = express.Router();
const date = require('date-and-time')

const { database, mysql } = require('../model/mysqlConnection');
const lazyReg = require("../model/lazyRegistration");

const searchPostPreviewLength = 100

/***
 * getSearchCategories currently retrieves the short and long names of all majors in the database. This can be updated
 * at a later point when we have all of the search categories set in stone. This allows us to dynamically adjust
 * what the users are allowed to select during search to filter the results by. The results found here are appended
 * to the request variable before the callback is called.
 *
 * @param request the request from the user to be processed by the server.
 * @param response the response that will eventually be rendered to the user
 * @param callback the next method in the call stack before the response is rendered to the user.
 */
function getSearchCategories(request, response, callback) {

    // Set up the query to select all of the data from the majors table in the database.
    let query = `SELECT * FROM major`;

    // Perform the query on the database passing the result to our anonymous callback function.
    database.query(query, (err, result) => {

        // Append default data to the request before calling callback, this make sure we at least return
        // an empty array of no results if something goes wrong, hopefully preventing a crash.
        request.majors_short_name = [];
        request.majors_long_name = [];

        // If we hit an error with the mysql connection or query we just return the above empty data
        // since we have no data to display from the database. This should never happen in production.
        if(err) {
            console.log(`Encountered an error when performing query: ${query}`);
        }
        else {

            // Go through all of the resulting data and append it to the two lists
            for(let i = 0; i < result.length; i++) {

                let item = result[i];
                request.majors_short_name.push(item['major_short_name']);
                request.majors_long_name.push(item['major_long_name']);
            }

            // Store the data found in the response before passing to callback. This is done
            // to make it cleaner to load the search categories in the header of all of the required pages
            // rather than passing data back to the final callback to be appended to the response.
            response.locals.searchCategoriesShortName = request.majors_short_name;
            response.locals.searchCategoriesLongName = request.majors_long_name;
        }

        // pass the data to the next callback in the queue.
        callback();
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

    // Append the actual data to the response.
    response.locals.searchTerm = searchTerm;
    response.locals.category = category;

    // Create the query based on the data passed. By default we return everything from the table.
    let allPostsQuery = `SELECT users.first_name,\n` +
                        `       users.last_name,\n` +
                        `       tutor_post.tutor_post_id,\n` +
                        `       tutor_post.user_id,\n` +
                        `       tutor_post.post_thumbnail AS thumbnail,\n` +
                        `       tutor_post.post_details,\n` +
                        `       tutor_post.post_created,\n` +
                        `       tutor_post.admin_approved,\n` +
                        `       tutor_post.tutoring_course_id,\n` +
                        `       course.number AS courseNumber,\n` +
                        `       course.title AS courseTitle,\n` +
                        `       major.major_long_name,\n` +
                        `       major.major_short_name\n` +
                        `FROM tutor_post\n` +
                        `JOIN users ON tutor_post.user_id = users.user_id\n` +
                        `JOIN course ON tutor_post.tutoring_course_id = course.course_id\n` +
                        `JOIN major ON course.major = major.major_id\n` +
                        `WHERE tutor_post.admin_approved = 1\n` +
                        `ORDER BY tutor_post.post_created DESC`;

    let query = allPostsQuery;
    if(searchTerm !== '' && category !== '') {
        query = `SELECT users.first_name,\n` +
                `       users.last_name,\n` +
                `       tutor_post.tutor_post_id,\n` +
                `       tutor_post.user_id,\n` +
                `       tutor_post.post_thumbnail AS thumbnail,\n` +
                `       tutor_post.post_details,\n` +
                `       tutor_post.post_created,\n` +
                `       tutor_post.admin_approved,\n` +
                `       tutor_post.tutoring_course_id,\n` +
                `       course.number AS courseNumber,\n` +
                `       course.title AS courseTitle,\n` +
                `       major.major_long_name,\n` +
                `       major.major_short_name\n` +
                `FROM tutor_post\n` +
                `JOIN users ON tutor_post.user_id = users.user_id\n` +
                `JOIN course ON tutor_post.tutoring_course_id = course.course_id\n` +
                `JOIN major ON course.major = major.major_id\n` +
                `WHERE tutor_post.admin_approved = 1 AND\n` +
                `(users.first_name LIKE ? OR users.last_name LIKE ? OR course.title LIKE ? OR course.number LIKE ? OR major.major_short_name LIKE ? OR CONCAT(major.major_short_name,' ', course.number) LIKE ? OR CONCAT(major.major_short_name, course.number) LIKE ? OR CONCAT(major.major_long_name, ' ', course.number) LIKE ? OR CONCAT(major.major_long_name, course.number) LIKE ?) AND ` +
                `major.major_short_name = ?\n` +
                `ORDER BY tutor_post.post_created DESC`;
        query = mysql.format(query,['%'+searchTerm+'%', '%'+searchTerm+'%', '%'+searchTerm+'%', '%'+searchTerm+'%', '%'+searchTerm+'%', '%'+searchTerm+'%', '%'+searchTerm+'%', '%'+searchTerm+'%', '%'+searchTerm+'%', category]);
    }
    else if(searchTerm !== '' && category === '') {
        query = `SELECT users.first_name,\n` +
                `       users.last_name,\n` +
                `       tutor_post.tutor_post_id,\n` +
                `       tutor_post.user_id,\n` +
                `       tutor_post.post_thumbnail AS thumbnail,\n` +
                `       tutor_post.post_details,\n` +
                `       tutor_post.post_created,\n` +
                `       tutor_post.admin_approved,\n` +
                `       tutor_post.tutoring_course_id,\n` +
                `       course.number AS courseNumber,\n` +
                `       course.title AS courseTitle,\n` +
                `       major.major_long_name,\n` +
                `       major.major_short_name\n` +
                `FROM tutor_post\n` +
                `JOIN users ON tutor_post.user_id = users.user_id\n` +
                `JOIN course ON tutor_post.tutoring_course_id = course.course_id\n` +
                `JOIN major ON course.major = major.major_id\n` +
                `WHERE tutor_post.admin_approved = 1 AND\n` +
                `(users.first_name LIKE ? OR users.last_name LIKE ? OR course.title LIKE ? OR course.number LIKE ? OR major.major_short_name LIKE ? OR CONCAT(major.major_short_name,' ', course.number) LIKE ? OR CONCAT(major.major_short_name, course.number) LIKE ? OR CONCAT(major.major_long_name, ' ', course.number) LIKE ? OR CONCAT(major.major_long_name, course.number) LIKE ?)` +
                `ORDER BY tutor_post.post_created DESC`;
        query = mysql.format(query,['%'+searchTerm+'%', '%'+searchTerm+'%', '%'+searchTerm+'%', '%'+searchTerm+'%', '%'+searchTerm+'%', '%'+searchTerm+'%', '%'+searchTerm+'%', '%'+searchTerm+'%', '%'+searchTerm+'%']);
    }
    else if(searchTerm === '' && category !== '') {
        query = `SELECT users.first_name,\n` +
                `       users.last_name,\n` +
                `       tutor_post.tutor_post_id,\n` +
                `       tutor_post.user_id,\n` +
                `       tutor_post.post_thumbnail AS thumbnail,\n` +
                `       tutor_post.post_details,\n` +
                `       tutor_post.post_created,\n` +
                `       tutor_post.admin_approved,\n` +
                `       tutor_post.tutoring_course_id,\n` +
                `       course.number AS courseNumber,\n` +
                `       course.title AS courseTitle,\n` +
                `       major.major_long_name,\n` +
                `       major.major_short_name\n` +
                `FROM tutor_post\n` +
                `JOIN users ON tutor_post.user_id = users.user_id\n` +
                `JOIN course ON tutor_post.tutoring_course_id = course.course_id\n` +
                `JOIN major ON course.major = major.major_id\n` +
                `WHERE tutor_post.admin_approved = 1 AND\n` +
                `major.major_short_name = ?\n` +
                `ORDER BY tutor_post.post_created DESC`;
        query = mysql.format(query,[category]);
    }

    // Perform the query on the database passing the result to our anonymous callback function.
    database.query(query, (err, result) => {

        // Append default data to the request before calling callback.
        request.searchResult = "";
        request.searchTerm = "";
        request.category = "";
        request.images = [];
        request.pageNum = 1;
        request.upperBound = "";
        request.lowerBound = "";

        // If we hit an error with the mysql connection or query we just return the above empty data
        // since we have no data to display from the database. This should never happen in production.
        if(err) {
            console.log(`Encountered an error when performing query: ${query}`);
        }
        else if(result.length > 0){
            extractDataFromQuery(result, request, response, callback)
        }
        else {
            response.locals.noResultsFound = true
            database.query(allPostsQuery, (err, result) => {
                if(err) {
                    console.log(`Encountered an error when performing query: ${query}`);
                }
                extractDataFromQuery(result, request, response, callback)
            });
        }
    });
}

function extractDataFromQuery(result, request, response, callback) {

    // Set default page number to 0 as we use the 0 index to calculate array
    // indices.
    let pageNum = 0;
    if(request.query.page) {

        // if the request has the page value we want to get the page value passed
        // from the user to overwrite our default above. Page 1 wants page index 0
        // and page 2 wants index 1 so we set the pageNum - 1 here.
        pageNum = request.query.page - 1;
    }
    request.pageNum = pageNum;

    // We have received data from the database.
    // Extract all of the images from the result and convert them from mysql blob to a viewable image.
    let thumbnails = [];
    for(let i = 0; i < result.length; i++) {

        let thumbnail = result[i]['thumbnail'];
        if(thumbnail !== null) {

            thumbnail = Buffer.from(thumbnail.toString('base64'));
            thumbnails.push(thumbnail);
        }

        result[i]['post_details_previewed'] = false;
        if(result[i]['post_details'].length > searchPostPreviewLength) {
            result[i]['post_details'] = result[i]['post_details'].slice(0, searchPostPreviewLength);
            result[i]['post_details_previewed'] = true;
        }

        let newDate = new Date(result[i]['post_created'] - result[i]['post_created'].getTimezoneOffset()*60*1000);
        result[i]['post_created'] = date.format(newDate,'ddd, MMM DD YYYY HH:mm A')
    }

    // Since pageNum is always 0 indexed and always has a int value
    // set above we can calculate what items we want to display here.
    // if pageNum is 0 we get indices 0 through 4, etc.
    //
    // TODO: Make sure the page number indices is valid, if user attempts
    // to load an invalid page number we'll hit a index out of bound error here.
    request.searchResult = result.slice(pageNum * 5, (pageNum * 5) + 5);
    request.thumbnails = thumbnails.slice(pageNum * 5, (pageNum * 5) + 5);

    request.totalNum = result.length;
    request.totalPages = Math.ceil(request.totalNum / 5)

    request.upperBound = (pageNum * 5) + 5;

    if((pageNum * 5) + 5 > result.length) {
        request.upperBound = result.length
    }

    request.lowerBound = (pageNum * 5) + 1;

    callback()
}

/**
 * The home page is rendered here, we first pass the call to searchCategories to retrieve the categories from
 * the database. Then we pass to the search method to actually search if we have data to search with. Search and
 * searchCategories are both mart of the model which hold code that performs the interaction with the SQL database.
 * The search method then calls the final callback (anonymous function here) that renders the data for the client.
 */
router.get('/', lazyReg.removeLazyRegistrationObject, search, (req, res) => {

    // If the search result is not an array we create an empty array
    // to keep from type errors in the template. This is temporary
    // because of loading the index page into a black VP template page
    // when we have a real search bar across the site this will be removed.
    let searchResult = req.searchResult;
    if (Array.isArray(searchResult) === false) {
        searchResult = [];
    }

    // Render the vertical prototype template, passing data from
    // model
    res.render("search", {
        results: 1,
        pageNum: req.pageNum,
        searchResult: searchResult,
        images: req.thumbnails,
        totalNum: req.totalNum,
        upperBound: req.upperBound,
        lowerBound: req.lowerBound,
        numPages: req.totalPages
    });
});

module.exports = {
    router: router,
    search,
    getSearchCategories
};