import { getInitialState } from "../store/types/state";
import { getStateAfterObjectPageLeave } from "./helpers/object";

import type { State } from "../store/types/state";


/**
 * Sets `state` as the new state of app.
 */
export const setNewState = (state: State) => ({ type: "SET_NEW_STATE", state });

/**
 * Sets `redirectOnRender`.
 * Optionally, clears unchanged edited object.
 */
export const setRedirectOnRender = (redirectOnRender: string, options = {}) => ({ type: "SET_REDIRECT_ON_RENDER", redirectOnRender, options });

/**
 * Resets app's state, except for edited objects storage.
 * Optionally, sets `redirectOnRender` value.
 */
export const resetStateExceptForEditedObjects = (options: ResetStateExceptForEditedObjectsOptions = {}) => ({ type: "RESET_STATE_EXCEPT_FOR_EDITED_OBJECTS", options });



const _setNewState = (state: State, action: { state: State }): State => {
    return action.state;
}


const _setRedirectOnRender = (state: State, action: { redirectOnRender: string, options: SetRedirectOnRenderOptions }) => {
    let newState = state;
    const { deleteNewObject } = action.options;
    
    // Remove current edited object from state.editedObjects if it was not changed;
    // delete new object from state.editedObjects if `deleteNewObject` prop was passed via action.
    // In any of the above cases, if the object is composite, delete all its unchanged subobjects.

    // Clear state.editedObjects if prompted to:
    // - `deleteNewObject` removes new object and its subobjects.
    if (deleteNewObject) {
        newState = getStateAfterObjectPageLeave(state, { deleteNewObject });
    }

    // const redirectOnRender = typeof(action.redirectOnRender) === "function" ? action.redirectOnRender(newState) : action.redirectOnRender;
    const { redirectOnRender } = action;
    return {
        ...newState,
        redirectOnRender
    };
}


function _resetStateExceptForEditedObjects(state: State, action: { options: ResetStateExceptForEditedObjectsOptions }) {
    const newState = getInitialState();
    newState.editedObjects = state.editedObjects;

    const options = action.options || {};
    if (options.redirectOnRender !== undefined) newState.redirectOnRender = options.redirectOnRender;

    return newState;
}


export const commonRoot = {
    "SET_NEW_STATE": _setNewState,
    "SET_REDIRECT_ON_RENDER": _setRedirectOnRender,
    "RESET_STATE_EXCEPT_FOR_EDITED_OBJECTS": _resetStateExceptForEditedObjects
};


type SetRedirectOnRenderOptions = {
    deleteNewObject?: boolean
}

type ResetStateExceptForEditedObjectsOptions = {
    redirectOnRender?: string
}