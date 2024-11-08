import type { UpdateUsersFetchData } from "../../../fetches/types/data/users";
import type { State } from "../../types/state";


/**
 * Accepts current state and `updates` object with user attributes from /users/:id form.
 * Returns an object with modified attributes only.
 */
export const getUpdatedUserValues = (state: State, updates: UpdateUsersFetchData & Record<string, any>): Partial<UpdateUsersFetchData> => {
    const result: Partial<UpdateUsersFetchData> & Record<string, any> = {};
    const currentUserData = state.users[updates.user_id];

    if (updates.login.length > 0) result.login = updates.login;
    if (updates.username.length > 0) result.username = updates.username;

    if (updates.password.length > 0) {
        result.password = updates.password;
        result.password_repeat = updates.password_repeat;
    }

    for (let attr of ["user_level", "can_login", "can_edit_objects"]) {
        if (updates[attr] !== undefined && updates[attr] !== (currentUserData as Record<string, any>)[attr]) result[attr] = updates[attr];
    }

    return result;
};
