import { config } from "../config";

import { runFetch, getErrorFromResponse } from "./common";


const backendURL = config.backendURL;


/**
 * Fetches the mathcing items for the provided search `query`.
 * 
 * Returns current query params, list of matching `items` { item_id, item_type } and `total_items` number.
 */
 export const search = query => {
    return async (dispatch, getState) => {
        let response = await dispatch(runFetch(`${backendURL}/search`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query })
        }));

        switch (response.status) {
            case 200:
                const result = await response.json();
                return result;
            default:
                return await getErrorFromResponse(response);
        }
    };
}
