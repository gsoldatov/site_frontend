import type { State } from "../../store/types/state";
import type { NavigationUI } from "../../store/types/ui/navigation";


/**
 * Updates state.navigationUI with values from `navigationUI`.
 */
export const setNavigationUI = (navigationUI: Partial<NavigationUI>) => ({ type: "SET_NAVIGATION_UI", navigationUI });


function _setNavigationUI (state: State, action: { navigationUI: Partial<NavigationUI> }): State {
    const navigationUI = { ...state.navigationUI, ...action.navigationUI };
    return { ...state, navigationUI };
}


export const navigationRoot = {
    "SET_NAVIGATION_UI": _setNavigationUI
};
