import { DataGenerator } from "../../_mock-data/data-generator";

import { AuthStoreManager } from "./modules/data/auth";
import { UsersStoreManager } from "./modules/data/users";
import { TagsStoreManager } from "./modules/data/tags";
import { ObjectsStoreManager } from "./modules/data/objects";
import { EditedObjectsStoreManager } from "./modules/data/edited-objects";

import { ObjectsEditStoreManager } from "./modules/ui/objects-edit";

import { setNewState } from "../../../src/reducers/common";

import type { AppStore } from "../../../src/types/store/store";
import type { State } from "../../../src/types/store/state";


/**
 * Wrapper over test Redux store for performing operations with it.
 */
export class StoreManager {
    store: AppStore
    generator: DataGenerator

    auth: AuthStoreManager
    users: UsersStoreManager
    tags: TagsStoreManager
    objects: ObjectsStoreManager
    editedObjects: EditedObjectsStoreManager

    objectsEdit: ObjectsEditStoreManager
    
    constructor(store: AppStore) {
        this.store = store;
        this.generator = new DataGenerator();

        this.auth = new AuthStoreManager(this.store, this.generator);
        this.users = new UsersStoreManager(this.store, this.generator);
        this.tags = new TagsStoreManager(this.store, this.generator);
        this.objects = new ObjectsStoreManager(this.store, this.generator);
        this.editedObjects = new EditedObjectsStoreManager(this.store, this.generator);

        this.objectsEdit = new ObjectsEditStoreManager(this.store, this.generator);
    }

    /**
     * Partially updates state with values from `newState` (top-level attributes only).
     */
    updateState(newState: Partial<State>) {
        this.store.dispatch(setNewState({ ...this.store.getState(), ...newState }));
    }
}
