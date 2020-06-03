import config from "../config";

const backendURL = config.backendURL;

export const LOAD_ADD_TAG_PAGE = "LOAD_ADD_TAG_PAGE";
export const LOAD_EDIT_TAG_PAGE = "LOAD_EDIT_TAG_PAGE";
export const SET_CURRENT_TAG = "SET_CURRENT_TAG";
export const ADD_TAG = "ADD_TAG";
export const SET_REDIRECT_ON_RENDER  = "SET_REDIRECT_ON_RENDER";
export const SET_ADD_TAG_FETCH_STATE = "SET_ADD_TAG_FETCH_STATE";
export const SET_EDIT_TAG_FETCH_STATE = "SET_EDIT_TAG_FETCH_STATE";

export const loadAddTagPage      = () => ({ type: LOAD_ADD_TAG_PAGE });
export const loadEditTagPage     = () => ({ type: LOAD_EDIT_TAG_PAGE });
export const setCurrentTag       = (tag) => ({ type: SET_CURRENT_TAG, tag: tag });
export const addTag              = (tag) => ({ type: ADD_TAG, tag: tag });
export const setRedirectOnRender = (redirectOnRender = "") => ({ type: SET_REDIRECT_ON_RENDER, redirectOnRender: redirectOnRender });

export const setAddTagFetchState = (isFetching = false, fetchError = "") => {
    return {
        type: SET_ADD_TAG_FETCH_STATE,
        isFetching: isFetching,
        fetchError: fetchError
    };
};

export const setEditTagFetchState = (isFetching = false, fetchError = "", fetchType = "onLoad") => {
    return {
        type: SET_EDIT_TAG_FETCH_STATE,
        isFetching: isFetching,
        fetchError: fetchError,
        fetchType: fetchType
    }
}

export function addTagFetch() {
    return (dispatch, getState) => {
        // Check if tag_name already exists in local storage
        let state = getState();
        let tags = state.tags;
        let currentTagNameLowered = state.tagUI.currentTag.tag_name.toLowerCase();

        for (let i in tags) {
            if (currentTagNameLowered === tags[i].tag_name.toLowerCase()) {
                let fetchError = `Tag name "${tags[i].tag_name}" already exists.`;
                dispatch(setAddTagFetchState(false, fetchError));
                return;
            }
        }

        // Update fetch status
        dispatch(setAddTagFetchState(true, ""));

        // Post the tag and handle response & errors
        let payload = JSON.stringify({
            tag_name: state.tagUI.currentTag.tag_name,
            tag_description: state.tagUI.currentTag.tag_description
        });

        return fetch(`${backendURL}/tags/add`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: payload
        }).then(response => {
            switch (response.status) {
                case 200:
                    return response.json().then(json => ({ error: "", tag: json }));
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
            dispatch(setAddTagFetchState(false, error));
            dispatch(setRedirectOnRender(redirectOnRender));
        }).catch(error => {
            dispatch(setAddTagFetchState(false, error.message));
        });
    };
};

export function editTagOnLoadFetch(tag_id) {
    return (dispatch, getState) => {
        let state = getState();

        // exit if already fetching
        if (state.tagUI.editTagFetch.isFetching) {
            return;
        }

        // Check local tag storage
        if (tag_id in state.tags) {
            dispatch(setCurrentTag({ ...state.tags[tag_id] }))
            return;
        }
        
        // Update fetch status
        dispatch(setEditTagFetchState(true, "", "onLoad"));

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
            dispatch(setEditTagFetchState(false, error, "onLoad"));
        }).catch(error => {
            dispatch(setEditTagFetchState(false, error.message, "onLoad"));
        });
    };
};
