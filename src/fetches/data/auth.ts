import { FetchRunner } from "../fetch-runner";

import { fetchMissingUsers } from "../data/users";
import { resetStateExceptForEditedObjects } from "../../reducers/common";

import { getAuthFetchValidationErrors, registerFetchData, authFetchValidationErrors, loginFetchData, backendAuth } from "../types/data/auth";
import { NumericUserLevel } from "../../store/types/data/auth";
import { timestampString } from "../../util/types/common";

import type { Dispatch, GetState } from "../../store/types/store";
import type { AuthFetchValidationErrors, BackendAuth } from "../types/data/auth";


/** Runs a register fetch with the provided user data. Returns any validation or fetch errors or an emtpy object. */
export const registerFetch = (login: string, password: string, password_repeat: string, username: string) => {
    return async (dispatch: Dispatch, getState: GetState): Promise<AuthFetchValidationErrors> => {
        // Validate user data
        const parseResult = registerFetchData.safeParse({ login, password, password_repeat, username });
        if (!parseResult.success) return getAuthFetchValidationErrors(parseResult.error);

        // Fetch backend
        const runner = new FetchRunner("/auth/register", 
            { method: "POST", body: parseResult.data },
            { useAccessToken: false }
        );
        let result = await runner.run();

        // Handle response
        switch (result.status) {
            case 200:
                return {};
            default:
                // Attribute backend error message to a specific form field or return a form error
                const errors = {} as any;
                const match = result.error!.match(/Submitted (\w+) is unavailable./);
                if (match && ["login", "username"].includes(match[1])) errors[match[1]] = match[0];
                else errors.form = result.error;
                return authFetchValidationErrors.parse({ errors });
        }
    };
};


/**
 * Fetches provided `login` and `password` to acquire an access token, if there is none.
 * Returns an object with auth information in case of success or any occured errors.
 */
export const loginFetch = (login: string, password: string) => {
    return async (dispatch: Dispatch, getState: GetState): Promise<BackendAuth | AuthFetchValidationErrors> => {
        // Exit if logged in
        if (getState().auth.numeric_user_level > NumericUserLevel.anonymous) return { errors: { form: "You are already logged in." }};

        // Validate user data
        const parseResult = loginFetchData.safeParse({ login, password });
        if (!parseResult.success) return getAuthFetchValidationErrors(parseResult.error);

        // Fetch backend
        const runner = new FetchRunner("/auth/login", 
            { method: "POST", body: parseResult.data },
            { useAccessToken: false }
        );
        let result = await runner.run();
        
        // Handle response
        switch (result.status) {
            case 200:
                const auth = backendAuth.parse(result.json?.auth);

                // Fetch missing user data
                let nonCachedUsersResult = await dispatch(fetchMissingUsers([auth.user_id], false));            

                // Handle fetch errors
                if (nonCachedUsersResult.failed) return { errors: { form: "Failed to fetch user information." }};

                // Handle successful request ending
                // dispatch(setAuthInformation(auth));      // NOTE: auth information is set simultaneously with redirectOnRender later in login form onSubmit handler;
                return auth;                                // this is done to avoid double redirect (first to "/", then to specified in URL params for login page route),
                                                            // which is caused by having a <ProtectedRoute> wrapper over /auth/login route, which redirects auth'd users to index page.

            case 429:
                const retryAfterString = timestampString.parse(result.headers.get("Retry-After"));
                const retryAfter = parseInt(retryAfterString);
                const retryAfterDate = new Date();
                retryAfterDate.setSeconds(retryAfterDate.getSeconds() + retryAfter);
                return { errors: { form: `Too many login attempts performed. Retry after ${retryAfterDate.toLocaleString()}.` }};

            default:
                // const errorJSON = await getErrorFromResponse(response);
                return { errors: { form: result.error }};
        }
    };
};


/**
 * Fetches backend to invalidate current access token.
 * If successful, clears current state, except for current objects and redirects to index page.
 */
export const logoutFetch = () => {
    return async (dispatch: Dispatch, getState: GetState) => {
        // Fetch backend
        const runner = new FetchRunner("/auth/logout", 
            { method: "POST" }
        );
        let result = await runner.run();
        
        switch (result.status) {
            case 200:
                dispatch(resetStateExceptForEditedObjects({ redirectOnRender: "/" }));
                return;
            default:
                return;
        }

    };
};