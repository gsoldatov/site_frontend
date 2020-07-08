import { LOAD_ADD_TAG_PAGE, LOAD_EDIT_TAG_PAGE, SET_CURRENT_TAG, SET_TAG_REDIRECT_ON_RENDER, 
    SET_ADD_TAG_ON_SAVE_FETCH_STATE, SET_EDIT_TAG_ON_LOAD_FETCH_STATE, SET_EDIT_TAG_ON_SAVE_FETCH_STATE,
    SET_EDIT_TAG_ON_DELETE_FETCH_STATE, SET_SHOW_DELETE_DIALOG
    } from "../actions/tag";

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

            lastFetch: "",

            addTagOnSaveFetch: {
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
            
            lastFetch: "",

            editTagOnLoadFetch: {
                isFetching: false,
                fetchError: ""
            },

            editTagOnSaveFetch: {
                isFetching: false,
                fetchError: ""
            },

            editTagOnDeleteFetch: {
                isFetching: false,
                fetchError: ""
            },

            showDeleteDialog: false
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

function setTagRedirectOnRender(state, action) {
    return {
        ...state,
        tagUI: {
            ...state.tagUI,
            redirectOnRender: action.redirectOnRender
        }
    };
};

function setAddTagOnSaveFetchState(state, action) {
    return {
        ...state,
        tagUI: {
            ...state.tagUI,
            lastFetch: action.lastFetch === undefined ? state.tagUI.lastFetch : action.lastFetch,
            addTagOnSaveFetch: {
                isFetching: action.isFetching,
                fetchError: action.fetchError
            }
        }
    };
}

function setEditTagOnLoadFetchState(state, action) {
    return {
        ...state,
        tagUI: {
            ...state.tagUI,
            lastFetch: action.lastFetch === undefined ? state.tagUI.lastFetch : action.lastFetch,
            editTagOnLoadFetch: {
                isFetching: action.isFetching,
                fetchError: action.fetchError
            }
        }
    };
}

function setEditTagOnSaveFetchState(state, action) {
    return {
        ...state,
        tagUI: {
            ...state.tagUI,
            lastFetch: action.lastFetch === undefined ? state.tagUI.lastFetch : action.lastFetch,
            editTagOnSaveFetch: {
                isFetching: action.isFetching,
                fetchError: action.fetchError
            }
        }
    };
}

function setEditTagOnDeleteFetchState(state, action) {
    return {
        ...state,
        tagUI: {
            ...state.tagUI,
            lastFetch: action.lastFetch === undefined ? state.tagUI.lastFetch : action.lastFetch,
            editTagOnDeleteFetch: {
                isFetching: action.isFetching,
                fetchError: action.fetchError
            }
        }
    };
}

function setShowDeleteDialogTag(state, action) {
    return {
        ...state,
        tagUI: {
            ...state.tagUI,
            showDeleteDialog: action.showDeleteDialog
        }
    }
}

const root = {
    LOAD_ADD_TAG_PAGE: loadAddTagPage,
    LOAD_EDIT_TAG_PAGE: loadEditTagPage,
    SET_CURRENT_TAG: setCurrentTag,

    SET_TAG_REDIRECT_ON_RENDER: setTagRedirectOnRender,
    SET_ADD_TAG_ON_SAVE_FETCH_STATE: setAddTagOnSaveFetchState,
    SET_EDIT_TAG_ON_LOAD_FETCH_STATE: setEditTagOnLoadFetchState,
    SET_EDIT_TAG_ON_SAVE_FETCH_STATE: setEditTagOnSaveFetchState,
    SET_EDIT_TAG_ON_DELETE_FETCH_STATE: setEditTagOnDeleteFetchState,
    SET_SHOW_DELETE_DIALOG_TAG: setShowDeleteDialogTag
};

export default root;