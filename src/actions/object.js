export const LOAD_ADD_OBJECT_PAGE = "LOAD_ADD_OBJECT_PAGE";
export const LOAD_EDIT_OBJECT_PAGE = "LOAD_EDIT_OBJECT_PAGE";
export const SET_CURRENT_OBJECT = "SET_CURRENT_OBJECT";
export const SET_OBJECT_TAGS_INPUT = "SET_OBJECT_TAGS_INPUT";
export const SET_CURRENT_OBJECT_TAGS = "SET_CURRENT_OBJECT_TAGS";
export const SET_SHOW_DELETE_DIALOG_OBJECT = "SET_SHOW_DELETE_DIALOG_OBJECT";
export const SET_MARKDOWN_DISPLAY_MODE = "SET_MARKDOWN_DISPLAY_MODE";
export const SET_OBJECT_ON_LOAD_FETCH_STATE = "SET_OBJECT_ON_LOAD_FETCH_STATE";
export const SET_OBJECT_ON_SAVE_FETCH_STATE = "SET_OBJECT_ON_SAVE_FETCH_STATE";

export const loadAddObjectPage         = (forceReset = false) => ({ type: LOAD_ADD_OBJECT_PAGE, forceReset: forceReset });
export const loadEditObjectPage        = () => ({ type: LOAD_EDIT_OBJECT_PAGE });
export const setCurrentObject          = object => ({ type: SET_CURRENT_OBJECT, object: object });
export const setObjectTagsInput        = inputState => ({ type: SET_OBJECT_TAGS_INPUT, tagsInput: inputState });
export const setCurrentObjectTags      = tagUpdates => ({ type: SET_CURRENT_OBJECT_TAGS, tagUpdates: tagUpdates });
export const setShowDeleteDialogObject = (showDeleteDialog = false) => ({ type: SET_SHOW_DELETE_DIALOG_OBJECT, showDeleteDialog: showDeleteDialog });
export const setMarkdownDisplayMode    = markdownDisplayMode => ({ type: SET_MARKDOWN_DISPLAY_MODE, markdownDisplayMode: markdownDisplayMode });

export const setObjectOnLoadFetchState = (isFetching = false, fetchError = "") => {
    return {
        type: SET_OBJECT_ON_LOAD_FETCH_STATE,
        isFetching: isFetching,
        fetchError: fetchError
    };
};

export const setObjectOnSaveFetchState = (isFetching = false, fetchError = "") => {
    return {
        type: SET_OBJECT_ON_SAVE_FETCH_STATE,
        isFetching: isFetching,
        fetchError: fetchError
    };
};
