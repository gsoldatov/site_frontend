export const SET_EDITED_OBJECT = "SET_EDITED_OBJECT";
export const CLEAR_UNSAVED_CURRENT_EDITED_OBJECT = "CLEAR_UNSAVED_CURRENT_EDITED_OBJECT";
export const SET_EDITED_OBJECT_TAGS = "SET_EDITED_OBJECT_TAGS";
export const RESET_EDITED_OBJECTS_TAGS = "RESET_EDITED_OBJECTS_TAGS";

export const PRE_SAVE_EDITED_OBJECTS_UPDATE = "PRE_SAVE_EDITED_OBJECTS_UPDATE";

/** [Reducer file](../reducers/objects-edit.js) */
export const setEditedObject                 = (object: any, objectID: any) => ({ type: SET_EDITED_OBJECT, object, objectID });
/** [Reducer file](../reducers/objects-edit.js) */
export const clearUnsavedCurrentEditedObject = ({ deleteNewObject, editedObjectID, excludedObjectID }: { deleteNewObject: any, editedObjectID: any, excludedObjectID: any }) => 
                                                ({ type: CLEAR_UNSAVED_CURRENT_EDITED_OBJECT, deleteNewObject, editedObjectID, excludedObjectID });

/** [Reducer file](../reducers/objects-edit.js) */
export const setEditedObjectTags             = (tagUpdates: any) => ({ type: SET_EDITED_OBJECT_TAGS, tagUpdates });
/** [Reducer file](../reducers/objects-edit.js) */
export const resetEditedObjectsTags          = (objectIDs: any, modified_at: any) => ({ type: RESET_EDITED_OBJECTS_TAGS, objectIDs, modified_at });


/** [Reducer file](../reducers/objects-edit.js) */
export const preSaveEditedObjectsUpdate      = () => ({ type: PRE_SAVE_EDITED_OBJECTS_UPDATE });
