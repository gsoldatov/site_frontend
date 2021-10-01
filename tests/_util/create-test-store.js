import createStore from "../../src/store/create-store";

import { getMockLoginResponse } from "../_mocks/data-auth";

import { setAuthInformation } from "../../src/actions/auth";


/**
 * Creates a Redux store object used by the app.
 * Adds an admin token by default, unless `addAdminToken` = false is set.
 */
export const createTestStore = ({ addAdminToken, ...rest } = {}) => {
    addAdminToken = addAdminToken === undefined ? true : addAdminToken;

    const store = createStore({ ...rest });

    if (addAdminToken) {
        const { auth } = getMockLoginResponse();
        store.dispatch(setAuthInformation(auth));
    }

    return store;
};
