import { objectsGetPageObjectIDs, objectsViewFetch } from "./data/objects";


/**
 * Fetches IDs of objects, which should be rendered on the /feed page, then fetches missing object data.
 */
export const loadIndexPageObjects = paginationInfo => {
    return async (dispatch, getState) => {
        const pageObjectIDsResult = await dispatch(objectsGetPageObjectIDs(paginationInfo));

        // Handle fetch errors
        if (pageObjectIDsResult.failed) return pageObjectIDsResult;

        // If fetch is successful, load missing object data
        const nonCachedObjects = pageObjectIDsResult["object_ids"].filter(object_id => !(object_id in getState().objects));
        if (nonCachedObjects.length !== 0) {
            const objectsViewResult = await dispatch(objectsViewFetch(nonCachedObjects));
            
            // Handle fetch errors
            if (objectsViewResult.failed) return objectsViewResult;
        }

        // Return object IDs and total number of objects
        return pageObjectIDsResult;
    };
};
