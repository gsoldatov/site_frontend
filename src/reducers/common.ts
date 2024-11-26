import { EditedObjectsUpdaters } from "../store/updaters/data/edited-objects";
import { getInitialState } from "../store/types/state";

import type { State } from "../store/types/state";


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/** Sets `state` as the new state of app. */
export const setNewState = (state: State) => ({ type: "SET_NEW_STATE", state });

const _setNewState = (state: State, action: { state: State }): State => action.state;


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
type SetRedirectOnRenderOptions = { deleteNewObject?: boolean };
/**
 * Sets `redirectOnRender`.
 * Optionally, clears unchanged edited object.
 */
export const setRedirectOnRender = (redirectOnRender: string, options: SetRedirectOnRenderOptions = {}) => ({ type: "SET_REDIRECT_ON_RENDER", redirectOnRender, options });

const _setRedirectOnRender = (state: State, action: { redirectOnRender: string, options: SetRedirectOnRenderOptions }): State => {
    let newState = state;
    const { deleteNewObject } = action.options;

    // Remove new object & its new subobjects, if set to
    if (deleteNewObject) newState = EditedObjectsUpdaters.removeEditedObjects(state, [0]);

    return { ...newState, redirectOnRender: action.redirectOnRender };
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
type ResetStateExceptForEditedObjectsOptions = { redirectOnRender?: string };

/**
 * Resets app's state, except for edited objects storage.
 * Optionally, sets `redirectOnRender` value.
 */
export const resetStateExceptForEditedObjects = (options: ResetStateExceptForEditedObjectsOptions = {}) => ({ type: "RESET_STATE_EXCEPT_FOR_EDITED_OBJECTS", options });

const _resetStateExceptForEditedObjects = (state: State, action: { options: ResetStateExceptForEditedObjectsOptions }): State => {
    const newState = getInitialState();
    newState.editedObjects = state.editedObjects;

    const options = action.options || {};
    if (options.redirectOnRender !== undefined) newState.redirectOnRender = options.redirectOnRender;

    return newState;
};


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
export const commonRoot = {
    "SET_NEW_STATE": _setNewState,
    "SET_REDIRECT_ON_RENDER": _setRedirectOnRender,
    "RESET_STATE_EXCEPT_FOR_EDITED_OBJECTS": _resetStateExceptForEditedObjects
};
