import { SET_AUTH_INFORMATION } from "../actions/auth";

import { getDefaultAuthState } from "../store/types/data/auth";
import { UserLevels } from "../store/types/data/auth";


function setAuthInformation(state, action) {
    const keys = Object.keys(getDefaultAuthState());
    const newAuth = {};
    
    for (let k of keys) newAuth[k] = k in action.auth ? action.auth[k] : state.auth[k];
    if ("user_level" in action.auth) newAuth.numeric_user_level = action.auth.user_level;

    if (typeof(newAuth.numeric_user_level) === "string") {
        newAuth.numeric_user_level = UserLevels[newAuth.numeric_user_level];
        if (newAuth.numeric_user_level === undefined) throw Error(`Received incorrect numeric_user_level value: ${action.auth.numeric_user_level}`);
    }

    // Additional options
    const options = action.options || {};
    const newRedirectOnRender = "redirectOnRender" in options ? options.redirectOnRender : state.redirectOnRender;
    
    return {
        ...state,
        auth: newAuth,
        redirectOnRender: newRedirectOnRender
    };
}


const root = {
    SET_AUTH_INFORMATION: setAuthInformation
};

export default root;
