export const RESET_EDITED_OBJECTS = "RESET_EDITED_OBJECTS";
export const REMOVE_EDITED_OBJECTS = "REMOVE_EDITED_OBJECTS";
export const SET_EDITED_OBJECT = "SET_EDITED_OBJECT";
export const CLEAR_UNSAVED_CURRENT_EDITED_OBJECT = "CLEAR_UNSAVED_CURRENT_EDITED_OBJECT";
export const SET_OBJECTS_EDIT_TAGS_INPUT = "SET_OBJECTS_EDIT_TAGS_INPUT";
export const SET_EDITED_OBJECT_TAGS = "SET_EDITED_OBJECT_TAGS";
export const RESET_EDITED_OBJECTS_TAGS = "RESET_EDITED_OBJECTS_TAGS";
export const SET_OBJECTS_EDIT_SELECT_TAB = "SET_OBJECTS_EDIT_SELECT_TAB";
export const SET_OBJECTS_EDIT_SHOW_RESET_DIALOG = "SET_OBJECTS_EDIT_SHOW_RESET_DIALOG";
export const SET_OBJECTS_EDIT_SHOW_DELETE_DIALOG = "SET_OBJECTS_EDIT_SHOW_DELETE_DIALOG";
export const SET_TO_DO_LIST_RERENDER_PENDING = "SET_TO_DO_LIST_RERENDER_PENDING";
export const SET_ADD_COMPOSITE_SUBOBJECT_MENU = "SET_ADD_COMPOSITE_SUBOBJECT_MENU";
export const PRE_SAVE_EDITED_OBJECTS_UPDATE = "PRE_SAVE_EDITED_OBJECTS_UPDATE";
export const SET_OBJECTS_EDIT_LOAD_FETCH_STATE = "SET_OBJECTS_EDIT_LOAD_FETCH_STATE";
export const SET_OBJECTS_EDIT_SAVE_FETCH_STATE = "SET_OBJECTS_EDIT_SAVE_FETCH_STATE";


/** [Reducer file](../reducers/objects-edit.js) */
export const resetEditedObjects              = ({ objectIDs, hideObjectResetDialog, resetCompositeSubobjects, allowResetToDefaults, defaultDisplayInFeed }: 
                                                { objectIDs: number[], hideObjectResetDialog?: boolean, resetCompositeSubobjects?: boolean, 
                                                  allowResetToDefaults?: boolean, defaultDisplayInFeed?: boolean }) => 
                                                    ({ type: RESET_EDITED_OBJECTS, objectIDs, hideObjectResetDialog, resetCompositeSubobjects, 
                                                        allowResetToDefaults, defaultDisplayInFeed });
/** [Reducer file](../reducers/objects-edit.js) */
export const removeEditedObjects             = ({ objectIDs, removeSubobjects, removeAll }: { objectIDs: any, removeSubobjects: any, removeAll: any }) => 
                                                ({ type: REMOVE_EDITED_OBJECTS, objectIDs, removeSubobjects, removeAll });
/** [Reducer file](../reducers/objects-edit.js) */
export const setEditedObject                 = (object: any, objectID: any) => ({ type: SET_EDITED_OBJECT, object, objectID });
/** [Reducer file](../reducers/objects-edit.js) */
export const clearUnsavedCurrentEditedObject = ({ deleteNewObject, editedObjectID, excludedObjectID }: { deleteNewObject: any, editedObjectID: any, excludedObjectID: any }) => 
                                                ({ type: CLEAR_UNSAVED_CURRENT_EDITED_OBJECT, deleteNewObject, editedObjectID, excludedObjectID });
/** [Reducer file](../reducers/objects-edit.js) */
export const setObjectsEditTagsInput              = (inputState: any) => ({ type: SET_OBJECTS_EDIT_TAGS_INPUT, tagsInput: inputState });
/** [Reducer file](../reducers/objects-edit.js) */
export const setEditedObjectTags             = (tagUpdates: any) => ({ type: SET_EDITED_OBJECT_TAGS, tagUpdates });
/** [Reducer file](../reducers/objects-edit.js) */
export const resetEditedObjectsTags          = (objectIDs: any, modified_at: any) => ({ type: RESET_EDITED_OBJECTS_TAGS, objectIDs, modified_at });
/** [Reducer file](../reducers/objects-edit.js) */
export const setObjectsEditSelectedTab                  = (selectedTab: number) => ({ type: SET_OBJECTS_EDIT_SELECT_TAB, selectedTab });
/** [Reducer file](../reducers/objects-edit.js) */
export const setObjectsEditShowResetDialog        = (showResetDialog: boolean = false) => ({ type: SET_OBJECTS_EDIT_SHOW_RESET_DIALOG, showResetDialog });
/** [Reducer file](../reducers/objects-edit.js) */
export const setObjectsEditShowDeleteDialog       = (showDeleteDialog: boolean = false) => ({ type: SET_OBJECTS_EDIT_SHOW_DELETE_DIALOG, showDeleteDialog });
/** [Reducer file](../reducers/objects-edit.js) */
export const setToDoListRerenderPending      = (toDoListRerenderPending: boolean = false) => ({ type: SET_TO_DO_LIST_RERENDER_PENDING, toDoListRerenderPending });
/** [Reducer file](../reducers/objects-edit.js) */
export const setAddCompositeSubobjectMenu    = (addCompositeSubobjectMenu: any) => ({ type: SET_ADD_COMPOSITE_SUBOBJECT_MENU, addCompositeSubobjectMenu });

/** [Reducer file](../reducers/objects-edit.js) */
export const preSaveEditedObjectsUpdate      = () => ({ type: PRE_SAVE_EDITED_OBJECTS_UPDATE });

/** [Reducer file](../reducers/objects-edit.js) */
export const setObjectsEditLoadFetchState = (isFetching: boolean = false, fetchError: string = "") => {
    return {
        type: SET_OBJECTS_EDIT_LOAD_FETCH_STATE,
        isFetching: isFetching,
        fetchError: fetchError
    };
};

/** [Reducer file](../reducers/objects-edit.js) */
export const setObjectsEditSaveFetchState = (isFetching: boolean = false, fetchError: string = "") => {
    return {
        type: SET_OBJECTS_EDIT_SAVE_FETCH_STATE,
        isFetching: isFetching,
        fetchError: fetchError
    };
};
