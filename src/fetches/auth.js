import { getConfig } from "../config";

import { runFetch, getErrorFromResponse, getResponseErrorType } from "./common";
import { getNonCachedUsers } from "./data-users";

import { resetStateExceptForEditedObjects } from "../reducers/common";

import { validateLoginCredentials, validateRegisterCredentials } from "../store/state-util/auth";
import { UserLevels } from "../store/types/data/auth";
import { enumResponseErrorType } from "../util/enums/enum-response-error-type";
import { setNavigationUI } from "../reducers/ui/navigation";


const backendURL = getConfig().backendURL;


/**
 * Fetches provided `login` and `password` to acquire an access token, if there is none.
 * Returns an object with auth information in case of success or any occured errors.
 */
export const loginFetch = (login, password) => {
    return async (dispatch, getState) => {
        // Exit if logged in
        if (getState().auth.numeric_user_level > UserLevels.anonymous) return { errors: { form: "You are already logged in." }};

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
                // dispatch(setAuthInformation(auth));      // NOTE: auth information is set simultaneously with redirectOnRender later in login form onSubmit handler;
                return auth;                                // this is done to avoid double redirect (first to "/", then to specified in URL params for login page route),
                                                            // which is caused by having a <ProtectedRoute> wrapper over /auth/login route, which redirects auth'd users to index page.

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
                dispatch(resetStateExceptForEditedObjects({ redirectOnRender: "/" }));
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
        const fullViewMode = getState().auth.numeric_user_level === UserLevels.admin;

        dispatch(setNavigationUI({ isFetching: true }));
        let result = await dispatch(getNonCachedUsers([user_id], fullViewMode));
        dispatch(setNavigationUI({ isFetching: false }));

        // Handle fetch errors
        const responseErrorType = getResponseErrorType(result);
        if (responseErrorType > enumResponseErrorType.none) return { errors: { form: "Failed to fetch user information." }};

        return {};
    };
};
