import createStore from "../../src/store/create-store";
import { getConfig, setConfig } from "../../src/config";
import { getTestConfig } from "../_mocks/config.js";

import { getMockLoginResponse } from "../_mocks/data-auth";
import { getMockUserData } from "../_mocks/data-users";

import { setAuthInformation } from "../../src/actions/auth";
import { addUsers } from "../../src/actions/data-users";


/**
 * Creates a Redux store object used by the app.
 * Adds an admin token by default, unless `addAdminToken` = false is set.
 * Adds user information for admin token owner in state.users, if `addAdminUser` = true.
 * 
 * If `useAppConfig` is true, uses default config of the app.
 * Otherwise, creates an object based on the `_mocks/config.js` test config.
 * In both cases, initial settings can be overriden by passing additional `...configProps` arguments.
 * 
 */
export const createTestStore = ({ addAdminToken, addAdminUser, useAppConfig, ...configProps } = {}) => {
    addAdminToken = addAdminToken === undefined ? true : addAdminToken;

    var store;

    // If app config is used
    if (useAppConfig) {
        setConfig({ ...getConfig(), ...configProps });
        store = createStore();
    }
    // If a custom config object is used
    else {
        const config = getTestConfig({ app: { ...configProps }});
        store = createStore(config.app);
    }

    if (addAdminToken) {
        const { auth } = getMockLoginResponse();
        store.dispatch(setAuthInformation(auth));
    }

    if (addAdminUser) {
        const user = getMockUserData({ full_view_mode: true });
        store.dispatch(addUsers([user]));
    }

    return store;
};
