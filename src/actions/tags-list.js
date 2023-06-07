export const SELECT_TAGS = "SELECT_TAGS";
export const TOGGLE_TAG_SELECTION = "TOGGLE_TAG_SELECTION";
export const DESELECT_TAGS = "DESELECT_TAGS";
export const CLEAR_SELECTED_TAGS = "CLEAR_SELECTED_TAGS";
export const SET_TAGS_PAGINATION_INFO = "SET_TAGS_PAGINATION_INFO";
export const SET_SHOW_DELETE_DIALOG_TAGS = "SET_SHOW_DELETE_DIALOG_TAGS";
export const SET_TAGS_FETCH = "SET_TAGS_FETCH";


/** [Reducer file](../reducers/tags-list.js) */
export const selectTags              = tag_ids => ({ type: SELECT_TAGS, tag_ids: tag_ids });
/** [Reducer file](../reducers/tags-list.js) */
export const toggleTagSelection      = tag_id => ({ type: TOGGLE_TAG_SELECTION, tag_id: tag_id });
/** [Reducer file](../reducers/tags-list.js) */
export const deselectTags            = tag_ids => ({ type: DESELECT_TAGS, tag_ids: tag_ids });
/** [Reducer file](../reducers/tags-list.js) */
export const clearSelectedTags       = () => ({ type: CLEAR_SELECTED_TAGS });
/** [Reducer file](../reducers/tags-list.js) */
export const setTagsPaginationInfo   = paginationInfo => ({ type: SET_TAGS_PAGINATION_INFO, paginationInfo: paginationInfo });
/** [Reducer file](../reducers/tags-list.js) */
export const setShowDeleteDialogTags = (showDeleteDialog = false) => ({ type: SET_SHOW_DELETE_DIALOG_TAGS, showDeleteDialog: showDeleteDialog });

/** [Reducer file](../reducers/tags-list.js) */
export const setTagsFetch = (isFetching = false, fetchError = "") => { 
    return {
        type: SET_TAGS_FETCH, 
        isFetching: isFetching, 
        fetchError: fetchError
    };
};
