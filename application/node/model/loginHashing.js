/**
 *
 * This file is a set of helper functions used during the hashing of user password data and other cryptographic security.
 *
 * @author Cameron Robinson.
 * @date 11/17/2021
 * @since  0.0.1
 */

const crypto = require('crypto');
const tokenLength = 16;

/**
 * hashingPaswordForRegistration is used when a new user registers on the site. It takes the supplied password
 * and creates a random salt, then hashes the password before returning the password data to be stored in the
 * database.
 * @param password the password the user has entered. The string must be validated before getting to this point.
 * @returns {hash, salt} returns an object containing the hash and the salt of the password.
 */
function hashPasswordForRegistration(password) {
    let salt = crypto.randomBytes(128).toString('base64');
    let hash = crypto.pbkdf2Sync(password, salt, 1000, 64, `sha256`).toString(`hex`);
    let passwordData = {
        hash: hash,
        salt: salt
    };
    return passwordData;
}

/**
 * validatePassword is used when a user attempts to login. This function takes the hash, salt and user entered password
 * and attempts the same function as registration before checking if the hashes match. It returns a boolean value based
 * on the returned hash. The user's login email must be validated before even reaching this point.
 * @param hash the hash retrieved out of the database for the user email
 * @param salt the salt retrieved from the database for the user
 * @param enteredPassword the password entered on the login page.
 * @returns {boolean} returns true if the password is valid.
 */
function validatePassword(hash, salt, enteredPassword) {

    let valid = hash === crypto.pbkdf2Sync(enteredPassword, salt, 1000, 64, `sha256`).toString(`hex`);

    return valid;
}

/**
 * Generate token is used to add an extra layer of security to the database modifications that the user can perform.
 * After logging in this token will be appended to the user session data and stored in the database. If the user
 * attempts to make a change to the database the session token must match the stored token in the database or the
 * command will not be run.
 * @returns {string} returns a random string of bytes to use as the token.
 */
function generateToken() {

    return crypto.randomBytes(tokenLength).toString('base64');
}

module.exports = {generateToken, validatePassword, hashPasswordForRegistration};