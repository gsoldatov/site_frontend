import { addUsers } from "../../../../src/reducers/data/users";

import type { AppStore } from "../../../../src/util/types/common";
import type { DataGenerator } from "../../../_mock-data/data-generator";
import type { User } from "../../../_mock-data/modules/users";

/**
 * Performs operations with `state.users` part of the state.
 */
export class UsersStoreManager {
    store: AppStore
    generator: DataGenerator

    constructor(store: AppStore, generator: DataGenerator) {
        this.store = store;
        this.generator = generator;
    }

    /**
     * Adds a user data to the state.
     * 
     * Custom values for any attribute can be passed in the `customValues` argument.
     */
    add(customValues?: Partial<User>): User {
        const user = this.generator.user.user(customValues || {});
        this.store.dispatch(addUsers([user]));
        return user;
    }
}
