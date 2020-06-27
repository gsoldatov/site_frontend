import { ADD_TAGS, DELETE_TAGS, TOGGLE_TAG_SELECTION, SET_TAGS_PAGINATION_INFO, SET_TAGS_PAGINATION_FETCH, SET_TAGS_REDIRECT_ON_RENDER } from "../actions/tags";
import { getTagsPaginationCacheKey } from "../store/state-util";

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

function setTagsPaginationFetch(state, action) {
    return {
        ...state,
        tagsUI: {
            ...state.tagsUI,
            paginationFetch: {
                isFetching: action.isFetching,
                fetchError: action.fetchError
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

const root = {
    ADD_TAGS: addTags,
    DELETE_TAGS: deleteTags,
    TOGGLE_TAG_SELECTION: toggleTagSelection,
    SET_TAGS_PAGINATION_INFO: setTagsPaginationInfo,
    SET_TAGS_PAGINATION_FETCH: setTagsPaginationFetch,
    SET_TAGS_REDIRECT_ON_RENDER: setTagsRedirectOnRender
};

export default root;