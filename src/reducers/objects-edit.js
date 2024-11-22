import { RESET_EDITED_OBJECTS, REMOVE_EDITED_OBJECTS,
    SET_EDITED_OBJECT, CLEAR_UNSAVED_CURRENT_EDITED_OBJECT, SET_EDITED_OBJECT_TAGS, RESET_EDITED_OBJECTS_TAGS, 
    PRE_SAVE_EDITED_OBJECTS_UPDATE
    } from "../actions/objects-edit";

import { TagsSelectors } from "../store/selectors/data/tags";
import { TagsTransformer } from "../store/transformers/data/tags";
import { ObjectsEditSelectors } from "../store/selectors/ui/objects-edit";

import { getStateWithResetEditedObjects, getStateWithResetEditedExistingSubobjects, getStateWithDeletedEditedNewSubobjects, 
    getStateAfterObjectPageLeave, getStateWithRemovedEditedObjects} from "./helpers/object";
import { getEditedObjectState } from "../store/types/data/edited-objects";
import { getUpdatedToDoList } from "../store/updaters/data/to-do-lists";
import { getStateWithCompositeUpdate } from "./helpers/object-composite";
import { objectAttributes } from "../store/state-templates/edited-object";


/*
    Resets state of edited objects with provided `objectIDs` to their last saved states.
    If `objectIDs` is provided, resets the object with these IDs; otherwise, resets currently edited object.
    Does not reset new subobjects (with `objectID` < 0).

    If `hideObjectResetDialog` is true, hides reset dialog on /objects/edit/:id page.

    TODO split into "reset existing object from stores" & "load new object with optional custom props"
    TODO remove unmodified existing subobjects of a reset composite (if a composite subobjects are reset, also remove their unmodified subobjects)
*/
function resetEditedObjects(state, action) {
    const { hideObjectResetDialog, resetCompositeSubobjects, allowResetToDefaults, defaultDisplayInFeed } = action;
    const objectIDs = action.objectIDs || [state.objectsEditUI.currentObjectID];
    let newState = state;

    // Remove all new subobjects of composite objects
    newState = getStateWithDeletedEditedNewSubobjects(newState, objectIDs);

    // Reset existing subobjects of composite objects
    if (resetCompositeSubobjects) newState = getStateWithResetEditedExistingSubobjects(newState, objectIDs);

    // Reset objects
    newState = getStateWithResetEditedObjects(newState, objectIDs, { allowResetToDefaults, defaultDisplayInFeed });

    // Hide object page reset dialog if required
    if (hideObjectResetDialog)
        newState = {
            ...newState,
            objectsEditUI: {
                ...state.objectsEditUI,
                showResetDialog: false  // hide reset dialog on the /object/:id page
            }
        }

    return newState;
}


/**
    Removes edited objects from the state.

    If `removeAll` flag is true, removes all edited objects.
    
    Otherwise, removes objects with provided `objectIDs`.
    Removes all new subobjects of composite objects.
    If `removeSubobjects` is true, also removes existing subobjects of composite objects.
*/
function removeEditedObjects(state, action) {
    const { objectIDs, removeSubobjects, removeAll } = action;

    // Remove all edited objects
    if (removeAll) return { ...state, editedObjects: {} };

    // Remove edited objects specified in `objectIDs` and their non-composite children
    return getStateWithRemovedEditedObjects(state, objectIDs, { deleteAllSubobjects: removeSubobjects });
}


/*
    Updates an object in state.editedObjects store with attributes/data passed in `action.object` prop.
    
    If `action.objectID` is provided, updates the object with the provided ID, otherwise updates the object with ID == state.objectsEditUI.currentObjectID.

    To-do lists can be updated with commands specified in `getUpdatedToDoList` function by passing an `action.object.toDoListItemUpdate` prop.
    Composite objects can be updated with commands specified in `action.object.compositeUpdate` prop.
*/
function setEditedObject(state, action) {
    const objectID = action.objectID !== undefined ? action.objectID : state.objectsEditUI.currentObjectID;
    const oldObject = state.editedObjects[objectID];
    if (oldObject === undefined) return state;      // don't update non-existing objects (i.e. when saving new Markdown object & redirecting to its page before it's data was parsed after last update)
    
    // Composite
    let newComposite = oldObject.composite;
    if ("compositeUpdate" in action.object) return getStateWithCompositeUpdate(state, objectID, action.object.compositeUpdate);
    else if ("composite" in action.object) {
        newComposite = { ...newComposite };
        for (let attr of Object.keys(getEditedObjectState().composite))
            if (action.object.composite[attr] !== undefined) newComposite[attr] = action.object.composite[attr];
    }

    // Links
    let newLink = oldObject.link;
    if ("link" in action.object) {
        newLink = { ...newLink };
        for (let attr of ["link", "show_description_as_link"])
            if (action.object.link[attr] !== undefined) newLink[attr] = action.object.link[attr];
    }

    // Markdown
    let newMarkdown = oldObject.markdown;
    if ("markdown" in action.object) {
        newMarkdown = { ...newMarkdown };
        for (let attr of ["raw_text", "parsed"])
            if (action.object.markdown[attr] !== undefined) newMarkdown[attr] = action.object.markdown[attr];
    }

    // To-do lists
    let newToDoList = oldObject.toDoList;
    /*if ("toDoListItemUpdate" in action.object) {              // TODO remove commented
        newToDoList = getUpdatedToDoList(oldObject.toDoList, action.object.toDoListItemUpdate);
    } else */ if ("toDoList" in action.object) {
        const aTDL = action.object.toDoList;
        
        newToDoList = {
            itemOrder: aTDL.itemOrder !== undefined ? aTDL.itemOrder : oldObject.toDoList.itemOrder,
            setFocusOnID: aTDL.setFocusOnID !== undefined ? aTDL.setFocusOnID : oldObject.toDoList.setFocusOnID,
            caretPositionOnFocus: aTDL.caretPositionOnFocus !== undefined ? aTDL.caretPositionOnFocus : oldObject.toDoList.caretPositionOnFocus,
            newItemInputIndent: aTDL.newItemInputIndent !== undefined ? aTDL.newItemInputIndent : oldObject.toDoList.newItemInputIndent,
            draggedParent: aTDL.draggedParent !== undefined ? aTDL.draggedParent : oldObject.toDoList.draggedParent,
            draggedChildren: aTDL.draggedChildren !== undefined ? aTDL.draggedChildren : oldObject.toDoList.draggedChildren,
            draggedOver: aTDL.draggedOver !== undefined ? aTDL.draggedOver : oldObject.toDoList.draggedOver,
            dropIndent: aTDL.dropIndent !== undefined ? aTDL.dropIndent : oldObject.toDoList.dropIndent,

            sort_type: aTDL.sort_type !== undefined ? aTDL.sort_type : oldObject.toDoList.sort_type,
            items: aTDL.items !== undefined ? aTDL.items : oldObject.toDoList.items
        };
    }

    const newObject = {
        ...oldObject,

        link: newLink,
        markdown: newMarkdown,
        toDoList: newToDoList,
        composite: newComposite
    };

    objectAttributes.forEach(attr => {
        if (attr in action.object) newObject[attr] = action.object[attr];
    });

    return {
        ...state,
        editedObjects: {
            ...state.editedObjects,
            [objectID]: newObject
        }
    };
}


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
    RESET_EDITED_OBJECTS: resetEditedObjects,
    REMOVE_EDITED_OBJECTS: removeEditedObjects,
    SET_EDITED_OBJECT: setEditedObject,
    CLEAR_UNSAVED_CURRENT_EDITED_OBJECT: clearUnsavedCurrentEditedObject,
    SET_EDITED_OBJECT_TAGS: setEditedObjectTags,
    RESET_EDITED_OBJECTS_TAGS: resetEditedObjectsTags,
    PRE_SAVE_EDITED_OBJECTS_UPDATE: preSaveEditedObjectsUpdate,
};

export default root;