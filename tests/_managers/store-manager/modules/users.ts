import { addUsers } from "../../../../src/actions/data-users";

import type { Store } from "redux";
import type { DataGenerator } from "../../../_mock-data/data-generator";
import type { User } from "../../../_mock-data/modules/users";

/**
 * Performs operations with `state.users` part of the state.
 */
export class UsersStoreManager {
    store: Store
    generator: DataGenerator

    constructor(store: Store, generator: DataGenerator) {
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
