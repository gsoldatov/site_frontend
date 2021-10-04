/**
 * Returns mock user data for /users/view response.
 * User attributes can be passed into function to override default values. If `full_view_mode` = true, returns full set of attributes, otherwise - only basic.
 */
export const getMockUserData = ({ user_id, registered_at, username, user_level, can_login, can_edit_objects, full_view_mode } = {}) => {
    user_id = user_id === undefined ? 1 : user_id;
    if (registered_at === undefined) {
        const registeredAt = new Date();
        registeredAt.setDate(registeredAt.getDate() - 1);
        registered_at = registeredAt.toISOString();
    }
    username = username === undefined ? `user ${user_id} username` : username;

    if (!full_view_mode) return { user_id, registered_at, username };

    user_level = user_level === undefined ? "admin" : user_level;
    can_login = can_login === undefined ? true : can_login;
    can_edit_objects = can_edit_objects === undefined ? true : can_edit_objects;

    return { user_id, registered_at, username, user_level, can_login, can_edit_objects };
};
