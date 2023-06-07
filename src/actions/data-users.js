export const ADD_USERS = "ADD_USERS";
export const UPDATE_USER = "UPDATE_USER";


/** [Reducer file](../reducers/data-users.js) */
export const addUsers   = users => ({ type: ADD_USERS, users });
/** [Reducer file](../reducers/data-users.js) */
export const updateUser = user => ({ type: UPDATE_USER, user });
