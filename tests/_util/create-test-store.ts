import { createStore } from "../../src/store/create-store";
import { updateConfig } from "../../src/config";
import { StoreManager } from "../_managers/store-manager/store-manager";

import type { AppConfig } from "../../src/types/config";

/**
 * Creates a test Redux store object used by the app and wraps it in a `StoreManager` instance.
 * 
 * Store data can be modified by providing `data` object with the following flags:
 * - `addAdminToken` (enabled by default) - adds an admin auth information to the state;
 * - `addAdminUser` - adds information about admin user.
 * 
 * Custom store configuration can be provided via `configProps` argument.
 */
export const createTestStore = (data?: CreateTestStoreDataProps, configProps?: Partial<AppConfig>): StoreManager => {
    const { addAdminToken = true, addAdminUser = false } = data || {};
    
    // Update app configuration
    if (configProps) updateConfig(configProps);
    
    // Create store & populate it with data
    const store = createStore();
    const storeManager = new StoreManager(store);

    if (addAdminToken) storeManager.auth.addAuthData();
    if (addAdminUser) storeManager.users.add();
    
    return storeManager;
};

type CreateTestStoreDataProps = {
    addAdminToken?: boolean,
    addAdminUser?: boolean
};
