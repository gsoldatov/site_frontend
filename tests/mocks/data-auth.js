/**
 * Returns a mock token for a provided `userID`
 */
export const getMockAccessToken = userID => `user ${userID} token`;


/**
 * Returns an object identical to the body of a 200 response for /auth/login route. Object attributes can be passed into function to override default values.
 */
export const getMockLoginResponse = ({ user_id, user_level, access_token, access_token_expiration_time } = {}) => {
    user_id = user_id || 1;
    user_level = user_level || "admin";
    access_token = access_token || getMockAccessToken(user_id);

    if (!access_token_expiration_time) {
        let expirationTime = new Date();
        expirationTime.setDate(expirationTime.getDate() + 7);
        access_token_expiration_time = expirationTime.toISOString();
    }

    return { auth: { user_id, user_level, access_token, access_token_expiration_time }};
};
