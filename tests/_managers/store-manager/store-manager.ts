import { DataGenerator } from "../../_mock-data/data-generator";

import { AuthStoreManager } from "./modules/auth";
import { EditedObjectsStoreManager } from "./modules/edited-objects";
import { ObjectsStoreManager } from "./modules/objects";
import { UsersStoreManager } from "./modules/users";

import type { Store } from "redux";


/**
 * Wrapper over test Redux store for performing operations with it.
 */
export class StoreManager {
    store: Store
    generator: DataGenerator

    auth: AuthStoreManager
    users: UsersStoreManager
    objects: ObjectsStoreManager
    editedObjects: EditedObjectsStoreManager
    
    constructor(store: Store) {
        this.store = store;
        this.generator = new DataGenerator();

        this.auth = new AuthStoreManager(this.store, this.generator);
        this.users = new UsersStoreManager(this.store, this.generator);
        this.objects = new ObjectsStoreManager(this.store, this.generator);

        this.editedObjects = new EditedObjectsStoreManager(this.store, this.generator);
    }
}