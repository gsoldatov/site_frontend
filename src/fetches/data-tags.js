import config from "../config";
import { runFetch, getErrorFromResponse } from "./common";
import { checkIfTagNameExists } from "../store/state-util/tags";
import { addTags, deleteTags, deselectTags } from "../actions/tags";


const backendURL = config.backendURL;


// Fetches backend to add provided `tag` as a new tag. 
// Adds the tag to the state in case of success.
// Returns the object with the tag attributes returned by backend or an object with `error` attribute containing error message in case of failure.
export const addTagFetch = tag => {
    return async (dispatch, getState) => {
        let state = getState();
        
        // Check if tag_name already exists in local storage
        if (checkIfTagNameExists(state, tag)) return { error: "Tag name already exists." };
        
        // Run fetch & handle response
        let response = await runFetch(`${backendURL}/tags/add`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tag })
        });
        if (response.error !== undefined) return response;  // return error message in case of network error

        switch (response.status) {
            case 200:
                let tag = (await response.json()).tag;
                dispatch(addTags([tag]));
                return tag;
            case 400:
            case 500:
                return getErrorFromResponse(response);
        }
    };
};


// Fetches backend to retrieve tags with provided `tagIDs`.
// Adds the tags to the state in case of success.
// Returns the array of tag data returned by backend or an object with `error` attribute containing error message in case of failure.
export const viewTagsFetch = tagIDs => {
    return async (dispatch, getState) => {
        let response = await runFetch(`${backendURL}/tags/view`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tag_ids: tagIDs.map(id => parseInt(id)) })
        });
        if (response.error !== undefined) return response;  // return error message in case of network error

        switch (response.status) {
            case 200:
                let tags = (await response.json())["tags"];
                dispatch(addTags(tags));
                return tags;
            case 404:
                const error = tagIDs.length > 1 ? "Tags not found." : "Tag not found.";
                return { error };
            case 400:
            case 500:
                return getErrorFromResponse(response);
        }
    }; 
};


// Fetches missing data for a list of provided tag IDs
export const getNonCachedTags = tagIDs => {
    return async (dispatch, getState) => {
        let nonCachedTags = tagIDs.filter(id => !(id in getState().tags));
        if (nonCachedTags.length !== 0) {   // Fetch non-cached tags' data
            return await dispatch(viewTagsFetch(nonCachedTags));
        }
    };
};


// Fetches backend to update provided `tag` data.
// Update the tag in the state in case of success.
// Returns the object with the tag attributes returned by backend or an object with `error` attribute containing error message in case of failure.
export const updateTagFetch = tag => {
    return async (dispatch, getState) => {
        let state = getState();
        
        // Check if tag_name already exists in local storage
        if (checkIfTagNameExists(state, tag)) return { error: "Tag name already exists." };
        
        // Run fetch & handle response
        let response = await runFetch(`${backendURL}/tags/update`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tag })
        });
        if (response.error !== undefined) return response;  // return error message in case of network error

        switch (response.status) {
            case 200:
                let tag = (await response.json()).tag;
                dispatch(addTags([tag]));
                return tag;
            case 404:
                return { error: "Tag not found." };
            case 400:
            case 500:
                return getErrorFromResponse(response);
        }
    };
};


// Fetches backend to delete tags with provided `tagIDs`.
// Delete the tags from the state in case of success.
// Returns the array of deleted tag IDs or an object with `error` attribute containing error message in case of failure.
export const deleteTagsFetch = tagIDs => {
    return async (dispatch, getState) => {
        let response = await runFetch(`${backendURL}/tags/delete`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tag_ids: tagIDs.map(id => parseInt(id)) })
        });
        if (response.error !== undefined) return response;  // return error message in case of network error

        switch (response.status) {
            case 200:
                dispatch(deselectTags(tagIDs));
                dispatch(deleteTags(tagIDs));
                return tagIDs;
            case 404:
                dispatch(deselectTags(tagIDs)); // Tags not present in the database should be deleted from state
                dispatch(deleteTags(tagIDs));
                const error = tagIDs.length > 1 ? "Tags not found." : "Tag not found.";
                return { error };
            case 400:
            case 500:
                return getErrorFromResponse(response);
        }
    }; 
};
