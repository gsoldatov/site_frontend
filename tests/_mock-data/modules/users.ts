import type { UserLevel } from "../../../src/util/types/users";


interface UserMin {
    user_id: number,
    registered_at: string,
    username: string
}

export interface User extends UserMin {
    user_level: UserLevel,
    can_login: boolean,
    can_edit_objects: boolean
}


/**
 * User generator class.
 */
export class UserGenerator {
    /**
     * Generates user attributes. Custom values for any attribute can be passed in the `customValues` argument.
     */
    user(customValues?: Partial<User>): User {
        let { user_id, registered_at, username, user_level, can_login, can_edit_objects } = customValues || {};

        user_id = user_id || 1;

        if (!registered_at) {
            registered_at = (new Date(Date.now() - user_id)).toISOString();
        }

        return {
            user_id,
            registered_at,
            username: username || `user ${user_id} name`,
            user_level: user_level || "admin",
            can_login: can_login !== undefined ? can_login : true,
            can_edit_objects: can_edit_objects !== undefined ? can_edit_objects : true
        };
    }

    /**
     * Generates user attributes viewable without full view mode. Custom values for any attribute can be passed in the `customValues` argument.
     */
    userMin(customValues?: Partial<UserMin>): UserMin {
        let { user_id, registered_at, username } = this.user(customValues || {});
        return { user_id, registered_at, username };
    }
}
