import { SET_AUTH_INFORMATION } from "../actions/auth";

import { getDefaultAuthState } from "../store/state-templates/auth";


function setAuthInformation(state, action) {
    const keys = Object.keys(getDefaultAuthState());
    const newAuth = {};
    
    for (let k of keys) newAuth[k] = k in action.auth ? action.auth[k] : state.auth[k];
    
    return {
        ...state,
        auth: newAuth
    };
}


const root = {
    SET_AUTH_INFORMATION: setAuthInformation
};

export default root;
