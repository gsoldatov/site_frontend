import config from "../config";

import { getResponseErrorType } from "./common";
import { viewObjectsFetch } from "./data-objects";
import { getNonCachedTags } from "./data-tags";

import { objectDataIsInState } from "../store/state-util/objects";
import { enumResponseErrorType } from "../util/enum-response-error-type";


const backendURL = config.backendURL;


/**
 * Fetches attributes, tags and data of an existing object with the provided `objectID`.
 */
 export const objectsViewOnLoadFetch = objectID => {
    return async (dispatch, getState) => {
        // Exit if objectID is not valid
        objectID = parseInt(objectID);
        if (!(objectID > 0)) return { error: "Object not found." };
        
        // Check if object attributes, tags and data should be fetched
        let state = getState();
        let fetchAttributesAndTags = true, fetchData = true;
        if (objectID in state.objects && objectID in state.objectsTags) fetchAttributesAndTags = false;
        if (objectDataIsInState(state, objectID)) fetchData = false;

        // Fetch object attributes, tags and/or data if they are missing
        if (fetchAttributesAndTags || fetchData) {
            let objectIDs = fetchAttributesAndTags ? [objectID] : undefined;
            let objectDataIDs = fetchData ? [objectID] : undefined;
            let result = await dispatch(viewObjectsFetch(objectIDs, objectDataIDs));

            // Handle fetch errors
            const responseErrorType = getResponseErrorType(result);
            if (responseErrorType > enumResponseErrorType.none) {
                const errorMessage = responseErrorType === enumResponseErrorType.general ? result.error : "";
                return { error: errorMessage };
            }
        } else {
            // Fetch missing tags if object attributes, tags & data are present in the state
            let result = await dispatch(getNonCachedTags(state.objectsTags[objectID]));

            // Handle fetch errors
            const responseErrorType = getResponseErrorType(result);
            if (responseErrorType > enumResponseErrorType.none) {
                const errorMessage = responseErrorType === enumResponseErrorType.general ? result.error : "";
                return { error: errorMessage };
            }
        }

        // End fetch
        return {};
    };
};
