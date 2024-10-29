import { setAuthInformation } from "../../../../src/actions/auth";

import type { Store } from "redux";
import type { DataGenerator } from "../../../_mock-data/data-generator";
import type { AuthData } from "../../../_mock-data/modules/auth";

/**
 * Performs operations with `state.auth` part of the state.
 */
export class AuthStoreManager {
    store: Store
    generator: DataGenerator

    constructor(store: Store, generator: DataGenerator) {
        this.store = store;
        this.generator = generator;
    }

    /**
     * Adds a user auth data to the state.
     * 
     * Custom values for any attribute can be passed in the `customValues` argument
     * (note, that they will be wrapped as `auth` object, when passed to data generator)
     */
    addAuthData(customValues?: Partial<AuthData>): AuthData {
        const { auth } = this.generator.auth.login({ auth: customValues || {} });
        this.store.dispatch(setAuthInformation(auth));
        return auth;
    }
}
