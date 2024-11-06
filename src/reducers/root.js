import logState from "../store/log-state";

import { authReducer as auth } from "./data/auth";
import dataTags from "./data-tags";
import dataObjects from "./data-objects";
import dataUsers from "./data-users";

import { commonReducer as common } from "./common";
import modal from "./modal";
import navigation from "./navigation";
import tag from "./tags-edit";
import tags from "./tags-list";
import objectEdit from "./objects-edit";
import objectsList from "./objects-list";
import objectsEdited from "./objects-edited";

import { getConfig } from "../config";


function getActionHandlers(rootObjects) {
    let actionHandlers = {};

    for (let k in rootObjects) {
        let root = rootObjects[k];
        if (typeof(root) !== "object") {
            throw new TypeError(`${k} must be an object, not ${typeof(root)}`);
        }
        for (let reducer in root) {
            if (reducer in actionHandlers) {
                throw new Error(`Can't add "${reducer}" from ${k}, because this key is already present in the main reducer.`);
            }
        }
        actionHandlers = {...actionHandlers, ...root};
    }

    return actionHandlers;
}


const ACTION_HANDLERS = getActionHandlers({ dataTags, dataObjects, dataUsers, auth, common, modal, navigation, tag, tags, objectEdit, objectsList, objectsEdited });


export default function getRootReducer() {
    return (state, action) => {
        const config =  getConfig();
        
        let handler = typeof(action) === "object" 
            ? ACTION_HANDLERS[action.type] : 
            ACTION_HANDLERS[action];
        let newState = handler ? handler(state, action) : state;
        if (config.debugLogging) {
            logState(newState, `Finished dispatching action ${action.type}, new state:`);
        }
        return newState;
    }
};
