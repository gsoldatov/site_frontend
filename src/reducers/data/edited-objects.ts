import { EditedObjectsUpdaters } from "../../store/updaters/data/edited-objects";

import type { State } from "../../store/types/state";
import { type EditedObject } from "../../store/types/data/edited-objects";
import { getUpdatedToDoList, type ToDoListUpdateParams } from "../../store/updaters/data/to-do-lists";
import { getStateWithCompositeUpdate as OLD_getStateWithCompositeUpdate } from "../helpers/object-composite";
import { getUpdatedEditedComposite, type GetUpdatedEditedCompositeParams } from "../../store/updaters/data/edited-composite";


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
    if (["addNewSubobject", "addExistingSubobject", "updateSubobject", "toggleSubobjectsIsPublished",
        "setSubobjectsFetchError", "updatePositionsOnDrop", 
    ].includes(update.command)) return getUpdatedEditedComposite(state, objectID, update);
    return OLD_getStateWithCompositeUpdate(state, objectID, update);    // TODO remove old function call
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
export const editedObjectsRoot = {
    "ADD_EDITED_OBJECTS": _addEditedObjects,
    "LOAD_EDITED_OBJECTS": _loadEditedObjects,
    "UPDATE_EDITED_TO_DO_LIST": _updateEditedToDoList,
    "UPDATE_EDITED_COMPOSITE": _updateEditedComposite
};
