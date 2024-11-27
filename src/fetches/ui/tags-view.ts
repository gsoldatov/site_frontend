import { objectsGetPageObjectIDs, objectsViewFetch } from "../data/objects";
import { fetchMissingTags, tagsSearchFetch } from "../data/tags";

import { type FetchResult } from "../fetch-runner";
import type { Dispatch, GetState } from "../../store/types/store";
import type { ObjectsPaginationInfo, ObjectsGetPageObjectIDsFetchResult } from "../types/data/objects/general";


/** 
 * Loads missing tag data for the selected tags
 */
export const tagsViewLoadSelectedTags = (tagIDs: number[]) => {
    return async (dispatch: Dispatch, getState: GetState): Promise<void> => {
        await dispatch(fetchMissingTags(tagIDs));
    };
};


/**
 * Fetches IDs of objects, which should be rendered on the /tags/view page, then fetches missing object data.
 */
export const tagsViewLoadPageObjects = (paginationInfo: ObjectsPaginationInfo) => {
    return async (dispatch: Dispatch, getState: GetState): Promise<ObjectsGetPageObjectIDsFetchResult> => {
        const pageObjectIDsResult = await dispatch(objectsGetPageObjectIDs(paginationInfo));

        // Handle fetch errors
        if (pageObjectIDsResult.failed) return pageObjectIDsResult;

        // Is fetch is successful, fetch missing object data
        if (!("object_ids" in pageObjectIDsResult)) throw Error("Missing object_ids in correct fetch result.");
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
 * Fetches dropdown options for the /tags/view page tag dropdown.
 */
export const tagsViewDropdownOptionsSearch = (queryText: string, existingIDs: number[]) => {
    return async (dispatch: Dispatch, getState: GetState): Promise<FetchResult> => {
        return await dispatch(tagsSearchFetch(queryText, existingIDs));
    };
};
