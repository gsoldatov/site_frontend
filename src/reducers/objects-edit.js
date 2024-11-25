import { CLEAR_UNSAVED_CURRENT_EDITED_OBJECT, RESET_EDITED_OBJECTS_TAGS, 
    PRE_SAVE_EDITED_OBJECTS_UPDATE
    } from "../actions/objects-edit";

import { getStateAfterObjectPageLeave} from "./helpers/object";
import { getUpdatedToDoList } from "../store/updaters/data/to-do-lists";


function clearUnsavedCurrentEditedObject(state, action) {
    const { deleteNewObject, editedObjectID, excludedObjectID } = action;
    return getStateAfterObjectPageLeave(state, { deleteNewObject, editedObjectID, excludedObjectID });
}


// Resets objects' tags and `modified_at` for all object from `action.objectIDs` present in state.editedObjects.
// Sets `currentTagIDs` to the last saved values and `addedTags` & `removedTagIDs`.
// `modified_at` is set to `action.modified_at` for all objects, if it's passed.
function resetEditedObjectsTags(state, action) {
    const objectIDs = (action.objectIDs || []).filter(id => state.editedObjects[id] !== undefined);
    if (objectIDs.length === 0) return state;

    const newEditedObjects = {...state.editedObjects};
    objectIDs.forEach(objectID => {
        // Don't reset if object is not present in state.objectsTags
        if (state.objectsTags[objectID] === undefined) return;

        const newEditedObject = {
            ...state.editedObjects[objectID],
            modified_at: action.modified_at ? action.modified_at : state.editedObjects[objectID].modified_at,
            currentTagIDs: state.objectsTags[objectID].slice(),
            addedTags: [],
            removedTagIDs: []
        };
        newEditedObjects[objectID] = newEditedObject;
    });

    return { ...state, editedObjects: newEditedObjects };
}


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
    CLEAR_UNSAVED_CURRENT_EDITED_OBJECT: clearUnsavedCurrentEditedObject,
    RESET_EDITED_OBJECTS_TAGS: resetEditedObjectsTags,
    PRE_SAVE_EDITED_OBJECTS_UPDATE: preSaveEditedObjectsUpdate,
};

export default root;