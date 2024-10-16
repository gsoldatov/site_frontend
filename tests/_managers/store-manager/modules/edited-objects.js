import { resetEditedObjects } from "../../../../src/actions/objects-edit";


/**
 * Performs operations with edited objects' store
 */
export class EditedObjectsStoreManager {
    constructor(store, generator) {
        this.store = store;
        this.generator = generator;
    }

    /**
     * Resets edited objects for the specified `objectID` to last saved or default state.
     */
    reset(objectIDs) {
        this.store.dispatch(resetEditedObjects({ objectIDs }));
    }
}
