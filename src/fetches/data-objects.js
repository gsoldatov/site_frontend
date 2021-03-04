import config from "../config";

import { runFetch, getErrorFromResponse, responseHasError } from "./common";
import { getNonCachedTags } from "./data-tags";

import { setObjectOnSaveFetchState } from "../actions/object";
import { addObjects, addObjectData, setObjectsTags, deselectObjects, deleteObjects } from "../actions/objects";

import { validateObject, serializeObjectData } from "../store/state-util/objects";


const backendURL = config.backendURL;



// Fetches backend to add provided `obj` as a new object. 
// Adds the object to the state in case of success.
// Returns object attributes from backend response or an object with `error` attribute containing error message in case of failure.
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
        let object_data = serializeObjectData(obj);
        let payload = JSON.stringify({
            object: {
                object_type: obj.object_type,
                object_name: obj.object_name,
                object_description: obj.object_description,
                added_tags: obj.addedTags,
                object_data
            }
        });

        
        let response = await runFetch(`${backendURL}/objects/add`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: payload
        });
        if (responseHasError(response)) return response;  // return error message in case of network error

        switch (response.status) {
            case 200:
                let object = (await response.json()).object;
                dispatch(setObjectsTags([object]));     // Set objects tags
                dispatch(addObjects([object]));         // Add object
                dispatch(addObjectData([{ object_id: object.object_id, object_type: object.object_type, object_data: object_data }]));
                return object;
            case 400:
            case 500:
                return getErrorFromResponse(response);
        }
    };
};


// Fetches backend to retrieve objects attributes for provided `objectIDs` and object data for `objectDataIDs`.
// Adds the objects and data to the state in case of success.
// Fetches non-cached tags, if object attributes were fetched for at least one object.
// Returns the arrays of object attributes and data returned by backend or an object with `error` attribute containing error message in case of failure.
export const viewObjectsFetch = (objectIDs, objectDataIDs) => {
    return async (dispatch, getState) => {
        if ((objectIDs || []).length === 0 && (objectDataIDs || []).length === 0) return {};

        // Fetch object attributes & data
        let payload = {};
        if (objectIDs) payload["object_ids"] = objectIDs;
        if (objectDataIDs) payload["object_data_ids"] = objectDataIDs;

        let response = await runFetch(`${backendURL}/objects/view`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        if (responseHasError(response)) return response;  // return error message in case of network error

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
                    if (responseHasError(response)) return response;  // return error message in case of network error
                }

                return data;
            case 404:
                const error = Math.max(objectIDs.length, objectDataIDs.length) > 1 ? "Objects not found." : "Object not found.";
                return { error };
            case 400:
            case 500:
                return await getErrorFromResponse(response);
        }
    }; 
};


// Fetches backend to update provided `obj` data.
// Fetches non-cached tags and updates the object in the state in case of success.
// Returns object attributes from backend response or an object with `error` attribute containing error message in case of failure.
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
        let object_data = serializeObjectData(obj);
        let payload = JSON.stringify({
            object: {
                object_id: obj.object_id,
                object_name: obj.object_name,
                object_description: obj.object_description,
                object_data: object_data,
                added_tags: obj.addedTags,
                removed_tag_ids: obj.removedTagIDs
            }
        });
        
        let response = await runFetch(`${backendURL}/objects/update`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: payload
        });
        if (responseHasError(response)) return response;  // return error message in case of network error

        switch (response.status) {
            case 200:
                let object = (await response.json()).object;

                // Set object attributes, tags and data
                dispatch(addObjects([ object ]));
                dispatch(setObjectsTags([ object ]));
                dispatch(addObjectData([{ object_id: object.object_id, object_type: object.object_type, object_data }]));

                // Fetch non-cached tags
                response = await dispatch(getNonCachedTags(getState().objectsTags[object.object_id]));
                if (responseHasError(response)) return response;  // return error message in case of network error

                return object;
            case 404:
                return { error: "Object not found." };
            case 400:
            case 500:
                return await getErrorFromResponse(response);
        }
    };
};


// Fetches backend to delete objects with provided `objectIDs`.
// Deletes the objects from the state in case of success.
// Returns the array of deleted object IDs or an object with `error` attribute containing error message in case of failure.
export const deleteObjectsFetch = objectIDs => {
    return async (dispatch, getState) => {
        let response = await runFetch(`${backendURL}/objects/delete`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ object_ids: objectIDs.map(id => parseInt(id)) })
        });
        if (responseHasError(response)) return response;  // return error message in case of network error

        switch (response.status) {
            case 200:
            case 404:   // Objects not present in the database should be deleted from state
                dispatch(deselectObjects(objectIDs));
                dispatch(deleteObjects(objectIDs));
                return objectIDs;
            case 400:
            case 500:
                return await getErrorFromResponse(response);
        }
    }; 
};
