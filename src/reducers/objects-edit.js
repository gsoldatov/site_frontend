import { PRE_SAVE_EDITED_OBJECTS_UPDATE } from "../actions/objects-edit";

import { getUpdatedToDoList } from "../store/updaters/data/to-do-lists";


/**
 * Applies required updates to edited objects before they are saved:
 * - normalizes item ID numeration in to-do lists, so that it matches the numeration in the saved version of the object;
 * - triggers to-do list rerender to update item IDs;
 */
const preSaveEditedObjectsUpdate = (state, action) => {
    let newState = state;

    // Get object IDs of to-do lists, which are being saved
    const objectID = newState.objectsEditUI.currentObjectID;
    const currentObjectType = newState.editedObjects[objectID].object_type;
    let toDoListObjectIDs = currentObjectType === "to_do_list" ? [objectID]
        : currentObjectType === "composite" ? 
            [...Object.keys(newState.editedObjects[objectID].composite.subobjects)].filter(
                subobjectID => newState.editedObjects[subobjectID].object_type === "to_do_list")
        : [];
    
    // Normalize itemIDs in to-do lists
    if (toDoListObjectIDs.length > 0) {
        const newEditedObjects = toDoListObjectIDs.reduce((result, objectID) => {
            const editedObject = newState.editedObjects[objectID];
            const toDoList = getUpdatedToDoList(editedObject.toDoList, { command: "normalizeItemIDs" });
            result[objectID] = { ...editedObject, toDoList };
            return result;
        }, {});
        newState = { ...newState, editedObjects: { ...newState.editedObjects, ...newEditedObjects }};
    }
    
    return newState;
};


const root = {
    PRE_SAVE_EDITED_OBJECTS_UPDATE: preSaveEditedObjectsUpdate,
};

export default root;