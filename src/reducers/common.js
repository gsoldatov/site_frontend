import { SET_REDIRECT_ON_RENDER } from "../actions/common";
import { currentObjectHasNoChanges } from "../util/equality-checks";


function setRedirectOnRender(state, action) {
    // Remove currentlyEdited object from state.editedObjects if it was not changed;
    // delete new object from state.editedObjects if `deleteNewObject` prop was passed via action.
    let newEditedObjects = state.editedObjects;
    const currentObjectID = state.objectUI.currentObjectID;
    if (currentObjectID != 0 || action.deleteNewObject) {
        newEditedObjects = {...state.editedObjects};
        if (currentObjectID != 0 && currentObjectHasNoChanges(state)) delete newEditedObjects[currentObjectID];
        if (action.deleteNewObject) delete newEditedObjects[0];
    }

    const redirectOnRender = typeof(action.redirectOnRender) === "function"  ? action.redirectOnRender(state) : action.redirectOnRender;
    return {
        ...state,
        editedObjects: newEditedObjects,
        redirectOnRender
    };
}

const root = {
    SET_REDIRECT_ON_RENDER: setRedirectOnRender
};

export default root;
