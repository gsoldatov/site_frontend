import { getResponseErrorType } from "./common";
import { objectsGetPageObjectIDs, objectsViewFetch } from "./data/objects";
import { fetchMissingTags, tagsSearchFetch } from "./data/tags";

import { enumResponseErrorType } from "../util/enums/enum-response-error-type";


/** 
 * Loads missing tag data for the selected tags
 */
export const tagsViewLoadSelectedTags = tagIDs => {
    return async (dispatch, getState) => {
        await dispatch(fetchMissingTags(tagIDs));
    };
};


/**
 * Fetches IDs of objects, which should be rendered on the /tags/view page, then fetches missing object data.
 */
 export const tagsViewLoadPageObjects = paginationInfo => {
    return async (dispatch, getState) => {
        const pageObjectIDsResult = await dispatch(objectsGetPageObjectIDs(paginationInfo));

        // Handle fetch errors
        if (pageObjectIDsResult.failed) return pageObjectIDsResult;

        // Is fetch is successful, fetch missing object data
        let nonCachedObjects = pageObjectIDsResult["object_ids"].filter(object_id => !(object_id in getState().objects));
        if (nonCachedObjects.length !== 0) {
            const objectsViewResult = await dispatch(objectsViewFetch(nonCachedObjects));
            
            // Handle errors
            if (objectsViewResult.failed) return objectsViewResult;
        }

        // Return object IDs and total number of objects
        return pageObjectIDsResult;
    };
};


/**
 * Fetch dropdown options for the /tags/view tag dropdown
 */
export const tagsViewDropdownOptionsSearch = (queryText, existingIDs) => {
    return async (dispatch, getState) => {
        return await dispatch(tagsSearchFetch(queryText, existingIDs));
    };
};
