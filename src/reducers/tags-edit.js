import { LOAD_ADD_TAG_PAGE, LOAD_EDIT_TAG_PAGE, SET_CURRENT_TAG, 
    SET_TAG_ON_LOAD_FETCH_STATE, SET_TAG_ON_SAVE_FETCH_STATE, SET_SHOW_DELETE_DIALOG } from "../actions/tags-edit";
import { getDefaultCurrentTagState, tagAttributes } from "../store/state-templates/tags";


function loadNewTagPage(state, action) {
    return {
        ...state,
        tagUI: {
            ...state.tagUI,
            currentTag: getDefaultCurrentTagState(),

            tagOnLoadFetch: {
                isFetching: false,
                fetchError: ""
            },

            tagOnSaveFetch: {
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
            currentTag: getDefaultCurrentTagState(),

            tagOnLoadFetch: {
                isFetching: false,
                fetchError: ""
            },

            tagOnSaveFetch: {
                isFetching: false,
                fetchError: ""
            },

            showDeleteDialog: false
        }
    };
}

function setCurrentTag(state, action) {
    let newCurrentTag = { ...state.tagUI.currentTag };
    tagAttributes.forEach(attr => { 
        if (attr in action.tag) newCurrentTag[attr] = action.tag[attr];
    });

    return {
        ...state,
        tagUI: {
            ...state.tagUI,
            currentTag: newCurrentTag
        }
    };
}

function setTagOnLoadFetchState(state, action) {
    return {
        ...state,
        tagUI: {
            ...state.tagUI,
            tagOnLoadFetch: {
                isFetching: action.isFetching,
                fetchError: action.fetchError
            }
        }
    };
}

function setTagOnSaveFetchState(state, action) {
    return {
        ...state,
        tagUI: {
            ...state.tagUI,
            tagOnSaveFetch: {
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
    LOAD_ADD_TAG_PAGE: loadNewTagPage,
    LOAD_EDIT_TAG_PAGE: loadEditTagPage,
    SET_CURRENT_TAG: setCurrentTag,
    SET_TAG_ON_LOAD_FETCH_STATE: setTagOnLoadFetchState,
    SET_TAG_ON_SAVE_FETCH_STATE: setTagOnSaveFetchState,
    SET_SHOW_DELETE_DIALOG_TAG: setShowDeleteDialogTag
};

export default root;