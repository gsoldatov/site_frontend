import config from "../config";

import { runFetch, getErrorFromResponse, getResponseErrorType } from "./common";
import { resetStateExceptForEditedObjects, setRedirectOnRender } from "../actions/common";


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