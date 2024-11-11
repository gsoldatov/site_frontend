import { getMockUserData } from "./data-users";


function handleUsersUpdate(body) {
    return { status: 200, body: {}};
}


function handleUsersView(body) {
    const bodyJSON = JSON.parse(body)
    const { user_ids, full_view_mode } = bodyJSON;
    const response = user_ids.map(user_id => getMockUserData({ user_id, full_view_mode }));

    return { status: 200, body: { users: response }};
}


export const usersHandlersList = new Map([
    ["/users/update", {"PUT": handleUsersUpdate}],
    ["/users/view", {"POST": handleUsersView}]
]);
