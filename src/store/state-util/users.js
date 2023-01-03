/*
 * Validation functions for user-related operations.
 */


/**
 * Validates user credentials submitted in the update form.
 */
export const validateUserUpdates = updates => {
    const { login, password, passwordRepeat, username, tokenOwnerPassword } = updates;
    const errors = {};

    if (login.length > 255) errors.login = "Login is too long.";
    if (password.length > 0 && password.length < 8) errors.password = "Password is too short.";
    if (password.length > 72) errors.password = "Password is too long.";
    if (password !== passwordRepeat) errors.passwordRepeat = "Password must be repeated correctly.";
    if (username.length > 255) errors.username = "Username is too long.";
    if (tokenOwnerPassword.length < 8) errors.tokenOwnerPassword = "Password is too short.";
    if (tokenOwnerPassword.length > 72) errors.tokenOwnerPassword = "Password is too long.";
    return { errors };
};


/**
 * Accepts current state and `updates` object with user attributes from /users/:id form.
 * Returns an object with modified attributes only.
 */
export const getUpdatedUserValues = (state, updates) => {
    const result = {};
    const currentUserData = state.users[updates.user_id];

    for (let attr of ["login", "username"]) if (updates[attr].length > 0) result[attr] = updates[attr];
    if (updates.password.length > 0) {
        result.password = updates.password;
        result.password_repeat = updates.passwordRepeat;
    }

    for (let attr of ["user_level", "can_login", "can_edit_objects"]) {
        if (updates[attr] !== undefined && updates[attr] !== currentUserData[attr]) result[attr] = updates[attr];
    }

    return result;
};
