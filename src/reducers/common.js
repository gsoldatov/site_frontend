import { SET_REDIRECT_ON_RENDER } from "../actions/common";
import { getStateAfterObjectPageLeave } from "./helpers/object";


function setRedirectOnRender(state, action) {
    // Remove current edited object from state.editedObjects if it was not unchanged;
    // delete new object from state.editedObjects if `deleteNewObject` prop was passed via action.
    // In any of the above cases, if the object is composite, delete all its unchanged subobjects.
    let newState = getStateAfterObjectPageLeave(state, action.deleteNewObject);

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
