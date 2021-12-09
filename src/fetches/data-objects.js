import config from "../config";

import { runFetch, getErrorFromResponse, getResponseErrorType } from "./common";
import { enumResponseErrorType } from "../util/enum-response-error-type";
import { getNonCachedTags } from "./data-tags";

import { setObjectsTags } from "../actions/data-tags";
import { addObjects, addObjectData, deleteObjects } from "../actions/data-objects";
import { setEditedObject, setObjectOnSaveFetchState } from "../actions/objects-edit";

import { validateObject, serializeObjectData, modifyObjectDataPostSave } from "../store/state-util/objects";
import { addedObjectAttributes, updatedObjectAttributes } from "../store/state-templates/edited-object";


const backendURL = config.backendURL;


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
        let object_data = serializeObjectData(state, obj);
        let payload = { object: { added_tags: obj.addedTags, object_data }};
        for (let attr of addedObjectAttributes) payload.object[attr] = obj[attr];
        
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
        let object_data = serializeObjectData(state, obj);
        let payload = { object: { added_tags: obj.addedTags, removed_tag_ids: obj.removedTagIDs, object_data }};
        for (let attr of updatedObjectAttributes) payload.object[attr] = obj[attr];
        
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
                let state = getState();
                let nonCachedObjectIDs = objectIDs.filter(objectID => !(objectID in state.objects && objectID in state.objectsTags))
                if (nonCachedObjectIDs.length > 0) {
                    response = await dispatch(viewObjectsFetch(nonCachedObjectIDs, undefined));
                    if (getResponseErrorType(response) > enumResponseErrorType.none) return response;   // Stop if nested fetch failed
                }

                return objectIDs;
            case 404:
                return [];
            default:
                return await getErrorFromResponse(response);
        }
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
