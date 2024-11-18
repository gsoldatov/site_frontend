import { searchFetch } from "../data/search";
import { fetchMissingObjects } from "../data/objects";
import { fetchMissingTags } from "../data/tags";

import type { Dispatch, GetState } from "../../util/types/common";
import type { SearchRequestQuery, SearchFetchResult } from "../types/data/search";


/**
 * Fetches IDs of tag and objects, matching the provided `query`, then fetches missing tag and object data.
 */
export const searchPageOnLoad = (query: SearchRequestQuery) => {
    return async (dispatch: Dispatch, getState: GetState): Promise<SearchFetchResult> => {
        // Run search fetch & handle fetch errors
        const searchResult = await dispatch(searchFetch(query));
        if (searchResult.failed) return searchResult;

        // Fetch missing tag & object data
        if (!("items" in searchResult)) throw Error("Missing items in successful fetch result.");
        const tagIDs = searchResult.items.filter(item => item.item_type === "tag").map(item => item.item_id);
        const objectIDs = searchResult.items.filter(item => item.item_type === "object").map(item => item.item_id);
        
        const missingDataResults = await Promise.all([
            dispatch(fetchMissingTags(tagIDs)), 
            dispatch(fetchMissingObjects(objectIDs, { attributes: true, tags: true }))
        ]);

        // Handle fetch errors
        for (let result of missingDataResults)
            if (result.failed) return result;

        // Return search result
        return searchResult;
    };
};
