import config from "../config";

import { runFetch, getErrorFromResponse, getResponseErrorType } from "./common";
import { getNonCachedUsers } from "./data-users";

import { setAuthInformation } from "../actions/auth";
import { resetStateExceptForEditedObjects, setRedirectOnRender } from "../actions/common";

import { validateLoginCredentials, validateRegisterCredentials } from "../store/state-util/auth";
import { enumUserLevels } from "../util/enum-user-levels";
import { enumResponseErrorType } from "../util/enum-response-error-type";


const backendURL = config.backendURL;


/**
 * Fetches backend to check if non-admin registration is allowed.
 * Returns boolean from response or `false` in case of errors.
 */
export const registrationStatusFetch = () => {
    return async (dispatch, getState) => {
        let response = await dispatch(runFetch(`${backendURL}/auth/get_registration_status`, {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        },
        { useAccessToken: false }
        ));

        switch (response.status) {
            case 200:
                let json = await response.json();
                return json["registration_allowed"];
            default:
                return false;
        }
    };
};


/**
 * Fetches backend to register a user with provided credentials.
 * Returns an object with auth information in case of success or any occured errors.
 */
 export const registerFetch = (login, password, password_repeat, username) => {
    return async (dispatch, getState) => {
        // Validate entered credentials
        let validationErrors = validateRegisterCredentials(login, password, password_repeat, username);
        if (Object.keys(validationErrors.errors).length > 0) return validationErrors;

        // Fetch backend
        let response = await dispatch(runFetch(`${backendURL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ login, password, password_repeat, username })
        }));

        // Handle response
        switch (response.status) {
            case 200:
                return {};
            default:
                const errorJSON = await getErrorFromResponse(response);
                if ("error" in errorJSON) {
                    // Attribute backend error message to a specific form field
                    const errors = {};
                    const match = errorJSON.error.match(/Submitted (\w+) already exists./);
                    if (match && ["login", "username"].includes(match[1])) errors[match[1]] = match[0];
                    else errors.form = errorJSON.error;

                    return { errors };
                }

                return { errors: { form: errorJSON.error }};
        }
    };
};


/**
 * Fetches provided `login` and `password` to acquire an access token, if there is none.
 * Returns an object with auth information in case of success or any occured errors.
 */
export const loginFetch = (login, password) => {
    return async (dispatch, getState) => {
        // Exit if logged in
        if (getState().auth.numeric_user_level > enumUserLevels.anonymous) return { errors: { form: "You are already logged in." }};

        // Validate entered credentials
        let validationErrors = validateLoginCredentials(login, password);
        if (Object.keys(validationErrors.errors).length > 0) return validationErrors;

        // Fetch backend
        let response = await dispatch(runFetch(`${backendURL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ login, password })
        },
        { useAccessToken: false }
        ));

        // Handle response
        switch (response.status) {
            case 200:
                const auth = (await response.json()).auth;

                // Fetch missing user data
                let result = await dispatch(getNonCachedUsers([auth.user_id], false));

                // Handle fetch errors
                const responseErrorType = getResponseErrorType(result);
                if (responseErrorType > enumResponseErrorType.none) return { errors: { form: "Failed to fetch user information." }};

                // Handle successful request ending
                dispatch(setAuthInformation(auth));
                return auth;

            case 429:
                const retryAfter = parseInt(response.headers.get("Retry-After"));
                const retryAfterDate = new Date();
                retryAfterDate.setSeconds(retryAfterDate.getSeconds() + retryAfter);
                return { errors: { form: `Too many login attempts performed. Retry after ${retryAfterDate.toLocaleString()}.` }};

            default:
                const errorJSON = await getErrorFromResponse(response);
                return { errors: { form: errorJSON.error }};
        }
    };
};


/**
 * Fetches backend to invalidate current access token.
 * If successful, clears current state, except for current objects and redirects to index page.
 */
export const logoutFetch = () => {
    return async (dispatch, getState) => {
        let response = await dispatch(runFetch(`${backendURL}/auth/logout`, {
            method: "POST",
            headers: { "Content-Type": "application/json" }
        }));

        switch (response.status) {
            case 200:
                dispatch(resetStateExceptForEditedObjects());
                dispatch(setRedirectOnRender("/"));
                return;
            default:
                return;
        }

    };
};


/**
 * Fetches basic information for user with user_id = state.auth.user_id if it's missing.
 */
 export const getCurrentUserData = () => {
    return async (dispatch, getState) => {
        const user_id = getState().auth.user_id;
        const fullViewMode = getState().auth.numeric_user_level === enumUserLevels.admin;

        let result = await dispatch(getNonCachedUsers([user_id], fullViewMode));

        // Handle fetch errors
        const responseErrorType = getResponseErrorType(result);
        if (responseErrorType > enumResponseErrorType.none) return { errors: { form: "Failed to fetch user information." }};

        return {};
    };
};