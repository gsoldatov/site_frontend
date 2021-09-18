// /**  // TODO replace old runFetch
//  * Thunk, which runs a fetch to `url` with `fetchParams`. Returns response object.
//  *  
//  * Catches network (and CORS) errors and returns an object with `error` property in this case.
//  * 
//  * Additional parameters can be passed via `thunkParams` argument:
//  * - `useAccessToken`: can be set to false to avoid checking current access token for expiration and adding it in 'Authorization' header.
//  */
//  export const runFetch = async (url, fetchParams, thunkParams = {}) => {
//     return async (dispatch, getState) => {
//     };
//  };

import { enumResponseErrorType } from "../util/enum-response-error-type";

// Old version  // TODO delete
// export const runFetch = async (url, params) => {
//     try {
//         return await fetch(url, params);
//     } catch (e) {
//         if (e instanceof TypeError && e.message.indexOf("NetworkError") > -1) return { error: "Failed to fetch data." };
//         // throw e;
//     }
// };

// TODO replace with thunk
export const runFetch = async (url, params) => {
    try {
        return await fetch(url, params);
    } catch (e) {
        if (e instanceof TypeError && e.message.indexOf("NetworkError") > -1) return { status: "network", error: "Failed to fetch data." };
        // throw e;
    }
};


/**
 * Parses a non-successful `response` object and returns an object with `authError` or `error` attribute containing a corresponding error message.
 * `response` is an object with 'status' property (returned by fetch or created manually).
 */
export const getErrorFromResponse = async response => {
    switch (response.status) {
        case "network":
            return { error: response.error };
        case 500:
            return { error: await response.text() };
        default:
            // Return error in a different attribute for token-related errors to handle them separately later
            if ("authError" in response) return { authError: response.authError };

            // Return a general error
            return { error: (await response.json())._error };
    }
};


/**
 * Accepts a fetch `response` object returns an `enumResponseErrorType` value corresponding to the error present (or not) in the response.
 */
export const getResponseErrorType = response => {
    response = response || {};
    if ("authError" in response) return enumResponseErrorType.auth;
    if ("error" in response) return enumResponseErrorType.general;
    return enumResponseErrorType.none;
};
