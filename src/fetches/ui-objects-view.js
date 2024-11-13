import { getConfig } from "../config";

import { getResponseErrorType } from "./common";
import { objectsUpdateFetch, objectsViewCompositeHierarchyElements, objectsViewFetch } from "./data-objects";
import { fetchMissingTags } from "./data/tags";

import { ObjectsViewSelectors } from "../store/selectors/ui/objects-view";
import { ObjectsSelectors } from "../store/selectors/data/objects/objects";
import { CompositeSelectors } from "../store/selectors/data/objects/composite";
import { getToDoListUpdateFetchBody } from "../store/state-util/to-do-lists";
import { enumResponseErrorType } from "../util/enums/enum-response-error-type";


const backendURL = getConfig().backendURL;


/**
 * Fetches attributes, tags and data of an existing object with the provided `objectID`.
 */
 export const objectsViewCardOnLoadFetch = objectID => {
    return async (dispatch, getState) => {
        // Exit if objectID is not valid
        objectID = parseInt(objectID);
        if (!(objectID > 0)) return { error: "Object not found." };
        
        // Check if object attributes, tags and data should be fetched
        let state = getState();
        let fetchAttributesAndTags = true, fetchData = true;
        if (objectID in state.objects && objectID in state.objectsTags) fetchAttributesAndTags = false;
        if (ObjectsSelectors.dataIsPresent(state, objectID)) fetchData = false;

        // Fetch object attributes, tags and/or data if they are missing
        if (fetchAttributesAndTags || fetchData) {
            let objectIDs = fetchAttributesAndTags ? [objectID] : undefined;
            let objectDataIDs = fetchData ? [objectID] : undefined;
            let result = await dispatch(objectsViewFetch(objectIDs, objectDataIDs));

            // Handle fetch errors
            const responseErrorType = getResponseErrorType(result);
            if (responseErrorType > enumResponseErrorType.none) {
                const errorMessage = responseErrorType === enumResponseErrorType.general ? result.error : "";
                return { error: errorMessage };
            }
        } else {
            // Fetch missing tags if object attributes, tags & data are present in the state
            let result = await dispatch(fetchMissingTags(state.objectsTags[objectID]));

            // Handle fetch errors
            if (result.failed) return { error: result.error };     // TODO return fetch result or nothing?
        }

        // End fetch
        return {};
    };
};


/**
 * Runs to-do list object update fetch, which saves changes made to to-do list data on the /objects/view/:id page
 */
export const objectsViewToDoListObjectUpdateFetch = (objectID, toDoList) => {
    return async (dispatch, getState) => {
        const obj = getToDoListUpdateFetchBody(getState(), objectID, toDoList);
        return await dispatch(objectsUpdateFetch(obj));
    };
};


/**
 * Updates suboobject's `is_expanded` state on expand/collapse toggle
 * 
 * NOTE: should use patched update, because paraller fetch calls can lead to data inconsistency.
 */
export const objectsViewMulticolumnExpandToggleUpdateFetch = (objectID, subobjectID, is_expanded) => {
    return async (dispatch, getState) => {
        // Check if current user can update the object
        const state = getState();
        if (!ObjectsViewSelectors.canEditObject(state, objectID)) return;

        const newProps = { composite: { subobjects: { [subobjectID]: { is_expanded }}}};

        const object = CompositeSelectors.serializeObjectForUpdate(state, objectID, newProps);
        
        return await dispatch(objectsUpdateFetch(object));
    };
};


/**
 * Fetches missing attributes and data of a composite subobject displayed in <ObjectDataCompositeGroupedLinks> component.
 */
export const objectsViewGroupedLinksOnLoad = objectID => {
    return async (dispatch, getState) => {
        const state = getState();
        const subobjectIDs = Object.keys(state.composite[objectID].subobjects);
        const subobjectIDsWithNonCachedAttributes = subobjectIDs.filter(suobbjectID => !(suobbjectID in state.objects) || !(suobbjectID in state.objectsTags));
        const subobjectIDsWithNonCachedData = subobjectIDs.filter(subobjectID => !ObjectsSelectors.dataIsPresent(state, subobjectID));

        // Fetch missing subobject attributes and data
        if (subobjectIDsWithNonCachedAttributes.length > 0 || subobjectIDsWithNonCachedData.length > 0) {
            let result = await dispatch(objectsViewFetch(subobjectIDsWithNonCachedAttributes, subobjectIDsWithNonCachedData));

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
 * Fetches objects in the composite hierarchy with root object ID `rootObjectID`, then fetches missing attributes, tags & data for objects in the hierarchy.
 */
export const objectsViewCompositeChaptersOnLoad = rootObjectID => {
    return async (dispatch, getState) => {
        // Exit if rootObjectID is not valid
        rootObjectID = parseInt(rootObjectID);
        if (!(rootObjectID > 0)) return { error: "Object not found." };

        // Get composite & non-composite objects in the hierarchy
        let result = await dispatch(objectsViewCompositeHierarchyElements(rootObjectID));

        // Handle fetch errors
        let responseErrorType = getResponseErrorType(result);
        if (responseErrorType > enumResponseErrorType.none) {
            const errorMessage = responseErrorType === enumResponseErrorType.general ? result.error : "";
            return { error: errorMessage };
        }

        // Get missing object attributes, tags & data
        // Also, get missing data of the current object
        const state = getState();
        const objectIDs = result.non_composite.concat(result.composite).filter(objectID => !(objectID in state.objects && objectID in state.objectsTags));
        const objectDataIDs = result.composite.filter(objectID => !ObjectsSelectors.dataIsPresent(state, objectID));

        result = await dispatch(objectsViewFetch(objectIDs, objectDataIDs));

        // Handle fetch errors
        responseErrorType = getResponseErrorType(result);
        if (responseErrorType > enumResponseErrorType.none) {
            const errorMessage = responseErrorType === enumResponseErrorType.general ? result.error : "";
            return { error: errorMessage };
        }

        // End fetch
        return {};
    };
};
