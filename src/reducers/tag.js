import { LOAD_ADD_TAG_PAGE, LOAD_EDIT_TAG_PAGE, SET_CURRENT_TAG, ADD_TAG, SET_REDIRECT_ON_RENDER, 
        SET_ADD_TAG_FETCH_STATE, SET_EDIT_TAG_FETCH_STATE } from "../actions/tag";

function loadAddTagPage(state, action) {
    return {
        ...state,
        tagUI: {
            ...state.tagUI,
            currentTag: {
                tag_id: 0,
                tag_name: "",
                tag_description: "",
                created_at: "",
                modified_at: ""
            },
            addTagFetch: {
                isFetching: false,
                fetchError: ""
            }
        }
    };
}

function loadEditTagPage(state, action) {
    return {
        ...state,
        tagUI: {
            ...state.tagUI,
            currentTag: {
                tag_id: 0,
                tag_name: "",
                tag_description: "",
                created_at: "",
                modified_at: ""
            },
            editTagFetch: {
                isFetching: false,
                fetchError: "",
                fetchType: ""
            }
        }
    };
}

function setCurrentTag(state, action) {
    let oldTag = state.tagUI.currentTag;
    return {
        ...state,
        tagUI: {
            ...state.tagUI,
            currentTag: {
                ...oldTag,
                tag_id: action.tag.tag_id !== undefined ? action.tag.tag_id : oldTag.tag_id,
                tag_name: action.tag.tag_name !== undefined ? action.tag.tag_name : oldTag.tag_name,
                tag_description: action.tag.tag_description !== undefined ? action.tag.tag_description : oldTag.tag_description,
                created_at: action.tag.created_at !== undefined ? action.tag.created_at : oldTag.created_at,
                modified_at: action.tag.modified_at !== undefined ? action.tag.modified_at : oldTag.modified_at
            }
        }
    };
}

function addTag(state, action) {
    return {
        ...state,
        tags: {
            ...state.tags,
            [action.tag.tag_id]: action.tag
        }
    };
};

function setRedirectOnRender(state, action) {
    return {
        ...state,
        tagUI: {
            ...state.tagUI,
            redirectOnRender: action.redirectOnRender
        }
    };
};

function setAddTagFetchState(state, action) {
    return {
        ...state,
        tagUI: {
            ...state.tagUI,
            addTagFetch: {
                isFetching: action.isFetching,
                fetchError: action.fetchError
            }
        }
    };
}

function setEditTagFetchState(state, action) {
    return {
        ...state,
        tagUI: {
            ...state.tagUI,
            editTagFetch: {
                isFetching: action.isFetching,
                fetchError: action.fetchError,
                fetchType: action.fetchType
            }
        }
    }
}

const root = {
    LOAD_ADD_TAG_PAGE: loadAddTagPage,
    LOAD_EDIT_TAG_PAGE: loadEditTagPage,
    SET_CURRENT_TAG: setCurrentTag,
    ADD_TAG: addTag,
    SET_REDIRECT_ON_RENDER: setRedirectOnRender,
    SET_ADD_TAG_FETCH_STATE: setAddTagFetchState,
    SET_EDIT_TAG_FETCH_STATE: setEditTagFetchState
};

export default root;