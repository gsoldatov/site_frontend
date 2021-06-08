import { LOAD_ADD_OBJECT_PAGE, LOAD_EDIT_OBJECT_PAGE, RESET_EDITED_OBJECTS,
    SET_EDITED_OBJECT, SET_OBJECT_TAGS_INPUT, SET_EDITED_OBJECT_TAGS, RESET_EDITED_OBJECTS_TAGS, SET_SELECTED_TAB, 
    SET_SHOW_RESET_DIALOG_OBJECT, SET_SHOW_DELETE_DIALOG_OBJECT, SET_MARKDOWN_DISPLAY_MODE, SET_ADD_COMPOSITE_SUBOBJECT_MENU,
    SET_OBJECT_ON_LOAD_FETCH_STATE, SET_OBJECT_ON_SAVE_FETCH_STATE
    } from "../actions/object";
import { deepCopy } from "../util/copy";

import { getTagIDByName, getLowerCaseTagNameOrID } from "../store/state-util/tags";
import { getCurrentObject } from "../store/state-util/ui-object";

import { getDefaultEditedObjectState, getStateWithResetEditedObjects, getStateWithResetEditedExistingSubobjects, getStateWithDeletedEditedNewSubobjects } from "./helpers/object";
import { getUpdatedToDoList } from "./helpers/object-to-do-lists";
import { getStateWithCompositeUpdate } from "./helpers/object-composite";


function loadAddObjectPage(state, action) {
    // Add a new edited object if it's missing
    let editedObjects = state.editedObjects;
    if (editedObjects[0] === undefined) {
        editedObjects = deepCopy(editedObjects);
        editedObjects[0] = getDefaultEditedObjectState(0);
    }

    return {
        ...state,

        editedObjects,

        objectUI: {
            ...state.objectUI,

            currentObjectID: 0,
            
            tagsInput: {
                isDisplayed: false,
                inputText: "",
                matchingIDs: []
            },

            objectOnLoadFetch: {
                isFetching: false,
                fetchError: ""
            },

            objectOnSaveFetch: {
                isFetching: false,
                fetchError: ""
            },

            selectedTab: 0,
            showResetDialog: false,

            addCompositeSubobjectMenu: {
                row: -1,
                column: -1,
                inputText: "",
                matchingIDs: []
            }
        }
    };
}


function loadEditObjectPage(state, action) {
    return {
        ...state,
        objectUI: {
            ...state.objectUI,

            currentObjectID: action.currentObjectID,
            
            tagsInput: {
                isDisplayed: false,
                inputText: "",
                matchingIDs: []
            },

            objectOnLoadFetch: {
                isFetching: false,
                fetchError: ""
            },

            objectOnSaveFetch: {
                isFetching: false,
                fetchError: ""
            },

            // selectedTab: 0,  // not reset on edit object page
            showResetDialog: false,
            showDeleteDialog: false,

            addCompositeSubobjectMenu: {
                row: -1,
                column: -1,
                inputText: "",
                matchingIDs: []
            }
        }
    };
}


/*
    Resets state of edited objects with provided `objectIDs` to their last saved states.
    If `objectIDs` is provided, resets the object with these IDs; otherwise, resets currently edited object.
    Does not reset new subobjects (with `objectID` < 0).

    If `hideObjectResetDialog` is true, hides reset dialog on /objects/:id page.
*/
function resetEditedObjects(state, action) {
    const { allowResetToDefaults, hideObjectResetDialog, resetCompositeSubobjects } = action;
    const objectIDs = action.objectIDs || [state.objectUI.currentObjectID];
    let newState = state;

    // Remove all new subobjects of composite objects
    newState = getStateWithDeletedEditedNewSubobjects(newState, objectIDs);

    // Reset existing subobjects of composite objects
    if (resetCompositeSubobjects) newState = getStateWithResetEditedExistingSubobjects(newState, objectIDs);

    // Reset objects
    newState = getStateWithResetEditedObjects(newState, objectIDs, allowResetToDefaults);

    // Hide object page reset dialog if required
    if (hideObjectResetDialog)
        newState = {
            ...newState,
            objectUI: {
                ...state.objectUI,
                showResetDialog: false  // hide reset dialog on the /object/:id page
            }
        }

    return newState;
}


/*
    Updates an object in state.editedObjects store with attributes/data passed in `action.object` prop.
    
    If `action.objectID` is provided, updates the object with the provided ID, otherwise updates the object with ID == state.objectUI.currentObjectID.

    To-do lists can be updated with commands specified in `getUpdatedToDoList` function by passing an `action.object.toDoListItemUpdate` prop.
    Composite objects can be updated with commands specified in `action.object.compositeUpdate` prop.
*/
function setEditedObject(state, action) {
    const objectID = action.objectID !== undefined ? action.objectID : state.objectUI.currentObjectID;
    const oldObject = state.editedObjects[objectID];
    if (oldObject === undefined) return state;      // don't update non-existing objects (i.e. when saving new Markdown object & redirecting to its pag before it's data was parsed after last update)

    // Composite
    const aCompositeUpdate = action.object.compositeUpdate;
    if (aCompositeUpdate !== undefined) return getStateWithCompositeUpdate(state, objectID, aCompositeUpdate);

    // Links
    const link = action.object.link !== undefined ? action.object.link : oldObject.link;

    // Markdown
    const aMD = action.object.markdown;
    const markdown = aMD !== undefined ? {
        raw_text: aMD.raw_text !== undefined ? aMD.raw_text : oldObject.markdown.raw_text,
        parsed: aMD.parsed !== undefined ? aMD.parsed : oldObject.markdown.parsed
    } : oldObject.markdown;

    // To-do lists
    let toDoList;
    const aTDL = action.object.toDoList;
    const aTDLItemUpdate = action.object.toDoListItemUpdate;

    if (aTDLItemUpdate !== undefined) {
        toDoList = getUpdatedToDoList(oldObject.toDoList, aTDLItemUpdate);
    } else if (aTDL !== undefined) {
        toDoList = {
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
    } else {
        toDoList = oldObject.toDoList;
    }

    const newObject = {
        ...oldObject,
        object_id: action.object.object_id !== undefined ? action.object.object_id : oldObject.object_id,
        object_type: action.object.object_type !== undefined ? action.object.object_type : oldObject.object_type,
        object_name: action.object.object_name !== undefined ? action.object.object_name : oldObject.object_name,
        object_description: action.object.object_description !== undefined ? action.object.object_description : oldObject.object_description,
        created_at: action.object.created_at !== undefined ? action.object.created_at : oldObject.created_at,
        modified_at: action.object.modified_at !== undefined ? action.object.modified_at : oldObject.modified_at,

        link,
        markdown,
        toDoList
    };

    return {
        ...state,
        editedObjects: {
            ...state.editedObjects,
            [objectID]: newObject
        }
    };
}


function setObjectTagsInput(state, action) {
    const oldTagsInput = state.objectUI.tagsInput;
    return {
        ...state,
        objectUI: {
            ...state.objectUI,
            tagsInput: {
                isDisplayed: action.tagsInput.isDisplayed !== undefined ? action.tagsInput.isDisplayed : oldTagsInput.isDisplayed,
                inputText: action.tagsInput.inputText !== undefined ? action.tagsInput.inputText : oldTagsInput.inputText,
                matchingIDs: action.tagsInput.matchingIDs !== undefined ? action.tagsInput.matchingIDs : oldTagsInput.matchingIDs
            }
        }
    }
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
    let oldObject = getCurrentObject(state);
    let newAddedTags, newRemovedTagIDs, addedExistingTagIDs;

    if (action.tagUpdates.added instanceof Array && action.tagUpdates.added.length === 0) { // handle reset case
        newAddedTags = [];
    } else {    // handle general update case
        const lowerCaseOldAddedTags = oldObject.addedTags.map(t => getLowerCaseTagNameOrID(t));
        const at = (action.tagUpdates.added || []).map(tag => {     // replace tag names by ids if there is a match in local state
            if (typeof(tag) === "number") {
                if (lowerCaseOldAddedTags.includes(getLowerCaseTagNameOrID(state.tags[tag].tag_name))) return state.tags[tag].tag_name;    // If existing tag was added by tag_name, add it by tag name a second time
                return tag;
            }
            if (lowerCaseOldAddedTags.includes(getLowerCaseTagNameOrID(tag))) return tag;   // If existing tag was added by tag_name, add it by tag name a second time
            return getTagIDByName(state, tag) || tag;
        });
        if (at) {
            const lowerCaseAT = at.map(t => getLowerCaseTagNameOrID(t));
            newAddedTags = oldObject.addedTags.slice();
            newAddedTags = newAddedTags.filter(t => !lowerCaseAT.includes(getLowerCaseTagNameOrID(t)));
            newAddedTags = newAddedTags.concat(at.filter(t => !lowerCaseOldAddedTags.includes(getLowerCaseTagNameOrID(t))));

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
            [state.objectUI.currentObjectID]: newObject
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


function setSelectedTab(state, action) {
    return {
        ...state,
        objectUI: {
            ...state.objectUI,
            selectedTab: action.selectedTab
        }
    }
}


function setShowResetDialogObject(state, action) {
    return {
        ...state,
        objectUI: {
            ...state.objectUI,
            showResetDialog: action.showResetDialog,
            showDeleteDialog: false
        }
    };
}


function setShowDeleteDialogObject(state, action) {
    return {
        ...state,
        objectUI: {
            ...state.objectUI,
            showDeleteDialog: action.showDeleteDialog,
            showResetDialog: false
        }
    };
}


function setMarkdownDisplayMode(state, action) {
    const { markdownDisplayMode, objectID } = action;
    return {
        ...state,
        editedObjects: {
            ...state.editedObjects,
            [objectID]: {
                ...state.editedObjects[objectID],
                markdownDisplayMode
            }
        }
    };
}


function setAddCompositeSubobjectMenu(state, action) {
    const oldAddCompositeSubobjectMenu = state.objectUI.addCompositeSubobjectMenu;
    const newAddCompositeSubobjectMenu = {};
    ["row", "column", "inputText", "matchingIDs"].forEach(attr => {
        if (action.addCompositeSubobjectMenu[attr] !== undefined) newAddCompositeSubobjectMenu[attr] = action.addCompositeSubobjectMenu[attr];
    });
    return {
        ...state,
        objectUI: {
            ...state.objectUI,
            addCompositeSubobjectMenu: {
                ...oldAddCompositeSubobjectMenu,
                ...newAddCompositeSubobjectMenu
            }
        }
    };
}


function setObjectOnLoadFetchState(state, action) {
    return {
        ...state,
        objectUI: {
            ...state.objectUI,
            objectOnLoadFetch: {
                isFetching: action.isFetching,
                fetchError: action.fetchError
            }
        }
    };
}


function setObjectOnSaveFetchState(state, action) {
    return {
        ...state,
        objectUI: {
            ...state.objectUI,
            objectOnSaveFetch: {
                isFetching: action.isFetching,
                fetchError: action.fetchError
            }
        }
    };
}


const root = {
    LOAD_ADD_OBJECT_PAGE: loadAddObjectPage,
    LOAD_EDIT_OBJECT_PAGE: loadEditObjectPage,
    RESET_EDITED_OBJECTS: resetEditedObjects,
    SET_EDITED_OBJECT: setEditedObject,
    SET_OBJECT_TAGS_INPUT: setObjectTagsInput,
    SET_EDITED_OBJECT_TAGS: setEditedObjectTags,
    RESET_EDITED_OBJECTS_TAGS: resetEditedObjectsTags,
    SET_SELECTED_TAB: setSelectedTab,
    SET_SHOW_RESET_DIALOG_OBJECT: setShowResetDialogObject,
    SET_SHOW_DELETE_DIALOG_OBJECT: setShowDeleteDialogObject,
    SET_MARKDOWN_DISPLAY_MODE: setMarkdownDisplayMode,
    SET_ADD_COMPOSITE_SUBOBJECT_MENU: setAddCompositeSubobjectMenu,
    SET_OBJECT_ON_LOAD_FETCH_STATE: setObjectOnLoadFetchState,
    SET_OBJECT_ON_SAVE_FETCH_STATE: setObjectOnSaveFetchState
};

export default root;