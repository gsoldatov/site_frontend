import logState from "../store/log-state";

import dataTags from "./data-tags";
import dataObjects from "./data-objects";
import dataUsers from "./data-users";

import auth from "./auth";
import common from "./common";
import tag from "./tag";
import tags from "./tags";
import objectEdit from "./objects-edit";
import objects from "./objects";
import editedObjects from "./edited-objects";

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

const ACTION_HANDLERS = getActionHandlers({ dataTags, dataObjects, dataUsers, auth, common, tag, tags, objectEdit, objects, editedObjects });

export default function getRootReducer (enableDebugLogging) {
    return (state, action) => {
        let handler = typeof(action) === "object" 
            ? ACTION_HANDLERS[action.type] : 
            ACTION_HANDLERS[action];
        let newState = handler ? handler(state, action) : state;
        if (enableDebugLogging) {
            logState(newState, `Finished dispatching action ${action.type}, new state:`);
        }
        return newState;
    }
};
