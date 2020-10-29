import { ADD_TAGS, DELETE_TAGS, SELECT_TAGS, TOGGLE_TAG_SELECTION, DESELECT_TAGS, CLEAR_SELECTED_TAGS, SET_TAGS_PAGINATION_INFO, SET_TAGS_REDIRECT_ON_RENDER,
    SET_SHOW_DELETE_DIALOG_TAGS, SET_TAGS_FETCH } from "../actions/tags";

function addTags(state, action) {
    let newTags = {};
    action.tags.forEach(tag => newTags[tag.tag_id] = tag);
    return {
        ...state,
        tags: {
            ...state.tags,
            ...newTags
        }
    };
};

function deleteTags(state, action) {
    let tags = {...state.tags};
    for (let tagID of action.tag_ids) {
        delete tags[tagID];
    }

    return {
        ...state,
        tags: tags
    };
}

function selectTags(state, action) {
    return {
        ...state,
        tagsUI: {
            ...state.tagsUI,
            selectedTagIDs: [...(new Set(state.tagsUI.selectedTagIDs.concat(action.tag_ids)))]
        }
    }
}

function toggleTagSelection(state, action) {
    return {
        ...state,
        tagsUI: {
            ...state.tagsUI,
            selectedTagIDs: state.tagsUI.selectedTagIDs.includes(action.tag_id) 
                            ? state.tagsUI.selectedTagIDs.filter(tag_id => tag_id !== action.tag_id)
                            : state.tagsUI.selectedTagIDs.concat(action.tag_id)
        }
    };
}

function deselectTags(state, action) {
    return {
        ...state,
        tagsUI: {
            ...state.tagsUI,
            selectedTagIDs: state.tagsUI.selectedTagIDs.filter(tag_id => !action.tag_ids.includes(tag_id))
        }
    };
}

function clearSelectedTags(state, action) {
    return {
        ...state,
        tagsUI: {
            ...state.tagsUI,
            selectedTagIDs: []
        }
    };
}

function setTagsPaginationInfo(state, action) {
    let oPI = state.tagsUI.paginationInfo;
    let pI = action.paginationInfo;
    return {
        ...state,
        tagsUI: {
            ...state.tagsUI,
            paginationInfo: {
                    currentPage: pI.currentPage !== undefined ? pI.currentPage : oPI.currentPage,
                    itemsPerPage: pI.itemsPerPage !== undefined ? pI.itemsPerPage : oPI.itemsPerPage,
                    totalItems: pI.totalItems !== undefined ? pI.totalItems : oPI.totalItems,
                    sortField: pI.sortField !== undefined ? pI.sortField : oPI.sortField,
                    sortOrder: pI.sortOrder !== undefined ? pI.sortOrder : oPI.sortOrder,
                    filterText: pI.filterText !== undefined ? pI.filterText : oPI.filterText,
                    currentPageTagIDs: pI.currentPageTagIDs !== undefined ? pI.currentPageTagIDs : oPI.currentPageTagIDs
            }
        }
    }
}

function setTagsRedirectOnRender(state, action) {
    return {
        ...state,
        tagsUI: {
            ...state.tagsUI,
            redirectOnRender: action.redirectOnRender
        }
    }
}

function setShowDeleteDialogTags(state, action) {
    return {
        ...state,
        tagsUI: {
            ...state.tagsUI,
            showDeleteDialog: action.showDeleteDialog
        }
    }
}

function setTagsFetch(state, action) {
    return {
        ...state,
        tagsUI: {
            ...state.tagsUI,
            fetch: {
                isFetching: action.isFetching,
                fetchError: action.fetchError
            }
        }
    }
}

const root = {
    ADD_TAGS: addTags,
    DELETE_TAGS: deleteTags,
    SELECT_TAGS: selectTags,
    TOGGLE_TAG_SELECTION: toggleTagSelection,
    DESELECT_TAGS: deselectTags,
    CLEAR_SELECTED_TAGS: clearSelectedTags,
    SET_TAGS_PAGINATION_INFO: setTagsPaginationInfo,
    SET_TAGS_REDIRECT_ON_RENDER: setTagsRedirectOnRender,
    SET_SHOW_DELETE_DIALOG_TAGS: setShowDeleteDialogTags,
    SET_TAGS_FETCH: setTagsFetch
};

export default root;