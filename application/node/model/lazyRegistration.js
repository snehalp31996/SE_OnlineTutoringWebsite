/**
 *
 * This file defines the model for lazy registration and the getting and removal of that object.
 *
 * When requested the refering page and data object will be wrapped in an object to be stored in the request object
 * by the caller. The remove function will delete that object from the session data before passing controll to the
 * callback. This will enable us to return to the previous page where we want to lazy register from and restore the
 * entered data but if the user migrates away from the registration/login page before completing the page we will
 * remove the cache from the session.
 *
 * @author Cameron Robinson.
 * @date 11/18/2021
 * @since  0.0.1
 */

function getLazyRegistrationObject(referringPage, data) {
    return {
        referringPage: referringPage,
        data: data
    }
}

function removeLazyRegistrationObject(req, res, callback) {
    delete req.session.lazyRegistration;
    callback();
}

module.exports = {
    getLazyRegistrationObject,
    removeLazyRegistrationObject
};