import type { UsersUpdateFetchData } from "../../../types/fetches/data/users";
import type { State } from "../../../types/store/state";


/** 
 * Contains statis methods for selecting user data from app's state.
 */
export class UsersSelectors {
    /**
     * Returns user attributes from `updates`, which contain modified data, that should be passed to backend 
     * during user update fetch.
     * 
     * (NOTE: some attributes are not directly compared to their current values.)
     */
    static getUpdatedUserValues(state: State, updates: UsersUpdateFetchData & Record<string, any>): Partial<UsersUpdateFetchData> {
        const result: Partial<UsersUpdateFetchData> & Record<string, any> = {};
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
}
