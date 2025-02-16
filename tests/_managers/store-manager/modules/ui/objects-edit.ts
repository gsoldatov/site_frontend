import { objectsEditExistingOnLoad, objectsEditSaveFetch } from "../../../../../src/fetches/ui/objects-edit";
import { loadObjectsEditNewPage, loadObjectsEditExistingPage } from "../../../../../src/reducers/ui/objects-edit";

import type { AppStore } from "../../../../../src/types/store/store";
import type { DataGenerator } from "../../../../_mock-data/data-generator";


/**
 * Performs store operations related to /objects/edit/:id page
 */
export class ObjectsEditStoreManager {
    store: AppStore
    generator: DataGenerator

    constructor(store: AppStore, generator: DataGenerator) {
        this.store = store;
        this.generator = generator;
    }

    /**
     * Loads /object/edit/new page & resets new object
     */
    loadObjectsEditNewPage() {
        this.store.dispatch(loadObjectsEditNewPage());
    }

    /**
     * Simulates load of /objects/edit/:id page & an edited object with the provided `objectID`.
     */
    async loadObjectsEditExistingPage(objectID: number) {
        this.store.dispatch(loadObjectsEditExistingPage(objectID));
        await this.store.dispatch(objectsEditExistingOnLoad(objectID));
    }

    /**
     * Simulates clicking on the "Save" button
     */
    async save() {
        await this.store.dispatch(objectsEditSaveFetch());
    }
}
