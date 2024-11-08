import { getConfig } from "../config";
import { runFetch, getErrorFromResponse, getResponseErrorType } from "./common";
import { enumResponseErrorType } from "../util/enums/enum-response-error-type";

import { deleteTags } from "../actions/data-tags";
import { addTags } from "../reducers/data/tags";
import { updateObjectsTags } from "../reducers/data/objects-tags";
import { addObjects } from "../actions/data-objects";
import { deselectTags } from "../actions/tags-list";
import { resetEditedObjectsTags } from "../actions/objects-edit";

import { checkIfTagNameExists } from "../store/state-util/tags";



const backendURL = getConfig().backendURL;


/**
 * Fetches backend to add provided `tag` as a new tag. 
 * 
 * Adds the tag to the state in case of success.
 * 
 * Returns the object with the tag attributes returned by backend or an object with `error` attribute containing error message in case of failure.
 */
export const addTagFetch = tag => {
    return async (dispatch, getState) => {        
        // Check if tag_name already exists in local storage
        let state = getState();
        if (checkIfTagNameExists(state, tag)) return { error: "Tag name already exists." };
        
        // Run fetch & handle response
        let response = await dispatch(runFetch(`${backendURL}/tags/add`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tag })
        }));

        switch (response.status) {
            case 200:
                let tag = (await response.json()).tag;
                dispatch(addTags([tag]));
                return tag;
            default:
                return await getErrorFromResponse(response);
        }
    };
};


/**
 * Fetches backend to retrieve tags with provided `tagIDs`.
 * 
 * Adds the tags to the state in case of success.
 * 
 * Returns the array of tag data returned by backend or an object with `error` attribute containing error message in case of failure.
 */
export const viewTagsFetch = tagIDs => {
    return async (dispatch, getState) => {
        let response = await dispatch(runFetch(`${backendURL}/tags/view`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tag_ids: tagIDs.map(id => parseInt(id)) })
        }));

        switch (response.status) {
            case 200:
                let tags = (await response.json())["tags"];
                dispatch(addTags(tags));
                return tags;
            case 404:
                const error = tagIDs.length > 1 ? "Tags not found." : "Tag not found.";
                return { error };
            default:
                return await getErrorFromResponse(response);
        }
    }; 
};


/**
 * Fetches missing data for a list of provided `tagIDs`.
 * Filters out non-numerice IDs (new tag case).
 */
export const getNonCachedTags = tagIDs => {
    return async (dispatch, getState) => {
        let nonCachedTags = tagIDs.filter(id => !(id in getState().tags) && !isNaN(id));
        if (nonCachedTags.length !== 0) {   // Fetch non-cached tags' data
            return await dispatch(viewTagsFetch(nonCachedTags));
        }
    };
};


/**
 * Fetches backend to update provided `tag` data.
 * 
 * Updates the tag in the state in case of success.
 * 
 * Returns the object with the tag attributes returned by backend or an object with `error` attribute containing error message in case of failure.
 */
export const updateTagFetch = tag => {
    return async (dispatch, getState) => {        
        // Check if tag_name already exists in local storage
        let state = getState();
        if (checkIfTagNameExists(state, tag)) return { error: "Tag name already exists." };
        
        // Run fetch & handle response
        let response = await dispatch(runFetch(`${backendURL}/tags/update`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tag })
        }));

        switch (response.status) {
            case 200:
                let tag = (await response.json()).tag;
                dispatch(addTags([tag]));
                return tag;
            case 404:
                return { error: "Tag not found." };
            default:
                return await getErrorFromResponse(response);
        }
    };
};


/**
 * Fetches backend to delete tags with provided `tagIDs`.
 * 
 * Deletes the tags from the state in case of success.
 * 
 * Returns the array of deleted tag IDs or an object with `error` attribute containing error message in case of failure.
 */
export const deleteTagsFetch = tagIDs => {
    return async (dispatch, getState) => {
        let response = await dispatch(runFetch(`${backendURL}/tags/delete`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tag_ids: tagIDs.map(id => parseInt(id)) })
        }));

        switch (response.status) {
            case 200:
            case 404:   // Tags not present in the database should be deleted from state
                dispatch(deselectTags(tagIDs));
                dispatch(deleteTags(tagIDs));
                return tagIDs;
            default:
                return await getErrorFromResponse(response);
        }
    }; 
};


/**
 * Fetches backend to get tags which match provided `queryText` and are not present in `existingIDs`.
 * 
 * Fetches non-cached tags in case of success.
 * 
 * Returns the array of matching tag IDs or an object with `error` attribute containing error message in case of failure.
 */
export const tagsSearchFetch = ({queryText, existingIDs}) => {
    return async (dispatch, getState) => {
        // Check params
        if (queryText.length === 0 || queryText.length > 255) return { error: "queryText is empty or too long." };
        if (existingIDs.length > 1000) return { error: "existingIDs list is too long." };

        // Run fetch & return tag IDs
        let payload = JSON.stringify({
            query: {
                query_text: queryText,
                maximum_values: 10,
                existing_ids: existingIDs || []
            }
        });

        let response = await dispatch(runFetch(`${backendURL}/tags/search`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: payload
        }));

        switch (response.status) {
            case 200:
                let tagIDs = (await response.json()).tag_ids;

                // Fetch non-cahced tags
                response = await dispatch(getNonCachedTags(tagIDs));
                if (getResponseErrorType(response) > enumResponseErrorType.none) return response;   // Stop if nested fetch failed
                return tagIDs;
            case 404:
                return [];
            default:
                return await getErrorFromResponse(response);
        }
    };
};


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
                response = await dispatch(getNonCachedTags(json.tag_updates.added_tag_ids));
                if (getResponseErrorType(response) > enumResponseErrorType.none) return response;   // Stop if nested fetch failed
                return json;
            default:
                return await getErrorFromResponse(response);
        }
    };
};
