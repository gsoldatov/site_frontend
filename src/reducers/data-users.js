import { ADD_USERS, UPDATE_USER } from "../actions/data-users";
import { fullviewModeUserAttributes } from "../store/state-templates/users";


function addUsers(state, action) {
    let newUsers = {};
    action.users.forEach(user => {
        const { user_id } = user;
        newUsers[user_id] = {};
        fullviewModeUserAttributes.forEach(attr => {
            if (attr in user) newUsers[user_id][attr] = user[attr];
        });
    });
    return {
        ...state,
        users: {
            ...state.users,
            ...newUsers
        }
    };
};


function updateUser(state, action) {
    const { user_id } = action.user;
    if (!(user_id in state.users)) throw Error(`Can't update data of a missing user ${user_id}.`);

    const newUser = {...state.users[user_id]};
    fullviewModeUserAttributes.forEach(attr => {
        if (attr in action.user) newUser[attr] = action.user[attr];
    });

    return {
        ...state,
        users: {
            ...state.users,
            [user_id]: newUser
        }
    };
}


const root = {
    ADD_USERS: addUsers,
    UPDATE_USER: updateUser
};

export default root;
