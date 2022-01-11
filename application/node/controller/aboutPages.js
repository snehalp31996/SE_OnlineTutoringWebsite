/**
 * This file contains all of the paths and routes for the about pages. This is refactored out of the index file to
 * keep the structure more clean.
 *
 * @author Cameron Robinson.
 * @date 11/16/2021
 * @since  0.0.1
 */

const express = require('express');
const router = express.Router();

// This module is used in this file in order to remove the lazy registration object from the session data if it exists.
// All of these routes no not need to include the lazy registration functionality so we can clean it up if the user accesses
// these pages
const lazyReg = require("../model/lazyRegistration");

// When a user enters site/about express first looks for /about in app.js which forwards to this file. Then becuase there
// is no further path looks for the root path in this file, which will be the response below that renders the about page.
router.get('/', lazyReg.removeLazyRegistrationObject, (req, res) => {
    res.render("about");
});

// All paths /about/name will route here.
// Should store our data in the database and use a template for each of these requests but have not
// started work on it. Is low priority.
router.get('/ckRobinson', lazyReg.removeLazyRegistrationObject, (req, res) => {
    res.render('about/ckRobinson');
});
router.get('/dsElnaggar', lazyReg.removeLazyRegistrationObject, (req, res) => {
    res.render('about/dsElnaggar');
});
router.get('/jamespratt', lazyReg.removeLazyRegistrationObject, (req, res) => {
    res.render('about/jamespratt');
});
router.get('/rKung', lazyReg.removeLazyRegistrationObject, (req, res) => {
    res.render('about/rKung');
});
router.get('/snehalP', lazyReg.removeLazyRegistrationObject, (req, res) => {
    res.render('about/snehalP');
});
router.get('/srRoy', lazyReg.removeLazyRegistrationObject, (req, res) => {
    res.render('about/srRoy');
});

module.exports = router;