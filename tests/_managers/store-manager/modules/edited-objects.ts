import { 
    loadEditedObjects, updateEditedObject, updateEditedObjectTags, updateEditedToDoList,
    updateEditedComposite
 } from "../../../../src/reducers/data/edited-objects";

import type { AppStore } from "../../../../src/types/store/store";
import type { EditedObjectUpdate } from "../../../../src/store/updaters/data/edited-objects";
import type { ToDoListUpdateParams } from "../../../../src/store/updaters/data/to-do-lists";
import type { GetUpdatedEditedCompositeParams } from "../../../../src/store/updaters/data/edited-composite";
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
    reset(objectIDs: number[]) {
        this.store.dispatch(loadEditedObjects(objectIDs));
    }

    /**
     * Performs partial update of an edited object's attributes or top-level data attributes (e.g., composite display mode).
     */
    update(objectID: number, update: EditedObjectUpdate) {
        this.store.dispatch(updateEditedObject(objectID, update));
    }

    /**
     * Updates `addedTags` & `removedTagIDs` attributes of an edited objects.
     */
    updateTags(objectID: number, updates: { added?: (string | number)[], removed?: number[] }) {
        this.store.dispatch(updateEditedObjectTags(objectID, updates));
    }

    /**
     * Runs an `update` command on an edited to-do list.
     */
    updateEditedToDoList(objectID: number, update: ToDoListUpdateParams) {
        this.store.dispatch(updateEditedToDoList(objectID, update));
    }

    updateEditedComposite(objectID: number, update: GetUpdatedEditedCompositeParams) {
        this.store.dispatch(updateEditedComposite(objectID, update));
    }
}
