import { loadEditedObjects } from "../../../../src/reducers/data/edited-objects";

import type { AppStore } from "../../../../src/store/types/store";
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
        this.store.dispatch(loadEditedObjects(objectIDs));
    }
}
