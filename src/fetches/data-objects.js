import { getConfig } from "../config";

import { runFetch, getErrorFromResponse } from "./common";
import { fetchMissingObjects } from "./data/objects";
import { fetchMissingTags } from "./data/tags";

import { updateObjectsTags } from "../reducers/data/objects-tags";
import { deleteObjects } from "../actions/data-objects";
import { addObjectsAttributes, addObjectsDataFromBackend } from "../reducers/data/objects";
import { setEditedObject, setObjectsEditSaveFetchState } from "../actions/objects-edit";

import { validateObject, serializeObjectAttributesAndTagsForAddFetch, serializeObjectAttributesAndTagsForUpdateFetch,
    serializeObjectData, modifyObjectDataPostSave } from "../store/state-util/objects";

const backendURL = getConfig().backendURL;


/**
 * Fetches backend to add provided edited object `obj` as a new object.
 * 
 * Adds the object to the state in case of success.
 * 
 * Returns object attributes from backend response or an object with `error` attribute containing error message in case of failure.
 */
export const objectsAddFetch = obj => {
    return async (dispatch, getState) => {
        // Validate current object
        let state = getState();
        try {
            validateObject(state, obj);
        } catch (e) {
            dispatch(setObjectsEditSaveFetchState(false, e.message));
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
                dispatch(addObjectsAttributes([object]));         // Add object
                const { added_tag_ids = [], removed_tag_ids = [] } = object.tag_updates;
                dispatch(updateObjectsTags([object.object_id], added_tag_ids, removed_tag_ids));    // Set objects tags
                dispatch(addObjectsDataFromBackend([{ object_id: object.object_id, object_type: object.object_type, object_data: object_data }]));
                return object;
            default:
                return getErrorFromResponse(response);
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
export const objectsUpdateFetch = obj => {
    return async (dispatch, getState) => {
        // Validate current object
        let state = getState();
        try {
            validateObject(state, obj);
        } catch (e) {
            dispatch(setObjectsEditSaveFetchState(false, e.message));
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
                dispatch(addObjectsAttributes([ object ]));
                const { added_tag_ids = [], removed_tag_ids = [] } = object.tag_updates;
                dispatch(updateObjectsTags([object.object_id], added_tag_ids, removed_tag_ids));    // Set objects tags
                dispatch(addObjectsDataFromBackend([{ object_id: object.object_id, object_type: object.object_type, object_data }]));

                // Fetch non-cached tags
                const fetchMissingTagsResult = await dispatch(fetchMissingTags(getState().objectsTags[object.object_id]));

                // Handle tag fetch errors
                if (fetchMissingTagsResult.failed) return { error: fetchMissingTagsResult.error };   // TODO return fetch result?

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
export const objectsDeleteFetch = (objectIDs, deleteSubobjects) => {
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
