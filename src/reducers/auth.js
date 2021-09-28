import { SET_AUTH_INFORMATION } from "../actions/auth";

import { getDefaultAuthState } from "../store/state-templates/auth";
import { enumUserLevels } from "../util/enum-user-levels";


function setAuthInformation(state, action) {
    const keys = Object.keys(getDefaultAuthState());
    const newAuth = {};
    
    for (let k of keys) newAuth[k] = k in action.auth ? action.auth[k] : state.auth[k];

    if (typeof(newAuth.user_level) === "string") {
        newAuth.user_level = enumUserLevels[newAuth.user_level];
        if (newAuth.user_level === undefined) throw Error(`Received incorrect user_level value: ${action.auth.user_level}`);
    }
    
    return {
        ...state,
        auth: newAuth
    };
}


const root = {
    SET_AUTH_INFORMATION: setAuthInformation
};

export default root;
