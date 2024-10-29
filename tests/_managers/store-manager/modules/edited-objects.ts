import { resetEditedObjects } from "../../../../src/actions/objects-edit";

import type { Store } from "redux";
import type { DataGenerator } from "../../../_mock-data/data-generator";


/**
 * Performs operations with edited objects' store
 */
export class EditedObjectsStoreManager {
    store: Store
    generator: DataGenerator

    constructor(store: Store, generator: DataGenerator) {
        this.store = store;
        this.generator = generator;
    }

    /**
     * Resets edited objects for the specified `objectID` to last saved or default state.
     */
    reset(objectIDs: number[]): void {
        this.store.dispatch(resetEditedObjects({ objectIDs }));
    }
}
