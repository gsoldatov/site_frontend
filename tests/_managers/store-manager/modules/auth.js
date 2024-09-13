import { setAuthInformation } from "../../../../src/actions/auth";


/**
 * Performs operations with `state.auth` part of the state.
 */
export class AuthStoreManager {
    constructor(store, generator) {
        this.store = store;
        this.generator = generator;
    }

    /**
     * Adds a user auth data to the state.
     * 
     * Custom values for any attribute can be passed in the `customValues` argument
     * (note, that they will be wrapped as `auth` object, when passed to data generator)
     */
    addAuthData(customValues = {}) {
        const { auth } = this.generator.auth.login({ auth: customValues });
        this.store.dispatch(setAuthInformation(auth));
        return auth;
    }
}
