/**
 * Path creators return a string based on the current Redux state. If no redirect is required, they must return an empty string.
 */
export const REDIRECT_ON_RENDER_PATH_CREATORS = {
    tagsEdit: state => state.tagsUI.selectedTagIDs.length == 1 ? `/tags/edit/${state.tagsUI.selectedTagIDs[0]}` : "",
    objectsEdit: state => state.objectsUI.selectedObjectIDs.length == 1 ? `/objects/edit/${state.objectsUI.selectedObjectIDs[0]}` : ""
};

export const SET_NEW_STATE = "SET_NEW_STATE";
export const SET_REDIRECT_ON_RENDER = "SET_REDIRECT_ON_RENDER";
export const RESET_STATE_EXCEPT_FOR_EDITED_OBJECTS = "RESET_STATE_EXCEPT_FOR_EDITED_OBJECTS";
export const SET_CSS_STATE = "SET_CSS_STATE";

export const setNewState = newStore => ({ type: SET_NEW_STATE, newStore });
export const setRedirectOnRender = (redirectOnRender = "", additionalParams = {}) => ({ type: SET_REDIRECT_ON_RENDER, redirectOnRender, additionalParams });
export const resetStateExceptForEditedObjects = options => ({ type: RESET_STATE_EXCEPT_FOR_EDITED_OBJECTS, options });
export const setCSSState = CSSState => ({ type: SET_CSS_STATE, CSSState });
