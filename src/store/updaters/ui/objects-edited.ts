import type { State } from "../../../types/store/state";


export class ObjectsEditedUpdaters {
    /** Deselects objects, which are not present in state.editedObjects. */
    static deselectNonEditedObjects(state: State): State {
        const selectedObjectIDs = new Set([...state.objectsEditedUI.selectedObjectIDs].filter(objectID => objectID in state.editedObjects));
        return { ...state, objectsEditedUI: { ...state.objectsEditedUI, selectedObjectIDs }};
    }
}