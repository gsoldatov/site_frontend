import config from "../config";

import { runFetch, getErrorFromResponse } from "./common";


const backendURL = config.backendURL;


/**
 * Fetches current backend settings.
 */
export const viewSettingsFetch = () => {
    return async (dispatch, getState) => {
        let response = await dispatch(runFetch(`${backendURL}/settings/view`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ view_all: true })
        }));

        switch (response.status) {
            case 200:
                return await response.json();
            default:
                return await getErrorFromResponse(response);
        }
    };
};


/**
 * Updates backend settings with key-value pairs provided in `settings` objects.
 */
export const updateSettingsFetch = settings => {
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
