import { 
    loadEditedObjects, updateEditedObject, updateEditedObjectTags, updateEditedToDoList,
    updateEditedComposite
 } from "../../../../../src/reducers/data/edited-objects";

import type { AppStore } from "../../../../../src/types/store/store";
import type { EditedObjectUpdate } from "../../../../../src/store/updaters/data/edited-objects";
import type { ToDoListUpdateParams } from "../../../../../src/store/updaters/data/to-do-lists";
import type { GetUpdatedEditedCompositeParams } from "../../../../../src/store/updaters/data/edited-composite";
import type { EditedObject } from "../../../../../src/types/store/data/edited-objects";
import type { DataGenerator } from "../../../../_mock-data/data-generator";
import type { ObjectType } from "../../../../_mock-data/modules/objects";


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
     * Runs an `update` command on an edited to-do list object.
     */
    updateEditedToDoList(objectID: number, update: ToDoListUpdateParams) {
        this.store.dispatch(updateEditedToDoList(objectID, update));
    }

    /**
     * Runs an `update` command on an edited composite object.
     */
    updateEditedComposite(objectID: number, update: GetUpdatedEditedCompositeParams) {
        this.store.dispatch(updateEditedComposite(objectID, update));
    }

    /**
     * Fills attributes & data of an edited object with the provided `objectID` and `object_type`,
     * which are required for a successful save fetch.
     * 
     * Adds `customValues` to the object, if provided (supports update of top-level attributes & top-level data attributes).
     */
    updateForUpsert(objectID: number, object_type: ObjectType = "link", customValues?: EditedObjectUpdate): EditedObject {
        let update: EditedObjectUpdate = { object_name: "object name", object_type };
        if (object_type === "link") update = { ...update, link: { link: "http://test.link.com" }};
        if (object_type === "markdown") update = { ...update, markdown: { raw_text: "text" }};
        if (object_type === "to_do_list") {
            this.updateEditedToDoList(objectID, { command: "addItem", position: 0, item_text: "some text" })
        }
        update = { ...update, ...customValues };
        this.update(objectID, update);
        return this.store.getState().editedObjects[objectID];
    }
}
