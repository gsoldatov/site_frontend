import { SET_REDIRECT_ON_RENDER, RESET_STATE_EXCEPT_FOR_EDITED_OBJECTS } from "../actions/common";
import { getStateAfterObjectPageLeave } from "./helpers/object";
import getInitialState from "../store/state-templates/initial-state";


function setRedirectOnRender(state, action) {
    let newState = state;
    const { deleteCurrentEditedObject, deleteNewObject } = action.additionalParams;
    
    // Remove current edited object from state.editedObjects if it was not unchanged;
    // delete new object from state.editedObjects if `deleteNewObject` prop was passed via action.
    // In any of the above cases, if the object is composite, delete all its unchanged subobjects.

    // Clear state.editedObjects if prompted to.
    // `deleteNewObject` removes new object and its subobjects.
    // `deleteCurrentEditedObject` removes current existing object and its subobjects.
    // `deleteNewObject` and `deleteCurrentEditedObject` currently can't be used together.
    if (deleteCurrentEditedObject || deleteNewObject) {     // NOTE: check if `deleteCurrentEditedObject` case is working if it becomes necessary for some purpose
        newState = getStateAfterObjectPageLeave(state, deleteNewObject);
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

const root = {
    SET_REDIRECT_ON_RENDER: setRedirectOnRender,
    RESET_STATE_EXCEPT_FOR_EDITED_OBJECTS: resetStateExceptForEditedObjects
};

export default root;
