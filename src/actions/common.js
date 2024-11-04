export const SET_NEW_STATE = "SET_NEW_STATE";
export const SET_REDIRECT_ON_RENDER = "SET_REDIRECT_ON_RENDER";
export const RESET_STATE_EXCEPT_FOR_EDITED_OBJECTS = "RESET_STATE_EXCEPT_FOR_EDITED_OBJECTS";

/** [Reducer file](../reducers/common.js) */
export const setNewState = newStore => ({ type: SET_NEW_STATE, newStore });
/** [Reducer file](../reducers/common.js) */
export const setRedirectOnRender = (redirectOnRender = "", additionalParams = {}) => ({ type: SET_REDIRECT_ON_RENDER, redirectOnRender, additionalParams });
/** [Reducer file](../reducers/common.js) */
export const resetStateExceptForEditedObjects = options => ({ type: RESET_STATE_EXCEPT_FOR_EDITED_OBJECTS, options });
