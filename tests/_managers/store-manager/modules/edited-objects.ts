import { resetEditedObjects } from "../../../../src/actions/objects-edit";

import type { AppStore } from "../../../../src/util/types/common";
import type { DataGenerator } from "../../../_mock-data/data-generator";


/**
 * Performs operations with edited objects' store
 */
export class EditedObjectsStoreManager {
    store: AppStore
    generator: DataGenerator

    constructor(store: AppStore, generator: DataGenerator) {
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
