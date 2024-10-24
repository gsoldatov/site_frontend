import { getConfig } from "../config";

import { runFetch, getErrorFromResponse, getResponseErrorType } from "./common";
import { enumResponseErrorType } from "../util/enums/enum-response-error-type";
import { getNonCachedTags } from "./data-tags";

import { setObjectsTags } from "../actions/data-tags";
import { addObjects, addObjectData, deleteObjects } from "../actions/data-objects";
import { setEditedObject, setObjectOnSaveFetchState } from "../actions/objects-edit";

import { validateObject, serializeObjectAttributesAndTagsForAddFetch, serializeObjectAttributesAndTagsForUpdateFetch,
    serializeObjectData, modifyObjectDataPostSave, objectDataIsInState } from "../store/state-util/objects";


const backendURL = getConfig().backendURL;


/**
 * Fetches backend to add provided edited object `obj` as a new object.
 * 
 * Adds the object to the state in case of success.
 * 
 * Returns object attributes from backend response or an object with `error` attribute containing error message in case of failure.
 */
export const addObjectFetch = obj => {
    return async (dispatch, getState) => {
        // Validate current object
        let state = getState();
        try {
            validateObject(state, obj);
        } catch (e) {
            dispatch(setObjectOnSaveFetchState(false, e.message));
            return { error: e.message };
        }

        // Run fetch & handle response
        let payload = { object: serializeObjectAttributesAndTagsForAddFetch(obj) };
        let object_data = serializeObjectData(state, obj);
        payload.object.object_data = object_data;
        
        let response = await dispatch(runFetch(`${backendURL}/objects/add`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        }));

        switch (response.status) {
            case 200:
                let object = (await response.json()).object;

                // Composite object data updates
                dispatch(setEditedObject({ compositeUpdate: { command: "updateSubobjectsOnSave", object, object_data }}, 0));     // object_data must contain non-mapped IDs of new subobjects
                object_data = modifyObjectDataPostSave(payload, object);

                // General updates
                dispatch(setObjectsTags([object]));     // Set objects tags
                dispatch(addObjects([object]));         // Add object
                dispatch(addObjectData([{ object_id: object.object_id, object_type: object.object_type, object_data: object_data }]));
                return object;
            default:
                return getErrorFromResponse(response);
        }
    };
};


/**
 * Fetches backend to retrieve objects attributes for provided `objectIDs` and object data for `objectDataIDs`.
 * 
 * Adds the objects and data to the state in case of success.
 * 
 * Fetches non-cached tags, if object attributes were fetched for at least one object.
 * 
 * Returns the arrays of object attributes and data returned by backend or an object with `error` attribute containing error message in case of failure.
 */
export const viewObjectsFetch = (objectIDs, objectDataIDs) => {
    return async (dispatch, getState) => {
        const objectIDsLength = (objectIDs || []).length;
        const objectDataIDsLength = (objectDataIDs || []).length;
        if (objectIDsLength === 0 && objectDataIDsLength === 0) return {};
        objectIDs = (objectIDs || []).map(objectID => parseInt(objectID));
        objectDataIDs = (objectDataIDs || []).map(objectID => parseInt(objectID));

        // Fetch object attributes & data
        let payload = {};
        if (objectIDsLength > 0) payload["object_ids"] = objectIDs;
        if (objectDataIDsLength > 0) payload["object_data_ids"] = objectDataIDs;

        let response = await dispatch(runFetch(`${backendURL}/objects/view`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        }));

        switch (response.status) {
            case 200:
                let data = await response.json();

                // Set object data
                if (data["object_data"].length > 0) dispatch(addObjectData(data["object_data"]));

                // Set object attributes & fetch non-cached tags
                if (data["objects"].length > 0) {
                    dispatch(addObjects(data["objects"]));
                    dispatch(setObjectsTags(data["objects"]));
                
                    let allObjectsTags = new Set();
                    data["objects"].forEach(object => object.current_tag_ids.forEach(tagID => allObjectsTags.add(tagID)));
                    response = await dispatch(getNonCachedTags([...allObjectsTags]));
                    if (getResponseErrorType(response) > enumResponseErrorType.none) return response;   // Stop if nested fetch failed
                }

                return data;
            case 404:
                const error = Math.max(objectIDs.length, objectDataIDs.length) > 1 ? "Objects not found." : "Object not found.";
                return { error };
            default:
                return await getErrorFromResponse(response);
        }
    }; 
};


/**
 * Fetches backend to update provided `obj` data.
 * 
 * Fetches non-cached tags and updates the object in the state in case of success.
 * 
 * Returns object attributes from backend response or an object with `error` attribute containing error message in case of failure.
 */
export const updateObjectFetch = obj => {
    return async (dispatch, getState) => {
        // Validate current object
        let state = getState();
        try {
            validateObject(state, obj);
        } catch (e) {
            dispatch(setObjectOnSaveFetchState(false, e.message));
            return { error: e.message };
        }

        // Run fetch & handle response
        let payload = { object: serializeObjectAttributesAndTagsForUpdateFetch(obj) };
        let object_data = serializeObjectData(state, obj);
        payload.object.object_data = object_data;
        
        let response = await dispatch(runFetch(`${backendURL}/objects/update`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        }));

        switch (response.status) {
            case 200:
                let object = (await response.json()).object;

                // Composite object data updates
                dispatch(setEditedObject({ compositeUpdate: { command: "updateSubobjectsOnSave", object, object_data }}, object.object_id));     // object_data must contain non-mapped IDs of new subobjects
                object_data = modifyObjectDataPostSave(payload, object);

                // Set object attributes, tags and data
                dispatch(addObjects([ object ]));
                dispatch(setObjectsTags([ object ]));
                dispatch(addObjectData([{ object_id: object.object_id, object_type: object.object_type, object_data }]));

                // Fetch non-cached tags
                response = await dispatch(getNonCachedTags(getState().objectsTags[object.object_id]));
                if (getResponseErrorType(response) > enumResponseErrorType.none) return response;   // Stop if nested fetch failed

                return object;
            case 404:
                return { error: "Object not found." };
            default:
                return await getErrorFromResponse(response);
        }
    };
};


/**
 * Fetches backend to delete objects with provided `objectIDs`.
 * 
 * Deletes the objects from the state in case of success.
 * 
 * If `deleteSubobjects` is true, deletes all subobjects of composite objects in `objectIDs` on backend and in local state.
 * 
 * Returns the array of deleted object IDs or an object with `error` attribute containing error message in case of failure.
 */
export const deleteObjectsFetch = (objectIDs, deleteSubobjects) => {
    return async (dispatch, getState) => {
        deleteSubobjects = deleteSubobjects || false;
        let response = await dispatch(runFetch(`${backendURL}/objects/delete`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ object_ids: objectIDs.map(id => parseInt(id)), delete_subobjects: deleteSubobjects })
        }));

        switch (response.status) {
            case 200:
            case 404:   // Objects not present in the database should be deleted from state
                dispatch(deleteObjects({ objectIDs, deleteSubobjects }));
                return objectIDs;
            default:
                return await getErrorFromResponse(response);
        }
    }; 
};


/**
 * Fetches backend to get objects which match provided `queryText` and are not present in `existingIDs`.
 * 
 * Fetches non-cached objects' attributes & tags in case of success.
 * 
 * Returns the array of matching object IDs or an object with `error` attribute containing error message in case of failure.
 */
export const objectsSearchFetch = ({queryText, existingIDs}) => {
    return async (dispatch, getState) => {
        // Check params
        if (queryText.length === 0 || queryText.length > 255) return { error: "queryText is empty or too long." };
        if (existingIDs.length > 1000) return { error: "existingIDs list is too long." };

        // Run fetch & return object IDs
        let payload = JSON.stringify({
            query: {
                query_text: queryText,
                maximum_values: 10,
                existing_ids: existingIDs || []
            }
        });

        let response = await dispatch(runFetch(`${backendURL}/objects/search`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: payload
        }));
        
        switch (response.status) {
            case 200:
                let objectIDs = (await response.json()).object_ids;

                // Fetch non-cached objects
                response = await dispatch(getNonCachedObjects(objectIDs, { attributes: true, tags: true }));
                if (getResponseErrorType(response) > enumResponseErrorType.none) return response;   // Stop if nested fetch failed

                return objectIDs;
            case 404:
                return [];
            default:
                return await getErrorFromResponse(response);
        }
    };
};


/**
 * Fetches missing information for a list of provided `objectIDs`.
 * 
 * Types of missing information (attributes, tags, data) are specified in the `storages` argument.
 */
 export const getNonCachedObjects = (objectIDs, storages = {}) => {
    return async (dispatch, getState) => {
        // Set checked storages
        const { attributes, tags, data } = storages;

        // Get objects with missing attributes or tags
        const state = getState();
        let objectIDsWithNonCachedAttributesOrTags = [];
        if (attributes) objectIDsWithNonCachedAttributesOrTags = objectIDs.filter(objectID => !(objectID in state.objects));
        if (tags) objectIDsWithNonCachedAttributesOrTags.concat(objectIDs.filter(objectID => !(objectID in state.objectsTags)));

        // Get objects with missing data
        let objectIDsWithNonCachedData = [];
        if (data) objectIDsWithNonCachedData = objectIDs.filter(objectID => !objectDataIsInState(state, objectID));

        // Fetch missing information
        return await dispatch(viewObjectsFetch(objectIDsWithNonCachedAttributesOrTags, objectIDsWithNonCachedData));
    };
};


/**
 * Fetches backend for IDs of the objects which correspond to the provided `paginantionInfo` object. 
 * Returns the list of objectIDs for the current page and total number of objects matching the query.
 */
export const getPageObjectIDs = pagination_info => {
    return async (dispatch, getState) => {
        let response = await dispatch(runFetch(`${backendURL}/objects/get_page_object_ids`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pagination_info })
        }));

        switch (response.status) {
            case 200:
                const result = await response.json();
                return result.pagination_info;
            default:
                return await getErrorFromResponse(response);
        }
    };
}


/**
 * Fetches backend to retrieve composite and non-composite objects in the composite hierarchy for the provided `objectID`.
 * 
 * Returns the arrays of composite & non-composite object IDs in the hierarchy or an object with `error` attribute containing error message in case of failure.
 */
 export const viewCompositeHierarchyElementsFetch = object_id => {
    return async (dispatch, getState) => {
        // Fetch object attributes & data
        let payload = { object_id };

        let response = await dispatch(runFetch(`${backendURL}/objects/view_composite_hierarchy_elements`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        }));

        switch (response.status) {
            case 200:
                return await response.json();
            default:
                return await getErrorFromResponse(response);
        }
    }; 
};
