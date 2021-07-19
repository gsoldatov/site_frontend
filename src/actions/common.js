/**
 * Path creators return a string based on the current Redux state. If no redirect is required, they must return an empty string.
 */
export const REDIRECT_ON_RENDER_PATH_CREATORS = {
    tagsEdit: state => state.tagsUI.selectedTagIDs.length == 1 ? `/tags/${state.tagsUI.selectedTagIDs[0]}` : "",
    objectsEdit: state => state.objectsUI.selectedObjectIDs.length == 1 ? `/objects/${state.objectsUI.selectedObjectIDs[0]}` : ""
};

export const SET_REDIRECT_ON_RENDER = "SET_REDIRECT_ON_RENDER";

export const setRedirectOnRender = (redirectOnRender = "", additionalParams = {}) => ({ type: SET_REDIRECT_ON_RENDER, redirectOnRender, additionalParams });
