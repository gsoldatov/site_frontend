import config from "../config";
import { isFetchingTag, checkIfCurrentTagNameExists } from "../store/state-check-functions";

const backendURL = config.backendURL;

export const LOAD_ADD_TAG_PAGE = "LOAD_ADD_TAG_PAGE";
export const LOAD_EDIT_TAG_PAGE = "LOAD_EDIT_TAG_PAGE";
export const SET_CURRENT_TAG = "SET_CURRENT_TAG";
export const ADD_TAG = "ADD_TAG";
export const DELETE_TAGS = "DELETE_TAGS";
export const SET_REDIRECT_ON_RENDER  = "SET_REDIRECT_ON_RENDER";
export const SET_ADD_TAG_ON_SAVE_FETCH_STATE = "SET_ADD_TAG_ON_SAVE_FETCH_STATE";
export const SET_EDIT_TAG_ON_LOAD_FETCH_STATE = "SET_EDIT_TAG_ON_LOAD_FETCH_STATE";
export const SET_EDIT_TAG_ON_SAVE_FETCH_STATE = "SET_EDIT_TAG_ON_SAVE_FETCH_STATE";
export const SET_EDIT_TAG_ON_DELETE_FETCH_STATE = "SET_EDIT_TAG_ON_DELETE_FETCH_STATE";
export const SET_SHOW_DELETE_DIALOG = "SET_SHOW_DELETE_DIALOG";

export const loadAddTagPage      = () => ({ type: LOAD_ADD_TAG_PAGE });
export const loadEditTagPage     = () => ({ type: LOAD_EDIT_TAG_PAGE });
export const setCurrentTag       = (tag) => ({ type: SET_CURRENT_TAG, tag: tag });
export const addTag              = (tag) => ({ type: ADD_TAG, tag: tag });
export const deleteTags          = (tag_ids) => ({ type: DELETE_TAGS, tag_ids: tag_ids });
export const setRedirectOnRender = (redirectOnRender = "") => ({ type: SET_REDIRECT_ON_RENDER, redirectOnRender: redirectOnRender });
export const setShowDeleteDialog = (showDeleteDialog = false) => ({ type: SET_SHOW_DELETE_DIALOG, showDeleteDialog: showDeleteDialog });

export const setAddTagOnSaveFetchState = (isFetching = false, fetchError = "", lastFetch = undefined) => {
    return {
        type: SET_ADD_TAG_ON_SAVE_FETCH_STATE,
        isFetching: isFetching,
        fetchError: fetchError,
        lastFetch: lastFetch
    };
};

export const setEditTagOnLoadFetchState = (isFetching = false, fetchError = "", lastFetch = undefined) => {
    return {
        type: SET_EDIT_TAG_ON_LOAD_FETCH_STATE,
        isFetching: isFetching,
        fetchError: fetchError,
        lastFetch: lastFetch
    };
};

export const setEditTagOnSaveFetchState = (isFetching = false, fetchError = "", lastFetch = undefined) => {
    return {
        type: SET_EDIT_TAG_ON_SAVE_FETCH_STATE,
        isFetching: isFetching,
        fetchError: fetchError,
        lastFetch: lastFetch
    };
};

export const setEditTagOnDeleteFetchState = (isFetching = false, fetchError = "", lastFetch = undefined) => {
    return {
        type: SET_EDIT_TAG_ON_DELETE_FETCH_STATE,
        isFetching: isFetching,
        fetchError: fetchError,
        lastFetch: lastFetch
    };
};

export function addTagOnSaveFetch() {
    return (dispatch, getState) => {
        let state = getState();

        // Exit if already fetching
        if (isFetchingTag(state)) {
            return;
        }

        // Check if tag_name already exists in local storage
        if (checkIfCurrentTagNameExists(state)) {
            dispatch(setAddTagOnSaveFetchState(false, "Tag name already exists.", "addTagOnSave"));
            return;
        }

        // Update fetch status
        dispatch(setAddTagOnSaveFetchState(true, "", ""));

        // Post the tag and handle response & errors
        let payload = JSON.stringify({
            tag: {
                tag_name: state.tagUI.currentTag.tag_name,
                tag_description: state.tagUI.currentTag.tag_description
            }
        });

        return fetch(`${backendURL}/tags/add`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: payload
        }).then(response => {
            switch (response.status) {
                case 200:
                    return response.json().then(json => ({ error: "", tag: json["tag"] }));
                case 400:
                    return response.json().then(json => ({ error: json._error, tag: null }));
                case 500:
                    return response.text().then(text => ({ error: text, tag: null }));
            }
        }).then(({ error, tag }) => {
            let redirectOnRender = tag ? `/tags/${tag.tag_id}` : "";
            if (tag) {
                dispatch(addTag(tag))
            }
            dispatch(setAddTagOnSaveFetchState(false, error, "addTagOnSave"));
            dispatch(setRedirectOnRender(redirectOnRender));
        }).catch(error => {
            dispatch(setAddTagOnSaveFetchState(false, error.message, "addTagOnSave"));
        });
    };
};

export function editTagOnLoadFetch(tag_id) {
    return (dispatch, getState) => {
        let state = getState();

        // Exit if already fetching
        if (isFetchingTag(state)) {
            return;
        }

        // Check local tag storage
        if (tag_id in state.tags) {
            dispatch(setCurrentTag({ ...state.tags[tag_id] }))
            return;
        }
        
        // Update fetch status
        dispatch(setEditTagOnLoadFetchState(true, "", ""));

        // Fetch tag data and handle response
        let payload = JSON.stringify({ tag_ids: [parseInt(tag_id)] });

        return fetch(`${backendURL}/tags/view`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: payload
        }).then(response => {
            switch (response.status) {
                case 200:
                    return response.json().then(json => ({ error: "", tag: json["tags"][0] }));
                case 400:
                    return response.json().then(json => ({ error: json._error, tag: null }));
                case 404:
                    return response.json().then(json => ({ error: "Tag not found.", tag: null }));
                case 500:
                    return response.text().then(text => ({ error: text, tag: null }));
            }
        }).then(({ error, tag }) => {
            if (tag) {
                dispatch(addTag(tag))
                dispatch(setCurrentTag(tag))
            }
            dispatch(setEditTagOnLoadFetchState(false, error, "editTagOnLoad"));
        }).catch(error => {
            dispatch(setEditTagOnLoadFetchState(false, error.message, "editTagOnLoad"));
        });
    };
};

export function editTagOnSaveFetch() {
    return (dispatch, getState) => {
        let state = getState();

        // Exit if already fetching
        if (isFetchingTag(state)) {
            return;
        }

        // Check if tag_name already exists in local storage
        if (checkIfCurrentTagNameExists(state)) {
            dispatch(setEditTagOnSaveFetchState(false, "Tag name already exists.", "editTagOnSave"));
            return;
        }
        
        // Update fetch status
        dispatch(setEditTagOnSaveFetchState(true, "", ""));

        // Fetch tag data and handle response
        let payload = JSON.stringify({ 
            tag: {
                tag_id: state.tagUI.currentTag.tag_id,
                tag_name: state.tagUI.currentTag.tag_name,
                tag_description: state.tagUI.currentTag.tag_description
            } 
        });

        return fetch(`${backendURL}/tags/update`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: payload
        }).then(response => {
            switch (response.status) {
                case 200:
                    return response.json().then(json => ({ error: "", tag: json["tag"] }));
                case 400:
                    return response.json().then(json => ({ error: json._error, tag: null }));
                case 404:
                    return response.json().then(json => ({ error: "Tag not found.", tag: null }));
                case 500:
                    return response.text().then(text => ({ error: text, tag: null }));
            }
        }).then(({ error, tag }) => {
            if (tag) {
                dispatch(addTag(tag))
                dispatch(setCurrentTag(tag))
            }
            dispatch(setEditTagOnSaveFetchState(false, error, "editTagOnSave"));
        }).catch(error => {
            dispatch(setEditTagOnSaveFetchState(false, error.message, "editTagOnSave"));
        });
    };        
};

export function editTagOnDeleteFetch() {       // TODO delete by list of tag_ids => delete thunk => backend route + tests => integration
    return (dispatch, getState) => {
        // Hide delete dialog
        dispatch(setShowDeleteDialog(false));

        // Exit if already fetching
        let state = getState();

        if (isFetchingTag(state)) {
            return;
        }
        
        // Update fetch status
        dispatch(setEditTagOnDeleteFetchState(true, "", ""));

        // Fetch tag data and handle response
        let tag_ids = [state.tagUI.currentTag.tag_id];
        let payload = JSON.stringify({ 
            tag_ids: tag_ids
        });

        return fetch(`${backendURL}/tags/delete`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: payload
        }).then(response => {
            switch (response.status) {
                case 200:
                    return response.json().then(() => ({ error: "", deleteFromState: true }));
                case 400:
                    return response.json().then(json => ({ error: json._error, deleteFromState: false }));
                case 404:
                    return response.json().then(() => ({ error: "Tag(s) not found.", deleteFromState: true }));     // If currentTag is not in the database, then it should be deleted anyway
                case 500:
                    return response.text().then(text => ({ error: text, deleteFromState: false }));
            }
        }).then(({ error, deleteFromState }) => {
            dispatch(setEditTagOnDeleteFetchState(false, error, "editTagOnDelete"));
            if (deleteFromState) {
                dispatch(deleteTags(tag_ids));
                dispatch(setRedirectOnRender("/tags"));
            }
        }).catch(error => {
            dispatch(setEditTagOnDeleteFetchState(false, error.message, "editTagOnDelete"));
        });
    };        
};
