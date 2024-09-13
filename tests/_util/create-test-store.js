import createStore from "../../src/store/create-store";
import { getConfig, setConfig } from "../../src/config";
import { getTestConfig } from "../_mocks/config.js";

import { getMockLoginResponse } from "../_mocks/data-auth";
import { getMockUserData } from "../_mocks/data-users";

import { setAuthInformation } from "../../src/actions/auth";
import { addUsers } from "../../src/actions/data-users";
import { StoreManager } from "../_managers/store-manager/store-manager.js";


/**
 * Creates a test Redux store object used by the app and wraps it in a `StoreManager` instance.
 * 
 * Store data can be modified by providing `data` object with the following flags:
 * - `addAdminToken` (enabled by default) - adds an admin auth information to the state;
 * - `addAdminUser` - adds information about admin user.
 * 
 * Custom store configuration can be provided via `configProps` argument.
 */
export const createTestStore = (data = {}, configProps = {}) => {
    const { addAdminToken = true, addAdminUser = false } = data;
    
    getTestConfig({ app: { ...configProps }});  // set test app configuration with provided custom values
    const store = createStore();
    const storeManager = new StoreManager(store);

    if (addAdminToken) storeManager.auth.addAuthData();
    if (addAdminUser) storeManager.users.add();
    
    return storeManager;
};
