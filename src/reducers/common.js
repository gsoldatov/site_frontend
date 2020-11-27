import { SET_REDIRECT_ON_RENDER } from "../actions/common";


function setRedirectOnRender(state, action) {
    const redirectOnRender = typeof(action.redirectOnRender) === "function"  ? action.redirectOnRender(state) : action.redirectOnRender;
    return {
        ...state,
        redirectOnRender: redirectOnRender
    };
}

const root = {
    SET_REDIRECT_ON_RENDER: setRedirectOnRender
};

export default root;
