import { EditedObjectsUpdaters } from "../../store/updaters/data/edited-objects";

import type { State } from "../../store/types/state";
import { type EditedObject } from "../../store/types/data/edited-objects";


/**
 * Adds a list of `editedObjects` into state.editedObjects.
 * Overwrites existing objects.
 */
export const addEditedObjects = (editedObjects: EditedObject[]) => ({ type: "ADD_EDITED_OBJECTS", editedObjects });

const _addEditedObjects = (state: State, action: { editedObjects: EditedObject[] }): State => {
    return EditedObjectsUpdaters.addEditedObjects(state, action.editedObjects);
};


export const editedObjectsRoot = {
    "ADD_EDITED_OBJECTS": _addEditedObjects
};
