import { getConfig } from "../config";

import { runFetch, getErrorFromResponse, getResponseErrorType } from "./common";
import { addUsers, updateUser } from "../reducers/data/users";
import { basicViewModeUserAttributes, fullviewModeUserAttributes } from "../store/state-templates/users";
import { validateUserUpdates, getUpdatedUserValues } from "../store/state-util/users";


const backendURL = getConfig().backendURL;


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
            body: JSON.stringify({ user, token_owner_password: updates.tokenOwnerPassword })
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
                
                if (errorJSON.error.indexOf("Token owner password is incorrect.") > -1) errors.tokenOwnerPassword = "Incorrect password.";
                
                if (Object.keys(errors).length > 0) return { errors };

                // Return an unattributed error message otherwise
                return { message: { "type": "error", content: errorJSON.error }};
        }
    };
};
