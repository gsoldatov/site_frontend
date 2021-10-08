import createStore from "../../src/store/create-store";

import { getMockLoginResponse } from "../_mocks/data-auth";
import { getMockUserData } from "../_mocks/data-users";

import { setAuthInformation } from "../../src/actions/auth";
import { addUsers } from "../../src/actions/data-users";


/**
 * Creates a Redux store object used by the app.
 * Adds an admin token by default, unless `addAdminToken` = false is set.
 * Adds user information for admin token owner in state.users, if `addAdminUser` = true.
 */
export const createTestStore = ({ addAdminToken, addAdminUser, ...rest } = {}) => {
    addAdminToken = addAdminToken === undefined ? true : addAdminToken;

    const store = createStore({ ...rest });

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
