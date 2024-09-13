import { DataGenerator } from "../../_mock-data/data-generator";

import { AuthStoreManager } from "./modules/auth";
import { ObjectsStoreManager } from "./modules/objects";
import { UsersStoreManager } from "./modules/users";


/**
 * Wrapper over test Redux store for performing operations with it.
 */
export class StoreManager {
    constructor(store) {
        this.store = store;
        this.generator = new DataGenerator();

        this.auth = new AuthStoreManager(this.store, this.generator);
        this.users = new UsersStoreManager(this.store, this.generator);
        this.objects = new ObjectsStoreManager(this.store, this.generator);
    }
}
