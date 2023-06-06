import { SET_NAVIGATION_UI } from "../actions/navigation";
import getInitialState from "../store/state-templates/initial-state";


function setNavigationUI (state, action) {
    const newNavigationUI = { ...state.navigationUI };
    const attrKeys = Object.keys(getInitialState().navigationUI);
    for (let attr of attrKeys) {
        if (attr in action.navigationUI) newNavigationUI[attr] = action.navigationUI[attr];
    }
    
    return { ...state, navigationUI: newNavigationUI };
}


const root = {
    SET_NAVIGATION_UI: setNavigationUI
};

export default root;
