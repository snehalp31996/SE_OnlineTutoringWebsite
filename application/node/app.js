/**
 * Main entry point into the application.
 *
 * This file is in charge of defining our required imports, setting up basic information for the app to run.
 * And then start the node server to listen for new connections.
 *
 * @author Cameron Robinson.
 * @date 10/21/2021
 * @since  0.0.1
 */

const express = require('express')
const path = require('path');

const app = express()

// When someone accesses / we pass the call to the controller/index.js file
app.use('/', require('./controller/index'));

// Tell node our templates will be under the views directory
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// These lines tell node to look for static files under these paths.
// This is how we can set images directly in the files rather than through the code
app.use( express.static( "public" ) );

// This line sets the port during deployment or sets to default of 3020 before
// starting the server. Do not change this line as it may cause deployment
// to break.
const port = process.env.PORT || 3020
app.listen(port, () => console.log('Server started on port: ', port))

module.exports = app;