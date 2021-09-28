import { ADD_USERS } from "../actions/data-users";
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


const root = {
    ADD_USERS: addUsers
};

export default root;
