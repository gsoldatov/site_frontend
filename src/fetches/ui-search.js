import { getResponseErrorType } from "./common";

import { search } from "./data-search";
import { getNonCachedObjects } from "./data-objects";
import { getNonCachedTags } from "./data-tags";

import { enumResponseErrorType } from "../util/enum-response-error-type";


/**
 * Fetches IDs of tag and objects, matching the provided `query`, then fetches missing tag and object data.
 */
export const loadSearchPageItems = query => {
    return async (dispatch, getState) => {
        let response = await dispatch(search(query));

        // Handle fetch errors
        let responseErrorType = getResponseErrorType(response);
        if (responseErrorType > enumResponseErrorType.none) {
            const errorMessage = responseErrorType === enumResponseErrorType.general ? response.error : "";
            return { error: errorMessage };
        }

        // Fetch missing tag & object data
        const tagIDs = response.items.filter(item => item.item_type === "tag").map(item => item.item_id);
        const objectIDs = response.items.filter(item => item.item_type === "object").map(item => item.item_id);

        let results = await Promise.all([dispatch(getNonCachedTags(tagIDs)), dispatch(getNonCachedObjects(objectIDs, { attributes: true, tags: true }))]);

        // Handle fetch errors
        for (let result of results) {
            let responseErrorType = getResponseErrorType(result);
            if (responseErrorType > enumResponseErrorType.none) {
                const errorMessage = responseErrorType === enumResponseErrorType.general ? result.error : "";
                return { error: errorMessage };
            }
        }

        // Return search results
        return response;
    };
};
