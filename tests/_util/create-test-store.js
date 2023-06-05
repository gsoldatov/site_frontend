import createStore from "../../src/store/create-store";
import { deepCopy } from "../../src/util/copy";
import testConfig from "../_mocks/config_.json";

import { getMockLoginResponse } from "../_mocks/data-auth";
import { getMockUserData } from "../_mocks/data-users";

import { setAuthInformation } from "../../src/actions/auth";
import { addUsers } from "../../src/actions/data-users";


/**
 * Creates a Redux store object used by the app.
 * Adds an admin token by default, unless `addAdminToken` = false is set.
 * Adds user information for admin token owner in state.users, if `addAdminUser` = true.
 * 
 * Created store uses default values from `_mocks/config.json` file, which can be overriden by passing additional `...configProps` arguments.
 */
export const createTestStore = ({ addAdminToken, addAdminUser, ...configProps } = {}) => {
    addAdminToken = addAdminToken === undefined ? true : addAdminToken;

    const config = { ...deepCopy(testConfig).app, ...configProps };
    const store = createStore(config);

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
