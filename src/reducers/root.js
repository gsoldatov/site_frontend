import logState from "../store/log-state";

import { authRoot } from "./data/auth";
import dataTags from "./data-tags";
import { objectsTagsRoot } from "./data/objects-tags";
import dataObjects from "./data-objects";
import { usersRoot } from "./data/users";

import { commonRoot } from "./common";
import { modalRoot } from "./ui/modal";
import { navigationRoot } from "./ui/navigation";
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


const ACTION_HANDLERS = getActionHandlers({ 
    authRoot,
    dataTags,
    objectsTagsRoot,
    dataObjects,
    usersRoot, 
    
    commonRoot, 
    modalRoot,
    navigationRoot,
    tag,
    tags,
    objectEdit,
    objectsList,
    objectsEdited 
});


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
