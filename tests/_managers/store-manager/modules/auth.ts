import { setAuthInformation } from "../../../../src/reducers/data/auth";

import type { AppStore } from "../../../../src/store/types/store";
import type { DataGenerator } from "../../../_mock-data/data-generator";
import type { AuthData } from "../../../_mock-data/modules/auth";
import { AuthTransformer } from "../../../../src/store/transformers/data/auth";


/**
 * Performs operations with `state.auth` part of the state.
 */
export class AuthStoreManager {
    store: AppStore
    generator: DataGenerator

    constructor(store: AppStore, generator: DataGenerator) {
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
        const authState = AuthTransformer.fromBackendResponse(auth);
        this.store.dispatch(setAuthInformation(authState));
        return auth;
    }
}
