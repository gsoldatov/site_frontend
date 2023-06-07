export const LOAD_ADD_TAG_PAGE = "LOAD_ADD_TAG_PAGE";
export const LOAD_EDIT_TAG_PAGE = "LOAD_EDIT_TAG_PAGE";
export const SET_CURRENT_TAG = "SET_CURRENT_TAG";
export const SET_TAG_ON_LOAD_FETCH_STATE = "SET_TAG_ON_LOAD_FETCH_STATE";
export const SET_TAG_ON_SAVE_FETCH_STATE = "SET_TAG_ON_SAVE_FETCH_STATE";
export const SET_SHOW_DELETE_DIALOG_TAG = "SET_SHOW_DELETE_DIALOG_TAG";


/** [Reducer file](../reducers/tags-edit.js) */
export const loadNewTagPage      = () => ({ type: LOAD_ADD_TAG_PAGE });
/** [Reducer file](../reducers/tags-edit.js) */
export const loadEditTagPage     = () => ({ type: LOAD_EDIT_TAG_PAGE });
/** [Reducer file](../reducers/tags-edit.js) */
export const setCurrentTag       = (tag) => ({ type: SET_CURRENT_TAG, tag: tag });
/** [Reducer file](../reducers/tags-edit.js) */
export const setShowDeleteDialogTag = (showDeleteDialog = false) => ({ type: SET_SHOW_DELETE_DIALOG_TAG, showDeleteDialog: showDeleteDialog });

/** [Reducer file](../reducers/tags-edit.js) */
export const setTagOnLoadFetchState = (isFetching = false, fetchError = "") => {
    return {
        type: SET_TAG_ON_LOAD_FETCH_STATE,
        isFetching: isFetching,
        fetchError: fetchError
    };
};

/** [Reducer file](../reducers/tags-edit.js) */
export const setTagOnSaveFetchState = (isFetching = false, fetchError = "") => {
    return {
        type: SET_TAG_ON_SAVE_FETCH_STATE,
        isFetching: isFetching,
        fetchError: fetchError
    };
};
