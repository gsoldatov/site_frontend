import logState from "../store/log-state";

import { authRoot } from "./data/auth";
import { usersRoot } from "./data/users";
import { tagsRoot } from "./data/tags";
import { objectsTagsRoot } from "./data/objects-tags";
import { objectsRoot } from "./data/objects";
import { editedObjectsRoot } from "./data/edited-objects";

import { commonRoot } from "./common";
import { modalRoot } from "./ui/modal";
import { navigationRoot } from "./ui/navigation";
import { tagsEditRoot } from "./ui/tags-edit";
import { tagsListRoot } from "./ui/tags-list";
import objectEdit from "./objects-edit";
import objectsList from "./objects-list";
import { objectsListRoot } from "./ui/objects-list";
import { objectsEditedRoot } from "./ui/objects-edited";

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
    usersRoot,
    tagsRoot,
    objectsTagsRoot,
    objectsRoot,
    editedObjectsRoot,
    
    commonRoot, 
    modalRoot,
    navigationRoot,
    tagsListRoot,
    tagsEditRoot,
    objectEdit,
    objectsList,
    objectsListRoot,
    objectsEditedRoot 
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
