/**
 *
 * This file is in charge of connecting to the database and retrieving the tutor data when
 * the user clicks on a link to the view a tutor page link.
 */

const express = require('express');
const router = express.Router();

const lazyReg = require('../model/lazyRegistration');

const { database, mysql } = require('../model/mysqlConnection');

/***
 * This function extracts the tutor first name, last name and the tutor post number from the url
 * when a user views a tutor posting page.
 * @param url
 * @returns {{tutorPostId: string, tutorLastName: string, tutorFirstName: string}}
 */
function parseTutorDataFromURL(url) {

    // Pares the tutor ID out of the url. TODO: This can probably be simplified but is working for now.
    let tutor = url.replace("/tutor/", "");
    tutor = tutor.substring(1, tutor.length);

    tutor = tutor.split("-");

    // Get the first name, last name and tutor id from the data.
    let tutorFirstName = tutor[0];
    let tutorLastName = tutor[1];

    // Get the tutor post id from the end, remove the first character to end up with only a numeric value.
    let tutorPostId = tutor[2];
    tutorPostId = tutorPostId.substring(1, tutorPostId.length);

    return {
        tutorFirstName: tutorFirstName,
        tutorLastName: tutorLastName,
        tutorPostId: tutorPostId
    }
}

/**
 * sendMessage is responsible for making the insert into the database for the newly added message. To get to this
 * point the user must be logged in and sending a message to a tutor from a valid tutor page.
 * @param request
 * @param response
 */
function sendMessage(request, response) {

    let tutorURLData = parseTutorDataFromURL(request.url);
    let tutorPostId = tutorURLData.tutorPostId;

    // Get the current userID from the session data and get the message text from the body the form request.
    let fromUserID = request.session.userID;
    let messageText = request.body.messageText;

    // Create a new datetime to be stored as the send time.
    let dateNow = new Date().toISOString().slice(0, 19).replace('T', ' ');

    let tutorUserIdQuery = `SELECT tutor_post.user_id,\n`+
                            `       tutor_post.tutor_post_id\n` +
                            `FROM tutor_post\n` +
                            `WHERE tutor_post.tutor_post_id = ?;`
    tutorUserIdQuery = mysql.format(tutorUserIdQuery,[tutorPostId]);
    database.query(tutorUserIdQuery, (err, result) => {
        if(err) {
            console.log(`Encountered an error when performing query: ${tutorUserIdQuery}`);
        }
        else if(result.length > 0) {

            let toUserID = result[0]['user_id']
            // Create the query for inserting the message to the database/
            let query = `INSERT INTO messages (date_sent,message_text,to_user,from_user) VALUES (?,?,?,?)`;
            query = mysql.format(query,[dateNow, messageText, toUserID, fromUserID]);

            database.query(query, (err) => {

                // If we hit an error we want to display an error on the page so set this bool to false here.
                let messageSent = false;

                // If we hit an error with the mysql connection or query we just return the above empty data
                // since we have no data to display from the database. This should never happen in production.
                if(err) {
                    console.log(`Encountered an error when performing query: ${query}`);
                }
                else {
                    // If there is no error we set messageSent to true to display a success message on the page.
                    messageSent = true;
                }

                // Render the tutor info page with proper data and the boolean value of if the message was sent.
                response.render('tutorinfo',{
                    tutorData: request.tutorData,
                    image: request.image,
                    messageSent: messageSent
                });
            })
        }
    });
}

/**
 * getTutorInfo handles the retrieval of tutor data from the database to be displayed on a tutor info page.
 * It currently uses the url created on the search page to parse out the first name, last name and tutor id and
 * then performs the query for the tutor data. If the data does not exists or the url doesnt match the found data
 * we send a 404 because something went wrong.
 * @param request
 * @param response
 * @param callback
 */
function getTutorInfo(request, response, callback) {

    let tutorURLData = parseTutorDataFromURL(request.url);
    let tutorPostId = tutorURLData.tutorPostId;

    let query = `SELECT users.user_id,\n` +
                `       users.first_name,\n` +
                `       users.last_name,\n` +
                `       tutor_post.tutor_post_id,\n` +
                `       tutor_post.user_id,\n` +
                `       tutor_post.post_image AS image,\n` +
                `       tutor_post.post_details,\n` +
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
                `WHERE tutor_post.admin_approved = 1 AND ` +
                `tutor_post.tutor_post_id = ?`
    query = mysql.format(query,[tutorPostId]);

    // Perform the query on the database passing the result to our anonymous callback function.
    database.query(query, (err, result) => {

        // If we hit an error with the mysql connection or query we just return the above empty data
        // since we have no data to display from the database. This should never happen in production.
        if(err) {
            console.log(`Encountered an error when performing query: ${query}`)
            throw(err)
        }
        else if(result.length > 0) {

            // We have received data from the database.
            // Make sure the URL and the requested tutor id are the same, if the passed url names dont match do not continue.
            if(result[0]['first_name'] === tutorURLData.tutorFirstName && result[0]['last_name'] === tutorURLData.tutorLastName) {

                // Append the actual data to the request.
                request.tutorData = result[0];

                // Extract the images from the result and convert from mysql blob to a viewable image.
                let image = result[0]['image'];
                if(image !== null) {
                    image = Buffer.from(image.toString('base64'))
                }
                request.image = image;
            }
        }

        callback();
    });
}

/***
 * If a user attempts to load the /tutor page we return 404.
 */
router.get('/', (req, res) => {
  res.sendStatus(404);
});

/***
 * If a user attempts to contact a tutor but they are not logged in this path is routed to first. We stop here and
 * save all of the post data the user had already entered into the form before then continuing on to the login page.
 */
router.post("/contactlogin", (req, res) => {

    req.session.lazyRegistration = lazyReg.getLazyRegistrationObject(req.body.referringTutorPage, req.body.messageText);
    res.redirect('/login');
});

/***
 * All requests under tutor/ will be routed here we extract the specific tutor being requested from the url in the
 * parseTutorDataFromURL function above. After getting the tutor data we check if the user is logged in and if
 * so we check if there is lazyRegistration data saved in the session storage. If needed we unwrap the saved data
 * and append it back to the response before then rendering the page. The saved data will be pasted back into
 * the form fields when the page is rendered.
 */
router.get("/*", getTutorInfo, (req, res) => {

    // If the data was not found and appended to the request we want to return 404 because something went wrong.
    if(req.tutorData) {

        if(req.loginValidated) {

            if(req.session.lazyRegistration) {
                res.locals.messageText = req.session.lazyRegistration.data;
                delete req.session.lazyRegistration;
            }
        }

        res.render('tutorinfo',{
            tutorData: req.tutorData,
            image: req.image
        });
    }else {

        res.sendStatus(404);
    }
});

/***
 * When the user posts data to the server to send a message to a tutor this route is called. It will capture
 * the entered data and pass it to the send message function. If the user is not logged in it will not
 * send the message but that should not happen because we check if the user needs to login before reaching this point
 * and perform lazy registration.
 */
router.post("/*", getTutorInfo, (req, res) => {

    // If the data was not found and appended to the request we want to return 404 because something went wrong.
    if(req.tutorData) {

        if(req.loginValidated) {

            sendMessage(req, res);
        }
        else {
            //TODO: Need lazy registration here.
            res.render('tutorinfo',{
                tutorData: req.tutorData,
                image: req.image
            });
        }
    }else {

        res.sendStatus(404);
    }
});

module.exports = router;