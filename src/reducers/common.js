import { SET_REDIRECT_ON_RENDER } from "../actions/common";
import { objectHasNoChanges } from "../store/state-util/objects";
import { getStateWithRemovedEditedObjects } from "./helpers/object";


function setRedirectOnRender(state, action) {
    // Remove currentlyEdited object from state.editedObjects if it was not changed;
    // delete new object from state.editedObjects if `deleteNewObject` prop was passed via action.
    // In any of the above cases, if the object is composite, delete all its unchanged subobjects
    let newState = state;
    const currentObjectID = state.objectUI.currentObjectID;
    if (currentObjectID != 0 || action.deleteNewObject) {
        if (currentObjectID != 0 && objectHasNoChanges(state, currentObjectID))
            newState = getStateWithRemovedEditedObjects(newState, [currentObjectID]);
        if (action.deleteNewObject) newState = getStateWithRemovedEditedObjects(newState, [0]);
    }

    const redirectOnRender = typeof(action.redirectOnRender) === "function" ? action.redirectOnRender(newState) : action.redirectOnRender;
    return {
        ...newState,
        redirectOnRender
    };
}

const root = {
    SET_REDIRECT_ON_RENDER: setRedirectOnRender
};

export default root;
