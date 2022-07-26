import { SET_NEW_STATE, SET_REDIRECT_ON_RENDER, RESET_STATE_EXCEPT_FOR_EDITED_OBJECTS, SET_CSS_STATE } from "../actions/common";
import { getStateAfterObjectPageLeave } from "./helpers/object";
import getInitialState from "../store/state-templates/initial-state";
import { CSSPropNames } from "../store/state-templates/css";


/**
 * Sets the store to whatever `action.newStore` was provided.
 */
function setNewState(state, action) {
    return action.newStore;
}


function setRedirectOnRender(state, action) {
    let newState = state;
    const { deleteNewObject } = action.additionalParams;
    
    // Remove current edited object from state.editedObjects if it was not unchanged;
    // delete new object from state.editedObjects if `deleteNewObject` prop was passed via action.
    // In any of the above cases, if the object is composite, delete all its unchanged subobjects.

    // Clear state.editedObjects if prompted to:
    // - `deleteNewObject` removes new object and its subobjects.
    if (deleteNewObject) {
        newState = getStateAfterObjectPageLeave(state, { deleteNewObject });
    }

    const redirectOnRender = typeof(action.redirectOnRender) === "function" ? action.redirectOnRender(newState) : action.redirectOnRender;
    return {
        ...newState,
        redirectOnRender
    };
}


function resetStateExceptForEditedObjects(state, action) {
    const newState = getInitialState();
    newState.editedObjects = state.editedObjects;

    const options = action.options || {};
    if ("redirectOnRender" in options) newState.redirectOnRender = options.redirectOnRender;

    return newState;
}


function setCSSState(state, action) {
    const newCSS = { ...state.CSS };
    CSSPropNames.forEach(prop => {
        if (prop in action.CSSState) newCSS[prop] = action.CSSState[prop];
    });
    return { ...state, CSS: newCSS };
}


const root = {
    SET_NEW_STATE: setNewState,
    SET_REDIRECT_ON_RENDER: setRedirectOnRender,
    RESET_STATE_EXCEPT_FOR_EDITED_OBJECTS: resetStateExceptForEditedObjects,
    SET_CSS_STATE: setCSSState
};

export default root;
