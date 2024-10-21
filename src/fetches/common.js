import { setAuthInformation } from "../actions/auth";
import { getDefaultAuthState } from "../store/state-templates/auth";
import { enumResponseErrorType } from "../util/enums/enum-response-error-type";


/**
 * Thunk, which runs a fetch to `url` with `fetchParams`. Returns response object.
 *  
 * Catches network (and CORS) errors and returns an object with `error` property in this case.
 * 
 * Additional parameters can be passed via `thunkParams` argument:
 * - `useAccessToken`: can be set to false to avoid checking current access token for expiration and adding it in 'Authorization' header.
 */
export const runFetch = (url, fetchParams, thunkParams = {}) => {
    return async (dispatch, getState) => {
        const { useAccessToken = true } = thunkParams;

        const state = getState();

        if (useAccessToken) {
            // Check if access token expired
            if (state.auth.access_token_expiration_time.length > 0 && new Date(state.auth.access_token_expiration_time) <= Date.now()) {
                dispatch(setAuthInformation(getDefaultAuthState()));
                return { authError: "Invalid token" };
            }

            // Add 'Authorization' header if token is present
            if (state.auth.access_token.length > 0) {
                fetchParams.headers = fetchParams.headers || {};
                fetchParams.headers["Authorization"] = `Bearer ${state.auth.access_token}`;
            }
        }

        try {
            // Send request
            let response = await fetch(url, fetchParams);

            // Handle response (update auth information)
            switch (response.status) {
                case 200:
                    if (useAccessToken) {
                        // Update access_token_expiration_time if it was updated on the server
                        const contentType = response.headers.get("content-type");
                        if (contentType && contentType.indexOf("application/json") !== -1) {
                            const body = await response.clone().json();     // Clone object to allow response body consumption downstream
                            if ("auth" in body && "access_token_expiration_time" in body.auth) {
                                dispatch(setAuthInformation({ access_token_expiration_time: body.auth["access_token_expiration_time"] }));
                            }
                        }
                    }
                    return response;
                case 401:
                    if (useAccessToken) {
                        // Reset auth information if it's invalid and return authError
                        dispatch(setAuthInformation(getDefaultAuthState()));
                        return { authError: "Invalid token" };
                    } else
                        // Retun a regular error for requests sent without token info
                        return response;
                default:
                    return response;
            }
        } catch (e) {
            // Handle network errors
            if (e instanceof TypeError && e.message.indexOf("NetworkError") > -1) return { status: "network", error: "Failed to fetch data." };
            else throw e;
        }
    };
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
