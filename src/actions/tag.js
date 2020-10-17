import config from "../config";
import { isFetchingTag, checkIfCurrentTagNameExists } from "../store/state-check-functions";
import { addTags, deleteTags, deselectTags } from "./tags";

const backendURL = config.backendURL;

export const LOAD_ADD_TAG_PAGE = "LOAD_ADD_TAG_PAGE";
export const LOAD_EDIT_TAG_PAGE = "LOAD_EDIT_TAG_PAGE";
export const SET_CURRENT_TAG = "SET_CURRENT_TAG";
export const SET_TAG_REDIRECT_ON_RENDER  = "SET_TAG_REDIRECT_ON_RENDER";
export const SET_TAG_ON_LOAD_FETCH_STATE = "SET_TAG_ON_LOAD_FETCH_STATE";
export const SET_TAG_ON_SAVE_FETCH_STATE = "SET_TAG_ON_SAVE_FETCH_STATE";
export const SET_SHOW_DELETE_DIALOG_TAG = "SET_SHOW_DELETE_DIALOG_TAG";

export const loadAddTagPage      = () => ({ type: LOAD_ADD_TAG_PAGE });
export const loadEditTagPage     = () => ({ type: LOAD_EDIT_TAG_PAGE });
export const setCurrentTag       = (tag) => ({ type: SET_CURRENT_TAG, tag: tag });
export const setTagRedirectOnRender = (redirectOnRender = "") => ({ type: SET_TAG_REDIRECT_ON_RENDER, redirectOnRender: redirectOnRender });
export const setShowDeleteDialogTag = (showDeleteDialog = false) => ({ type: SET_SHOW_DELETE_DIALOG_TAG, showDeleteDialog: showDeleteDialog });

export const setTagOnLoadFetchState = (isFetching = false, fetchError = "") => {
    return {
        type: SET_TAG_ON_LOAD_FETCH_STATE,
        isFetching: isFetching,
        fetchError: fetchError
    };
};

export const setTagOnSaveFetchState = (isFetching = false, fetchError = "") => {
    return {
        type: SET_TAG_ON_SAVE_FETCH_STATE,
        isFetching: isFetching,
        fetchError: fetchError
    };
};

export function addTagOnSaveFetch() {
    return async (dispatch, getState) => {
        let state = getState();

        // Exit if already fetching
        if (isFetchingTag(state)) {
            return;
        }

        // Check if tag_name already exists in local storage
        if (checkIfCurrentTagNameExists(state)) {
            dispatch(setTagOnSaveFetchState(false, "Tag name already exists."));
            return;
        }

        // Update fetch status
        dispatch(setTagOnSaveFetchState(true, ""));

        // Post the tag and handle response & errors
        let payload = JSON.stringify({
            tag: {
                tag_name: state.tagUI.currentTag.tag_name,
                tag_description: state.tagUI.currentTag.tag_description
            }
        });

        try {
            let response = await fetch(`${backendURL}/tags/add`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: payload
            });

            switch (response.status) {
                case 200:
                    let tag = (await response.json()).tag;
                    dispatch(addTags([tag]));
                    dispatch(setTagOnSaveFetchState(false, ""));
                    dispatch(setTagRedirectOnRender(`/tags/${tag.tag_id}`));
                    break;
                case 400:
                    throw Error((await response.json())._error);
                case 500:
                    throw Error(await response.text());
            }
        } catch (error) {
            dispatch(setTagOnSaveFetchState(false, error.message));
        }
    };
};

export function editTagOnLoadFetch(tag_id) {
    return async (dispatch, getState) => {
        console.log("in editTagOnLoadFetch thunk, tag_id = " + tag_id)
        // Set initial page state
        dispatch(loadEditTagPage());

        let state = getState();

        // Check local tag storage
        if (tag_id in state.tags) {
            dispatch(setCurrentTag({ ...state.tags[tag_id] }))
            return;
        }
        
        // Update fetch status
        dispatch(setTagOnLoadFetchState(true, ""));

        // Fetch tag data and handle response
        let payload = JSON.stringify({ tag_ids: [parseInt(tag_id)] });

        try {
            let response = await fetch(`${backendURL}/tags/view`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: payload
            });

            switch (response.status) {
                case 200:
                    let tag = (await response.json())["tags"][0];
                    dispatch(addTags([tag]));
                    dispatch(setCurrentTag(tag));
                    dispatch(setTagOnLoadFetchState(false, ""));
                    break;
                case 400:
                    throw Error((await response.json())._error);
                case 404:
                    throw Error("Tag not found.");
                case 500:
                    throw Error(await response.text());
            }
        }
        catch (error) {
            dispatch(setTagOnLoadFetchState(false, error.message));
        }
    };
};

export function editTagOnSaveFetch() {
    return async (dispatch, getState) => {
        let state = getState();

        // Exit if already fetching
        if (isFetchingTag(state)) {
            return;
        }

        // Check if tag_name already exists in local storage
        if (checkIfCurrentTagNameExists(state)) {
            dispatch(setTagOnSaveFetchState(false, "Tag name already exists."));
            return;
        }
        
        // Update fetch status
        dispatch(setTagOnSaveFetchState(true, ""));

        // Fetch tag data and handle response
        let payload = JSON.stringify({ 
            tag: {
                tag_id: state.tagUI.currentTag.tag_id,
                tag_name: state.tagUI.currentTag.tag_name,
                tag_description: state.tagUI.currentTag.tag_description
            } 
        });

        try {
            let response = await fetch(`${backendURL}/tags/update`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: payload
            });

            switch (response.status) {
                case 200:
                    let tag = (await response.json()).tag;
                    dispatch(addTags([tag]));
                    dispatch(setCurrentTag(tag));
                    dispatch(setTagOnSaveFetchState(false, ""));
                    break;
                case 400:
                    throw Error((await response.json())._error);
                case 404:
                    throw Error("Tag not found.");
                case 500:
                    throw Error(await response.text());
            }
        } catch (error) {
            dispatch(setTagOnSaveFetchState(false, error.message));
        }
    };        
};

export function editTagOnDeleteFetch() {
    return async (dispatch, getState) => {
        // Hide delete dialog
        dispatch(setShowDeleteDialogTag(false));

        // Exit if already fetching
        let state = getState();

        if (isFetchingTag(state)) {
            return;
        }
        
        // Update fetch status
        dispatch(setTagOnSaveFetchState(true, ""));

        // Fetch tag data and handle response
        let tag_ids = [state.tagUI.currentTag.tag_id];
        let payload = JSON.stringify({ 
            tag_ids: tag_ids
        });

        try {
            let response = await fetch(`${backendURL}/tags/delete`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: payload
            });
                        
            switch (response.status) {
                case 200:
                case 404:   // Tags not present in the database should be deleted from state
                    dispatch(setTagOnSaveFetchState(false, response.status === 200 ? "" : "Tag(s) not found."));
                    dispatch(deselectTags(tag_ids));
                    dispatch(deleteTags(tag_ids));
                    dispatch(setTagRedirectOnRender("/tags"));
                    break;
                case 400:
                    throw Error((await response.json())._error);
                case 500:
                    throw Error(await response.text());
            }
        } catch (error) {
            dispatch(setTagOnSaveFetchState(false, error.message));
        }
    };      
};
