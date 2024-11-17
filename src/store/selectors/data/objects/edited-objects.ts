import type { State } from "../../../types/state";


export class EditedObjectsSelectors {
    /**
     * Returns a list of composite subobject IDs stored in `state.editedObjects` for the parent `objectIDs`.
     */
    static subobjectIDs(state: State, objectIDs: number[]): number[] {
        let result: number[] = [];
        for (let objectID of objectIDs) {
            if (objectID in state.editedObjects) {
                result = result.concat(
                    Object.keys(state.editedObjects[objectID].composite.subobjects).map(id => parseInt(id))
                );
            }
        }
        return result;
    }

    /**
     * Returns a list of new composite subobject IDs stored in `state.editedObjects` for the parent `objectIDs`.
     */
    static newSubobjectIDs(state: State, objectIDs: number[]): number[] {
        return EditedObjectsSelectors.subobjectIDs(state, objectIDs).filter(id => id < 0);
    }
}