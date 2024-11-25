import { CLEAR_UNSAVED_CURRENT_EDITED_OBJECT, SET_EDITED_OBJECT_TAGS, RESET_EDITED_OBJECTS_TAGS, 
    PRE_SAVE_EDITED_OBJECTS_UPDATE
    } from "../actions/objects-edit";

import { TagsSelectors } from "../store/selectors/data/tags";
import { TagsTransformer } from "../store/transformers/data/tags";
import { ObjectsEditSelectors } from "../store/selectors/ui/objects-edit";

import { getStateAfterObjectPageLeave} from "./helpers/object";
import { getUpdatedToDoList } from "../store/updaters/data/to-do-lists";


function clearUnsavedCurrentEditedObject(state, action) {
    const { deleteNewObject, editedObjectID, excludedObjectID } = action;
    return getStateAfterObjectPageLeave(state, { deleteNewObject, editedObjectID, excludedObjectID });
}



/*
    Updates currentTagIDs, addedTags & removedTagIDs in currentObject state.
    currentTagIDs are set to provided currentTagIDs or remain unchanged if action.tagUpdates.currentTagIDs is undefined.
    
    addedTags can be reset to an empty list (if an empty list is passed as value) or updated with a list of values. 
    In the second case, string values are replaced with corresponding tagIDs where possible. Existing values passed via action are removed from the new list.

    removedTagIDs can be reset to an empty list (if an empty list is passed as value) or updated with with a list of values.
    Existing values passed via action are removed from the new list.
*/
function setEditedObjectTags(state, action) {
    let oldObject = ObjectsEditSelectors.currentObject(state);
    let newAddedTags, newRemovedTagIDs, addedExistingTagIDs;

    if (action.tagUpdates.added instanceof Array && action.tagUpdates.added.length === 0) { // handle reset case
        newAddedTags = [];
    } else {    // handle general update case
        const lowerCaseOldAddedTags = oldObject.addedTags.map(t => TagsTransformer.getLowerCaseTagNameOrID(t));
        const at = (action.tagUpdates.added || []).map(tag => {     // replace tag names by ids if there is a match in local state
            if (typeof(tag) === "number") {
                if (lowerCaseOldAddedTags.includes(TagsTransformer.getLowerCaseTagNameOrID(state.tags[tag].tag_name))) return state.tags[tag].tag_name;    // If existing tag was added by tag_name, add it by tag name a second time
                return tag;
            }
            if (lowerCaseOldAddedTags.includes(TagsTransformer.getLowerCaseTagNameOrID(tag))) return tag;   // If existing tag was added by tag_name, add it by tag name a second time
            return TagsSelectors.getTagIDByName(state, tag) || tag;
        });
        if (at) {
            const lowerCaseAT = at.map(t => TagsTransformer.getLowerCaseTagNameOrID(t));
            newAddedTags = oldObject.addedTags.slice();
            newAddedTags = newAddedTags.filter(t => !lowerCaseAT.includes(TagsTransformer.getLowerCaseTagNameOrID(t)));
            newAddedTags = newAddedTags.concat(at.filter(t => !lowerCaseOldAddedTags.includes(TagsTransformer.getLowerCaseTagNameOrID(t))));

            addedExistingTagIDs = newAddedTags.filter(t => oldObject.currentTagIDs.includes(t));  // move added tag IDs which are already present in the current tags into removed
            newAddedTags = newAddedTags.filter(t => !addedExistingTagIDs.includes(t));
        }
    }

    if (action.tagUpdates.removed instanceof Array && action.tagUpdates.removed.length === 0) { // handle reset case
        newRemovedTagIDs = [];
    } else {    // handle general update case
        let rt = action.tagUpdates.removed;
        if (rt || addedExistingTagIDs) {
            rt = rt || [];
            addedExistingTagIDs = addedExistingTagIDs || [];
            newRemovedTagIDs = oldObject.removedTagIDs.slice();

            // stop removing tags passed for the second time or added common tags already being removed
            let removedExistingTagIDs = addedExistingTagIDs.filter(t => !newRemovedTagIDs.includes(t));
            newRemovedTagIDs = newRemovedTagIDs.filter(t => !rt.includes(t) && !addedExistingTagIDs.includes(t));
            
            // remove tags passed for the first time or added common tags, which were not being removed
            newRemovedTagIDs = newRemovedTagIDs.concat(rt.filter(t => !oldObject.removedTagIDs.includes(t)));
            newRemovedTagIDs = newRemovedTagIDs.concat(removedExistingTagIDs.filter(t => !newRemovedTagIDs.includes(t)));
        }
    }

    const newObject = {
        ...oldObject,
        currentTagIDs: action.tagUpdates.currentTagIDs ? action.tagUpdates.currentTagIDs : oldObject.currentTagIDs,
        addedTags: newAddedTags !== undefined ? newAddedTags : oldObject.addedTags,
        removedTagIDs: newRemovedTagIDs !== undefined ? newRemovedTagIDs : oldObject.removedTagIDs
    };

    return {
        ...state,
        editedObjects: {
            ...state.editedObjects,
            [state.objectsEditUI.currentObjectID]: newObject
        }
    };
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
    SET_EDITED_OBJECT_TAGS: setEditedObjectTags,
    RESET_EDITED_OBJECTS_TAGS: resetEditedObjectsTags,
    PRE_SAVE_EDITED_OBJECTS_UPDATE: preSaveEditedObjectsUpdate,
};

export default root;