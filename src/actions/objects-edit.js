export const LOAD_ADD_OBJECT_PAGE = "LOAD_ADD_OBJECT_PAGE";
export const LOAD_EDIT_OBJECT_PAGE = "LOAD_EDIT_OBJECT_PAGE";
export const RESET_EDITED_OBJECTS = "RESET_EDITED_OBJECTS";
export const REMOVE_EDITED_OBJECTS = "REMOVE_EDITED_OBJECTS";
export const SET_EDITED_OBJECT = "SET_EDITED_OBJECT";
export const CLEAR_UNSAVED_CURRENT_EDITED_OBJECT = "CLEAR_UNSAVED_CURRENT_EDITED_OBJECT";
export const SET_OBJECT_TAGS_INPUT = "SET_OBJECT_TAGS_INPUT";
export const SET_EDITED_OBJECT_TAGS = "SET_EDITED_OBJECT_TAGS";
export const RESET_EDITED_OBJECTS_TAGS = "RESET_EDITED_OBJECTS_TAGS";
export const SET_SELECTED_TAB = "SET_SELECTED_TAB";
export const SET_SHOW_RESET_DIALOG_OBJECT = "SET_SHOW_RESET_DIALOG_OBJECT";
export const SET_SHOW_DELETE_DIALOG_OBJECT = "SET_SHOW_DELETE_DIALOG_OBJECT";
export const SET_ADD_COMPOSITE_SUBOBJECT_MENU = "SET_ADD_COMPOSITE_SUBOBJECT_MENU";
export const SET_OBJECT_ON_LOAD_FETCH_STATE = "SET_OBJECT_ON_LOAD_FETCH_STATE";
export const SET_OBJECT_ON_SAVE_FETCH_STATE = "SET_OBJECT_ON_SAVE_FETCH_STATE";


/** [Reducer file](../reducers/objects-edit.js) */
export const loadNewObjectPage               = () => ({ type: LOAD_ADD_OBJECT_PAGE });
/** [Reducer file](../reducers/objects-edit.js) */
export const loadEditObjectPage              = currentObjectID => ({ type: LOAD_EDIT_OBJECT_PAGE, currentObjectID });
/** [Reducer file](../reducers/objects-edit.js) */
export const resetEditedObjects              = ({ objectIDs, hideObjectResetDialog, resetCompositeSubobjects, allowResetToDefaults, defaultDisplayInFeed }) => ({ 
                                                type: RESET_EDITED_OBJECTS, objectIDs, hideObjectResetDialog, resetCompositeSubobjects, allowResetToDefaults, defaultDisplayInFeed });
/** [Reducer file](../reducers/objects-edit.js) */
export const removeEditedObjects             = ({ objectIDs, removeSubobjects, removeAll }) => ({ type: REMOVE_EDITED_OBJECTS, objectIDs, removeSubobjects, removeAll });
/** [Reducer file](../reducers/objects-edit.js) */
export const setEditedObject                 = (object, objectID) => ({ type: SET_EDITED_OBJECT, object, objectID });
/** [Reducer file](../reducers/objects-edit.js) */
export const clearUnsavedCurrentEditedObject = ({ deleteNewObject, editedObjectID, excludedObjectID }) => ({ type: CLEAR_UNSAVED_CURRENT_EDITED_OBJECT, deleteNewObject, editedObjectID, excludedObjectID });
/** [Reducer file](../reducers/objects-edit.js) */
export const setObjectTagsInput              = inputState => ({ type: SET_OBJECT_TAGS_INPUT, tagsInput: inputState });
/** [Reducer file](../reducers/objects-edit.js) */
export const setEditedObjectTags             = tagUpdates => ({ type: SET_EDITED_OBJECT_TAGS, tagUpdates });
/** [Reducer file](../reducers/objects-edit.js) */
export const resetEditedObjectsTags          = (objectIDs, modified_at) => ({ type: RESET_EDITED_OBJECTS_TAGS, objectIDs, modified_at });
/** [Reducer file](../reducers/objects-edit.js) */
export const setSelectedTab                  = selectedTab => ({ type: SET_SELECTED_TAB, selectedTab });
/** [Reducer file](../reducers/objects-edit.js) */
export const setShowResetDialogObject        = (showResetDialog = false) => ({ type: SET_SHOW_RESET_DIALOG_OBJECT, showResetDialog });
/** [Reducer file](../reducers/objects-edit.js) */
export const setShowDeleteDialogObject       = (showDeleteDialog = false) => ({ type: SET_SHOW_DELETE_DIALOG_OBJECT, showDeleteDialog });
/** [Reducer file](../reducers/objects-edit.js) */
export const setAddCompositeSubobjectMenu    = addCompositeSubobjectMenu => ({ type: SET_ADD_COMPOSITE_SUBOBJECT_MENU, addCompositeSubobjectMenu });

/** [Reducer file](../reducers/objects-edit.js) */
export const setObjectOnLoadFetchState = (isFetching = false, fetchError = "") => {
    return {
        type: SET_OBJECT_ON_LOAD_FETCH_STATE,
        isFetching: isFetching,
        fetchError: fetchError
    };
};

/** [Reducer file](../reducers/objects-edit.js) */
export const setObjectOnSaveFetchState = (isFetching = false, fetchError = "") => {
    return {
        type: SET_OBJECT_ON_SAVE_FETCH_STATE,
        isFetching: isFetching,
        fetchError: fetchError
    };
};
