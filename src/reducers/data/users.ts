import type { User, Users } from "../../store/types/data/users";
import { PartialExcept } from "../../util/types/common";
import type { State } from "../../store/types/state";


/** Add a list of `users` to the user store. */
export const addUsers = (users: User[]) => ({ type: "ADD_USERS", users });


const _addUsers = (state: State, action: { users: User[] }): State => {
    let newUsers = action.users.reduce((result, user) => {
        result[user.user_id] = user;
        return result;
    }, {} as Users);
    return { ...state, users: { ...state.users, ...newUsers }};
};


/** Updates existing user data with values from `user. */
export const updateUser = (user: PartialExcept<User, "user_id">) => ({ type: "UPDATE_USER", user });


const _updateUser = (state: State, action: { user: PartialExcept<User, "user_id"> }) => {
    const { user_id } = action.user;
    if (!(user_id in state.users)) throw Error(`Can't update data of a missing user ${user_id}.`);

    const newUser = { ...state.users[user_id], ...action.user} ;

    return {
        ...state,
        users: {
            ...state.users,
            [user_id]: newUser
        }
    };
}


export const usersRoot = {
    "ADD_USERS": _addUsers,
    "UPDATE_USER": _updateUser
};
