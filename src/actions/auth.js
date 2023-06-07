export const SET_AUTH_INFORMATION = "SET_AUTH_INFORMATION";

/** [Reducer file](../reducers/auth.js) */
export const setAuthInformation = (auth, options) => ({ type: SET_AUTH_INFORMATION, auth, options });