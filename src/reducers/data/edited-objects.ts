import { EditedObjectsUpdaters } from "../../store/updaters/data/edited-objects";

import type { State } from "../../store/types/state";
import { type EditedObject } from "../../store/types/data/edited-objects";
import { getUpdatedToDoList, type ToDoListUpdateParams } from "../../store/updaters/data/to-do-lists";
import { getUpdatedToDoList as OLD_getUpdatedToDoList } from "../helpers/object-to-do-lists";


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
/** Performs an `update` command on a to-do list of the edited object with `objectID`. */
export const updateEditedToDoList = (objectID: number, update: ToDoListUpdateParams) => ({ type: "UPDATE_EDITED_TO_DO_LIST", objectID, update });

const _updateEditedToDoList = (state: State, action: { objectID: number, update: ToDoListUpdateParams }): State => {
    const { objectID, update } = action;
    const toDoList = ["addItem", "updateItem", "deleteItem"].includes(update.command)
        ? getUpdatedToDoList(state.editedObjects[objectID].toDoList, update)
        : OLD_getUpdatedToDoList(state.editedObjects[objectID].toDoList, update);    // TODO remove old version when possible
    const newEditedObject = { ...state.editedObjects[objectID], toDoList };
    return { ...state, editedObjects: { ...state.editedObjects, [objectID]: newEditedObject }};
};


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
export const editedObjectsRoot = {
    "ADD_EDITED_OBJECTS": _addEditedObjects,
    "UPDATE_EDITED_TO_DO_LIST": _updateEditedToDoList
};
