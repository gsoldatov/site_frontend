export const CLEAR_UNSAVED_CURRENT_EDITED_OBJECT = "CLEAR_UNSAVED_CURRENT_EDITED_OBJECT";

export const PRE_SAVE_EDITED_OBJECTS_UPDATE = "PRE_SAVE_EDITED_OBJECTS_UPDATE";

/** [Reducer file](../reducers/objects-edit.js) */
export const clearUnsavedCurrentEditedObject = ({ deleteNewObject, editedObjectID, excludedObjectID }: { deleteNewObject: any, editedObjectID: any, excludedObjectID: any }) => 
                                                ({ type: CLEAR_UNSAVED_CURRENT_EDITED_OBJECT, deleteNewObject, editedObjectID, excludedObjectID });

/** [Reducer file](../reducers/objects-edit.js) */
export const preSaveEditedObjectsUpdate      = () => ({ type: PRE_SAVE_EDITED_OBJECTS_UPDATE });
