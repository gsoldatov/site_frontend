import config from "../config";

import { getResponseErrorType } from "./common";
import { updateObjectFetch, viewObjectsFetch } from "./data-objects";
import { getNonCachedTags } from "./data-tags";

import { objectDataIsInState } from "../store/state-util/objects";
import { getToDoListUpdateFetchBody } from "../store/state-util/to-do-lists";
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


/**
 * Runs to-do list object update fetch, which saves changes made to to-do list data on the /objects/view/:id page
 */
export const toDoListObjectUpdateFetch = (objectID, toDoList) => {
    return async (dispatch, getState) => {
        const obj = getToDoListUpdateFetchBody(getState(), objectID, toDoList);
        return await dispatch(updateObjectFetch(obj));
    };
};


/**
 * Fetches missing attributes and data of a composite subobject displayed in <ObjectDataCompositeGroupedLinks> component.
 */
export const groupedLinksOnLoad = objectID => {
    return async (dispatch, getState) => {
        const state = getState();
        const subobjectIDs = Object.keys(state.composite[objectID].subobjects);
        const subobjectIDsWithNonCachedAttributes = subobjectIDs.filter(suobbjectID => !(suobbjectID in state.objects) || !(suobbjectID in state.objectsTags));
        const subobjectIDsWithNonCachedData = subobjectIDs.filter(subobjectID => !objectDataIsInState(state, subobjectID));

        // Fetch missing subobject attributes and data
        if (subobjectIDsWithNonCachedAttributes.length > 0 || subobjectIDsWithNonCachedData.length > 0) {
            let result = await dispatch(viewObjectsFetch(subobjectIDsWithNonCachedAttributes, subobjectIDsWithNonCachedData));

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
