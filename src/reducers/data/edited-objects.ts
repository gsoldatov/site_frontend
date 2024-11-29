import { EditedObjectsSelectors } from "../../store/selectors/data/objects/edited-objects";
import { EditedObjectsUpdaters, type EditedObjectUpdate } from "../../store/updaters/data/edited-objects";
import { TagsSelectors } from "../../store/selectors/data/tags";
import { TagsTransformer } from "../../store/transformers/data/tags";

import { getUpdatedToDoList, type ToDoListUpdateParams } from "../../store/updaters/data/to-do-lists";
import { EditedCompositeUpdaters, type GetUpdatedEditedCompositeParams } from "../../store/updaters/data/edited-composite";

import type { State } from "../../store/types/state";
import { type EditedObjects, type EditedObject } from "../../store/types/data/edited-objects";


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**
 * Adds a list of `editedObjects` into state.editedObjects.
 * Overwrites existing objects.
 */
export const addEditedObjects = (editedObjects: EditedObject[]) => ({ type: "ADD_EDITED_OBJECTS", editedObjects });

const _addEditedObjects = (state: State, action: { editedObjects: EditedObject[] }): State => {
    return EditedObjectsUpdaters.addEditedObjects(state, action.editedObjects);
};


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/** 
 * Loads new or existing objects with `objectIDs` into state.editedObjects.
 * 
 * Existing objects are loaded from store, new objects are set to default values with optional overrides passed via `customValues`.
 * 
 * Deletes any present new composite subobjects of `objectIDs` from state.editedObjects.
 */
export const loadEditedObjects = (objectIDs: number[], customValues: Partial<EditedObject> = {}) => ({ type: "LOAD_EDITED_OBJECTS", objectIDs, customValues });

const _loadEditedObjects = (state: State, action: { objectIDs: number[], customValues: Partial<EditedObject> }): State => {
    return EditedObjectsUpdaters.loadEditedObjects(state, action.objectIDs, action.customValues);
};


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/** 
 * Loads tags of `objectIDs` into state.editedObjects and clears tag updates in corresponding edited objects. 
 * 
 * Updates `modified_at` of edited objects with the provided value.
 * 
 * Ignores objects, which are not present in state.editedObjects.
 */
export const loadEditedObjectsTags = (objectIDs: number[], modified_at: string) => ({ type: "LOAD_EDITED_OBJECTS_TAGS", objectIDs, modified_at });

const _loadEditedObjectsTags = (state: State, action: {objectIDs: number[], modified_at: string }): State => {
    const { objectIDs, modified_at } = action;
    const editedObjects = objectIDs.reduce((result, objectID) => {
        const editedObject = state.editedObjects[objectID];
        if (editedObject !== undefined) {
            result[objectID] = { ...editedObject, currentTagIDs: state.objectsTags[objectID], modified_at, addedTags: [], removedTagIDs: [] };
        }
        return result;
    }, {} as EditedObjects);

    return { ...state, editedObjects: { ...state.editedObjects, ...editedObjects }};
};


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/** 
 * Performs partial update of an edited object `objectID` with values from `update`.
 * `update` can contain partial top-level attributes of an edited object or partial top-level of data attributes.
 */
export const updateEditedObject = (objectID: number, update: EditedObjectUpdate) => ({ type: "UPDATE_EDITED_OBJECT", objectID, update });

const _updateEditedObject = (state: State, action: { objectID: number, update: EditedObjectUpdate }): State => {
    const { objectID, update } = action;
    return EditedObjectsUpdaters.updateEditedObjects(state, [{ objectID, update }]);
};


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
export const updateEditedObjectTags = (objectID: number, updates: { added?: (string | number)[], removed?: number[] }) =>
    ({ type: "UPDATE_EDITED_OBJECT_TAGS", objectID, addedTags: updates.added || [], removedTagIDs: updates.removed || [] });

const _updateEditedObjectTags = (state: State, action: {objectID: number, addedTags: (string | number)[], removedTagIDs: number[] }): State => {
    const { objectID } = action;
    const editedObject = state.editedObjects[objectID];
    if (editedObject === undefined) throw Error(`Attempted to set tag updates for a missing edited object '${objectID}'.`);

    const lowerCaseOldAddedTags = editedObject.addedTags.map(t => TagsTransformer.getLowerCaseTagNameOrID(t));
    
    // Map added tags to their ID or names, where appropriate
    const mappedAddedTags = action.addedTags.map(tag => {
        if (typeof(tag) === "number") {
            // If a tag added by ID is already added by name, add it by name again
            if (lowerCaseOldAddedTags.includes(state.tags[tag].tag_name.toLowerCase())) return state.tags[tag].tag_name;
            return tag;
        }

        // If a tag added by name is already added by name, add it by name again
        if (lowerCaseOldAddedTags.includes(tag.toLowerCase())) return tag;

        // Add a tag for the first time by its ID or name
        return TagsSelectors.getTagIDByName(state, tag) || tag;
    });

    // Get a new addedTags list
    const lowerCaseMappedAddedTags = mappedAddedTags.map(t => TagsTransformer.getLowerCaseTagNameOrID(t));
    let addedTags = editedObject.addedTags.slice();
    addedTags = addedTags.filter(t => !lowerCaseMappedAddedTags.includes(TagsTransformer.getLowerCaseTagNameOrID(t)));
    addedTags = addedTags.concat(mappedAddedTags.filter(t => !lowerCaseOldAddedTags.includes(TagsTransformer.getLowerCaseTagNameOrID(t))));

    // Move added tag IDs which are already present in the current tags into removed
    const addedExistingTagIDs = addedTags.filter(t => editedObject.currentTagIDs.includes(t as number));
    addedTags = addedTags.filter(t => !addedExistingTagIDs.includes(t));

    // Stop removing tags passed for the second time or added common tags already being removed
    let removedTagIDs = editedObject.removedTagIDs.slice();
    let removedExistingTagIDs = (addedExistingTagIDs as number[]).filter(t => !removedTagIDs.includes(t as number));
    removedTagIDs = removedTagIDs.filter(t => !action.removedTagIDs.includes(t) && !addedExistingTagIDs.includes(t));
    
    // Remove tags passed for the first time or added common tags, which were not being removed
    removedTagIDs = removedTagIDs.concat(action.removedTagIDs.filter(t => !editedObject.removedTagIDs.includes(t)));
    removedTagIDs = removedTagIDs.concat(removedExistingTagIDs.filter(t => !removedTagIDs.includes(t)));

    return { ...state, editedObjects: { ...state.editedObjects, [objectID]: { ...editedObject, addedTags, removedTagIDs }}};
};


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/** Performs an `update` command on a to-do list of the edited object with `objectID`. */
export const updateEditedToDoList = (objectID: number, update: ToDoListUpdateParams) => ({ type: "UPDATE_EDITED_TO_DO_LIST", objectID, update });

const _updateEditedToDoList = (state: State, action: { objectID: number, update: ToDoListUpdateParams }): State => {
    const { objectID, update } = action;
    const toDoList = getUpdatedToDoList(state.editedObjects[objectID].toDoList, update)
    const newEditedObject = { ...state.editedObjects[objectID], toDoList };
    return { ...state, editedObjects: { ...state.editedObjects, [objectID]: newEditedObject }};
};


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/** Performs an `update` command on an edited composite object & related data (edited subobjects, etc). */
export const updateEditedComposite = (objectID: number, update: GetUpdatedEditedCompositeParams) => ({ type: "UPDATE_EDITED_COMPOSITE", objectID, update });

const _updateEditedComposite = (state: State, action: {objectID: number, update: GetUpdatedEditedCompositeParams }): State => {
    const { objectID, update } = action;
    return EditedCompositeUpdaters.runUpdateCommand(state, objectID, update);
};


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
export const removeEditedObjects = (objectIDs: number[], removeAllSubobjects: boolean = false) => 
    ({ type: "REMOVE_EDITED_OBJECTS", objectIDs, removeAllSubobjects });

const _removeEditedObjects = (state: State, action: { objectIDs: number[], removeAllSubobjects: boolean }): State => {
    const { objectIDs, removeAllSubobjects } = action;
    return EditedObjectsUpdaters.removeEditedObjects(state, objectIDs, removeAllSubobjects);
};


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/** Removes all records from state.editedObjects. */
export const clearEditedObjects = () => ({ type: "CLEAR_EDITED_OBJECTS" });

const _clearEditedObjects = (state: State, action: any): State => {
    return { ...state, editedObjects: {}};
};


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
export const clearUnchangedEditedObjects = (rootObjectID: number, excludedRootID?: number) =>
    ({ type: "CLEAR_UNCHANGED_EDITED_OBJECTS", rootObjectID, excludedRootID });


const _clearUnchangedEditedObjects = (state: State, action: { rootObjectID: number, excludedRootID?: number }): State => {
    const { rootObjectID, excludedRootID } = action;
    // Exclude specified object & its children (when redirected on /objects/edit/`excludedRootID`)
    const excludedObjectIDs = excludedRootID !== undefined ? EditedObjectsSelectors.objectAndSubobjectIDs(state, [excludedRootID]) : [];

    // Get object IDs, which are in composite hierarchy starting from `rootObjectID`
    const hierarchyObjectIDs = EditedObjectsSelectors.editedCompositeHierarchyObjectIDs(state, rootObjectID);

    // Find unchanged object IDs (existing or object ID = 0)
    const unchangedObjectIDs = hierarchyObjectIDs.filter(id => 
        (id > 0 && !EditedObjectsSelectors.safeIsModified(state, id, true))
        || (id === 0 && !EditedObjectsSelectors.isModifiedNew(state, id))
    // Filter excluded object IDs from unchanged list
    ).filter(id => !excludedObjectIDs.includes(id));

    // Delete unchanged objects from the state
    return EditedObjectsUpdaters.removeEditedObjects(state, unchangedObjectIDs);
};


/**
 * Applies required updates to edited objects before they are saved:
 * - normalizes item ID numeration in to-do lists, so that it matches the numeration in the saved version of the object;
 * - triggers to-do list rerender to update item IDs in rendered components;
 */
export const editedObjectsPreSaveUpdate = () => ({ type: "EDITED_OBJECTS_PRE_SAVE_UPDATE" });

const _editedObjectsPreSaveUpdate = (state: State, action: any): State => {
    let newState = state;

    // Get object IDs of to-do lists, which are being saved
    const { currentObjectID } = newState.objectsEditUI;
    const toDoListObjectIDs = EditedObjectsSelectors.objectAndSubobjectIDs(state, [currentObjectID])
        .filter(id => state.editedObjects[id].object_type === "to_do_list");
    
    // Normalize itemIDs in to-do lists
    if (toDoListObjectIDs.length > 0) {
        const newEditedObjects = toDoListObjectIDs.reduce((result, objectID) => {
            const editedObject = newState.editedObjects[objectID];
            const toDoList = getUpdatedToDoList(editedObject.toDoList, { command: "normalizeItemIDs" });
            result[objectID] = { ...editedObject, toDoList };
            return result;
        }, {} as EditedObjects);
        newState = { 
            ...newState,
            editedObjects: { ...newState.editedObjects, ...newEditedObjects },
            objectsEditUI: { ...state.objectsEditUI, toDoListRerenderPending: true }
        };
    }
    
    return newState;
};


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
export const editedObjectsRoot = {
    "ADD_EDITED_OBJECTS": _addEditedObjects,
    "LOAD_EDITED_OBJECTS": _loadEditedObjects,
    "LOAD_EDITED_OBJECTS_TAGS": _loadEditedObjectsTags,
    "UPDATE_EDITED_OBJECT": _updateEditedObject,
    "UPDATE_EDITED_OBJECT_TAGS": _updateEditedObjectTags,
    "UPDATE_EDITED_TO_DO_LIST": _updateEditedToDoList,
    "UPDATE_EDITED_COMPOSITE": _updateEditedComposite,
    "REMOVE_EDITED_OBJECTS": _removeEditedObjects,
    "CLEAR_EDITED_OBJECTS": _clearEditedObjects,
    "CLEAR_UNCHANGED_EDITED_OBJECTS": _clearUnchangedEditedObjects,
    "EDITED_OBJECTS_PRE_SAVE_UPDATE": _editedObjectsPreSaveUpdate
};
