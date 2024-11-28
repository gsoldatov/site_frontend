import { getConfig } from "../config";

import { runFetch, getErrorFromResponse } from "./common";
import { fetchMissingTags } from "./data/tags";

import { updateObjectsTags } from "../reducers/data/objects-tags";
import { addObjectsAttributes, addObjectsDataFromBackend } from "../reducers/data/objects";
import { updateEditedComposite } from "../reducers/data/edited-objects";

import { validateObject, serializeObjectAttributesAndTagsForAddFetch, serializeObjectAttributesAndTagsForUpdateFetch,
    serializeObjectData, modifyObjectDataPostSave } from "../store/state-util/objects";

const backendURL = getConfig().backendURL;


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
                dispatch(updateEditedComposite(object.object_id, { command: "updateSubobjectsOnSave", object, object_data }));     // object_data must contain non-mapped IDs of new subobjects
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
