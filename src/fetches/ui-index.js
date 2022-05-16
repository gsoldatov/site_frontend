import { getResponseErrorType } from "./common";
import { viewObjectsFetch, getPageObjectIDs } from "./data-objects";

import { enumResponseErrorType } from "../util/enum-response-error-type";


/**
 * Fetches IDs of objects, which should be rendered on the /feed page, then fetches missing object data.
 */
export const loadIndexPageObjects = paginationInfo => {
    return async (dispatch, getState) => {
        let response = await dispatch(getPageObjectIDs(paginationInfo));

        // Handle fetch errors
        let responseErrorType = getResponseErrorType(response);
        if (responseErrorType > enumResponseErrorType.none) {
            const errorMessage = responseErrorType === enumResponseErrorType.general ? response.error : "";
            return { error: errorMessage };
        }

        // Is fetch is successful, fetch missing object data
        const result = response;

        let nonCachedObjects = result["object_ids"].filter(object_id => !(object_id in getState().objects));
        if (nonCachedObjects.length !== 0) {
            response = await dispatch(viewObjectsFetch(nonCachedObjects));
            
            // Handle errors
            responseErrorType = getResponseErrorType(response);
            if (responseErrorType > enumResponseErrorType.none) {
                const errorMessage = responseErrorType === enumResponseErrorType.general ? response.error : "";
                return { error: errorMessage };
            }
        }

        // Return object IDs and total number of objects
        return result;
    };
};
