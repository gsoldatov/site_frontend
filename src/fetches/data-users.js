import config from "../config";

import { runFetch, getErrorFromResponse, getResponseErrorType } from "./common";
import { addUsers, updateUser } from "../actions/data-users";
import { basicViewModeUserAttributes, fullviewModeUserAttributes } from "../store/state-templates/users";
import { validateUserUpdates, getUpdatedUserValues } from "../store/state-util/users";


const backendURL = config.backendURL;


/**
 * Fetches user data updates to backend.
 */
export const updateUsersFetch = updates => {
    return async (dispatch, getState) => {
        // Validate entered credentials
        let validationErrors = validateUserUpdates(updates);
        if (Object.keys(validationErrors.errors).length > 0) return validationErrors;

        // Get modified values & exit if no updates were made
        const user = getUpdatedUserValues(getState(), updates);
        if (Object.keys(user).length === 0) return { message: { type: "info", content: "Nothing was updated." }};
        user.user_id = parseInt(updates.user_id);

        // Fetch backend
        let response = await dispatch(runFetch(`${backendURL}/users/update`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user, token_owner_password: updates.token_owner_password })
        }));

        // Handle response
        switch (response.status) {
            case 200:
                dispatch(updateUser(user));
                return { message: { type: "success", content: "User data was successfully updated." }};
            case 401:
                return {};  // Special case for component unmounting due to redirect
            default:
                const errorJSON = await getErrorFromResponse(response);
                // Attribute backend error messages to specific form fields
                const errors = {};
                let match = errorJSON.error.match(/Submitted (\w+) already exists./);
                if (match && ["login", "username"].includes(match[1])) errors[match[1]] = match[0];
                
                if (errorJSON.error.indexOf("Token owner password is incorrect.") > -1) errors.token_owner_password = "Incorrect password.";
                
                if (Object.keys(errors).length > 0) return { errors };

                // Return an unattributed error message otherwise
                return { message: { "type": error, content: errorJSON.error }};
        }
    };
};


/**
 * Fetches user data for provided `userIDs` with the provided `fullViewMode`.
 */
 export const viewUsersFetch = (userIDs, fullViewMode) => {
    return async (dispatch, getState) => {
        userIDs = userIDs.map(id => {
            const intID = parseInt(id);
            if (isNaN(intID)) throw Error(`Failed to parse user_id '${id}' in viewUsersFetch.`)
            return intID;
        });

        let response = await dispatch(runFetch(`${backendURL}/users/view`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_ids: userIDs, full_view_mode: fullViewMode })
        }));

        switch (response.status) {
            case 200:
                let users = (await response.json())["users"];
                dispatch(addUsers(users));
                return users;
            case 404:
                const error = userIDs.length > 1 ? "Users not found." : "User not found.";
                return { error };
            default:
                return await getErrorFromResponse(response);
        }
    };
};

/**
 * Checks if current state contains user data for provided `userIDs` and fetches data.
 * If `fullViewMode` == true, for attribute list is checked for each user, otherwise only basic field are checked for presence.
 */
export const getNonCachedUsers = (userIDs, fullViewMode) => {
    return async (dispatch, getState) => {
        const state = getState();
        const attributeList = fullViewMode ? fullviewModeUserAttributes : basicViewModeUserAttributes;
        const nonCachedUserIDs = userIDs.filter(userID => {
            if (!(userID in state.users)) return true;
            for (let attr of attributeList) {
                if (!(attr in state.users[userID])) return true;
            }
            return false;
        });

        if (nonCachedUserIDs.length !== 0) return await dispatch(viewUsersFetch(nonCachedUserIDs, fullViewMode));
        return {};
    }
};
