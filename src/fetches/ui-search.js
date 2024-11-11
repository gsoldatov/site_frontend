import { getResponseErrorType } from "./common";

import { searchFetch } from "./data-search";
import { fetchMissingObjects } from "./data-objects";
import { fetchMissingTags } from "./data/tags";

import { enumResponseErrorType } from "../util/enums/enum-response-error-type";
import { FetchResult } from "./fetch-runner";


/**
 * Fetches IDs of tag and objects, matching the provided `query`, then fetches missing tag and object data.
 */
export const searchPageOnLoad = query => {
    return async (dispatch, getState) => {
        let response = await dispatch(searchFetch(query));

        // Handle fetch errors
        let responseErrorType = getResponseErrorType(response);
        if (responseErrorType > enumResponseErrorType.none) {
            const errorMessage = responseErrorType === enumResponseErrorType.general ? response.error : "";
            return { error: errorMessage };
        }

        // Fetch missing tag & object data
        const tagIDs = response.items.filter(item => item.item_type === "tag").map(item => item.item_id);
        const objectIDs = response.items.filter(item => item.item_type === "object").map(item => item.item_id);

        let results = await Promise.all([dispatch(fetchMissingTags(tagIDs)), dispatch(fetchMissingObjects(objectIDs, { attributes: true, tags: true }))]);

        // Handle fetch errors
        for (let result of results) {
            if (result instanceof FetchResult) {
                if (result.failed) return { error: result.error };  // TODO return fetch result?
            } else {
                // TODO use a single branch when possible
                let responseErrorType = getResponseErrorType(result);
                if (responseErrorType > enumResponseErrorType.none) {
                    const errorMessage = responseErrorType === enumResponseErrorType.general ? result.error : "";
                    return { error: errorMessage };
                }
            }
        }

        // Return search results
        return response;
    };
};
