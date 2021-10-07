export const ADD_USERS = "ADD_USERS";
export const UPDATE_USER = "UPDATE_USER";

export const addUsers   = users => ({ type: ADD_USERS, users });
export const updateUser = user => ({ type: UPDATE_USER, user });
