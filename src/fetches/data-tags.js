import { getConfig } from "../config";
import { runFetch, getErrorFromResponse, getResponseErrorType } from "./common";
import { enumResponseErrorType } from "../util/enums/enum-response-error-type";

import { addTags, deleteTags } from "../reducers/data/tags";
import { updateObjectsTags } from "../reducers/data/objects-tags";
import { addObjects } from "../actions/data-objects";
import { deselectTags } from "../reducers/ui/tags-list";
import { resetEditedObjectsTags } from "../actions/objects-edit";

import { checkIfTagNameExists } from "../store/state-util/tags";
import { getNonCachedTags } from "./data/tags";



const backendURL = getConfig().backendURL;





/**
 * Fetches backend update tags of objects with provided `object_ids` with `added_tags` and `removed_tag_ids`.
 * 
 * Fetches non-cached tags and updates objects' attributes and tags in case of success.
 * 
 * Returns the object IDs and tag updates from fetch response or an object with `error` attribute containing error message in case of failure.
 */
export const objectsTagsUpdateFetch = (object_ids, added_tags, removed_tag_ids) => {
    return async (dispatch, getState) => {
        // Run tags update fetch
        let payload = JSON.stringify({ object_ids, added_tags, removed_tag_ids });

        let response = await dispatch(runFetch(`${backendURL}/objects/update_tags`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: payload
        }));

        switch (response.status) {
            case 200:
                const json = (await response.json());

                // Update objects tags & query missing tags
                // let objects = object_ids.map(objectID => ({ object_id: objectID, tag_updates: json.tag_updates }));
                const { added_tag_ids = [], removed_tag_ids = [] } = json.tag_updates;
                dispatch(updateObjectsTags(object_ids, added_tag_ids, removed_tag_ids));

                // Update modified_at attributes of the objects
                let state = getState();
                const modifiedAt = json.modified_at;
                let objects = [];
                object_ids.forEach(objectID => {
                    let object = {...state.objects[objectID]};
                    object.modified_at = modifiedAt;
                    objects.push(object);
                });
                dispatch(addObjects(objects));

                // Reset all updated objects' tags and modified_at in state.editedObjects
                dispatch(resetEditedObjectsTags(object_ids, modifiedAt));

                // Fetch non-cahced tags
                const getNonCachedTagsResult = await dispatch(getNonCachedTags(json.tag_updates.added_tag_ids));
                if (getNonCachedTagsResult.failed) return { error: getNonCachedTagsResult.error };  // TODO return fetch result?

                return json;
            default:
                return await getErrorFromResponse(response);
        }
    };
};
