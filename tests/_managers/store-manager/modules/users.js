import { addUsers } from "../../../../src/actions/data-users";


/**
 * Performs operations with `state.users` part of the state.
 */
export class UsersStoreManager {
    constructor(store, generator) {
        this.store = store;
        this.generator = generator;
    }

    /**
     * Adds a user data to the state.
     * 
     * Custom values for any attribute can be passed in the `customValues` argument.
     */
    add(customValues = {}) {
        const user = this.generator.user.user(customValues);
        this.store.dispatch(addUsers([user]));
        return user;
    }
}
