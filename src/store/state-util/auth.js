/*
 * Validation functions for auth-related operations.
 */


/**
 * Validates `login` and `password` values submitted in the login form.
 */
export const validateLoginCredentials = (login, password) => {
    const errors = {};

    if (login.length === 0) errors.login = "Login is required.";
    if (login.length > 255) errors.login = "Login is too long.";
    if (password.length < 8) errors.password = "Submitted password is too short.";
    if (password.length > 72) errors.password = "Submitted password is too long.";
    return { errors };
};


/**
 * Validates user credentials submitted in the registration form.
 */
 export const validateRegisterCredentials = (login, password, passwordRepeat, username) => {
    const errors = {};

    if (login.length === 0) errors.login = "Login is required.";
    if (login.length > 255) errors.login = "Login is too long.";
    if (password.length < 8) errors.password = "Password is too short.";
    if (password.length > 72) errors.password = "Password is too long.";
    if (password !== passwordRepeat) errors.passwordRepeat = "Password must be repeated correctly.";
    if (username.length === 0) errors.username = "Username is required.";
    if (username.length > 255) errors.username = "Username is too long.";
    return { errors };
};