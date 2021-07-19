export const LOAD_ADD_OBJECT_PAGE = "LOAD_ADD_OBJECT_PAGE";
export const LOAD_EDIT_OBJECT_PAGE = "LOAD_EDIT_OBJECT_PAGE";
export const RESET_EDITED_OBJECTS = "RESET_EDITED_OBJECTS";
export const SET_EDITED_OBJECT = "SET_EDITED_OBJECT";
export const CLEAR_UNSAVED_CURRENT_EDITED_OBJECT = "CLEAR_UNSAVED_CURRENT_EDITED_OBJECT";
export const SET_OBJECT_TAGS_INPUT = "SET_OBJECT_TAGS_INPUT";
export const SET_EDITED_OBJECT_TAGS = "SET_EDITED_OBJECT_TAGS";
export const RESET_EDITED_OBJECTS_TAGS = "RESET_EDITED_OBJECTS_TAGS";
export const SET_SELECTED_TAB = "SET_SELECTED_TAB";
export const SET_SHOW_RESET_DIALOG_OBJECT = "SET_SHOW_RESET_DIALOG_OBJECT";
export const SET_SHOW_DELETE_DIALOG_OBJECT = "SET_SHOW_DELETE_DIALOG_OBJECT";
export const SET_MARKDOWN_DISPLAY_MODE = "SET_MARKDOWN_DISPLAY_MODE";
export const SET_ADD_COMPOSITE_SUBOBJECT_MENU = "SET_ADD_COMPOSITE_SUBOBJECT_MENU";
export const SET_OBJECT_ON_LOAD_FETCH_STATE = "SET_OBJECT_ON_LOAD_FETCH_STATE";
export const SET_OBJECT_ON_SAVE_FETCH_STATE = "SET_OBJECT_ON_SAVE_FETCH_STATE";

export const loadAddObjectPage               = () => ({ type: LOAD_ADD_OBJECT_PAGE });
export const loadEditObjectPage              = currentObjectID => ({ type: LOAD_EDIT_OBJECT_PAGE, currentObjectID });
export const resetEditedObjects              = ({ objectIDs, hideObjectResetDialog, allowResetToDefaults, resetCompositeSubobjects }) => ({ 
                                                type: RESET_EDITED_OBJECTS, objectIDs, hideObjectResetDialog, allowResetToDefaults, resetCompositeSubobjects });
export const setEditedObject                 = (object, objectID) => ({ type: SET_EDITED_OBJECT, object, objectID });
export const clearUnsavedCurrentEditedObject = (deleteNewObject) => ({ type: CLEAR_UNSAVED_CURRENT_EDITED_OBJECT, deleteNewObject });
export const setObjectTagsInput              = inputState => ({ type: SET_OBJECT_TAGS_INPUT, tagsInput: inputState });
export const setEditedObjectTags             = tagUpdates => ({ type: SET_EDITED_OBJECT_TAGS, tagUpdates });
export const resetEditedObjectsTags          = (objectIDs, modified_at) => ({ type: RESET_EDITED_OBJECTS_TAGS, objectIDs, modified_at });
export const setSelectedTab                  = selectedTab => ({ type: SET_SELECTED_TAB, selectedTab });
export const setShowResetDialogObject        = (showResetDialog = false) => ({ type: SET_SHOW_RESET_DIALOG_OBJECT, showResetDialog });
export const setShowDeleteDialogObject       = (showDeleteDialog = false) => ({ type: SET_SHOW_DELETE_DIALOG_OBJECT, showDeleteDialog });
export const setMarkdownDisplayMode          = ({ objectID, markdownDisplayMode }) => ({ type: SET_MARKDOWN_DISPLAY_MODE, objectID, markdownDisplayMode });
export const setAddCompositeSubobjectMenu    = addCompositeSubobjectMenu => ({ type: SET_ADD_COMPOSITE_SUBOBJECT_MENU, addCompositeSubobjectMenu });

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
