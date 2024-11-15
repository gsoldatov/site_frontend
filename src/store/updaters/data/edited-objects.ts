import { editedObject, type EditedObject, type EditedObjects } from "../../types/data/edited-objects";
import type { State } from "../../types/state";


/** Contains state updating methods for state.editedObjects. */
export class EditedObjectsUpdaters {
    /** Returns a new state with `editedObjects` added to state.editedObjects store. */
    static addEditedObjects(state: State, editedObjects: EditedObject[]): State {
        const newEditedObjects: EditedObjects = {};
        editedObjects.forEach(eo => {
            const validatedEO = editedObject.parse(eo);
            newEditedObjects[validatedEO.object_id] = validatedEO;
        });
        return { ...state, editedObjects: { ...state.editedObjects, ...newEditedObjects }};
    }
}
