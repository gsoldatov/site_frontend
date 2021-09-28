import config from "../config";

import { runFetch, getErrorFromResponse, getResponseErrorType } from "./common";
import { addUsers } from "../actions/data-users";
import { basicViewModeUserAttributes, fullviewModeUserAttributes } from "../store/state-templates/users";


const backendURL = config.backendURL;


/**
 * Fetches user data for provided `userIDs` with the provided `fullViewMode`.
 */
 export const viewUsersFetch = (userIDs, fullViewMode) => {
    return async (dispatch, getState) => {
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
            for (let attr in attributeList)
                if (!(attr in state.users[userID])) return true;
            return false;
        });

        if (nonCachedUserIDs.length !== 0) return await dispatch(viewUsersFetch(nonCachedUserIDs, fullViewMode));
    }
};
