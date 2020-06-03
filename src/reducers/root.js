import tag from "./tag";

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
    "tag": tag
});

function root(state, action){
    let handler = typeof(action) === "object" 
        ? ACTION_HANDLERS[action.type] : 
        ACTION_HANDLERS[action];
    let newState = handler ? handler(state, action) : state;
    console.log("Finished dispatching action: " + action.type);
    console.log("New state is: " + JSON.stringify(newState));
    return newState;
}

export default root;
