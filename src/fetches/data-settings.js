import { getConfig } from "../config";

import { runFetch, getErrorFromResponse } from "./common";


const backendURL = getConfig().backendURL;


/**
 * Updates backend settings with key-value pairs provided in `settings` objects.
 */
export const settingsUpdateFetch = settings => {
    return async (dispatch, getState) => {
        let response = await dispatch(runFetch(`${backendURL}/settings/update`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ settings })
        }));

        switch (response.status) {
            case 200:
                return { message: "Settings were successfully updated."};
            default:
                return await getErrorFromResponse(response);
        }
    };
};
