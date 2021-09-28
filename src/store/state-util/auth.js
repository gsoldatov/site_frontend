/*
 * Validation functions for auth-related operations.
 */


/**
 * Validates provided `login` and `password`.
 */
export const validateLoginAndPassword = (login, password) => {
    const errors = {};

    if (login.length === 0) errors.login = "Login is required.";
    if (password.length < 8) errors.password = "Submitted password is too short.";
    if (password.length > 72) errors.password = "Submitted password is too long.";
    return { errors };
};