import type { State } from "../../store/types/state";
import { auth, type Auth } from "../../store/types/data/auth";

/** 
 * Sets auth data values in state to props of `auth`.
 * 
 * NOTE: `redirectOnRender` option is used to avoid double redirects
 * (e.g., on successful login app is redirected to desired URL, instead of being redirected to index page first).
 */
export const setAuthInformation = (auth: Partial<Auth>, options?: SetAuthInformationOptions ) => ({ type: "SET_AUTH_INFORMATION", auth, options });


const _setAuthInformation = (state: State, action: SetAuthInformationAction): State => {
    const { options = {}} = action;
    const { redirectOnRender = "" } = options;

    return { 
        ...state,
        auth: auth.parse({ ...state.auth, ...action.auth }),
        redirectOnRender
    };
}


export const authRoot = {
    "SET_AUTH_INFORMATION": _setAuthInformation
};


type SetAuthInformationOptions = { redirectOnRender?: string };
type SetAuthInformationAction = { auth: Partial<Auth>, options?: SetAuthInformationOptions }
