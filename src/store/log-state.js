const LOGGING_ORDER = [
    "auth",
    "users",
    "tags",
    
    "objects",
    "objectsTags",
    "links",
    "markdown",
    "toDoLists",
    "composite",

    "editedObjects",

    "tagsEditUI",
    "tagsListUI",
    "objectsEditedUI",
    "objectsListUI",
    "objectsEditUI",
    
    "modalUI",
    "navigationUI"
];


/**
 * Function for formatted logging of the state into the console.
 * 
 * Prints top-level parts of the state set in the LOGGING_ORDER list, then prints the rest of the state.
 */
export default (state, topLevelHeader) => {
    const log = (state, header, isTopLevel = false) => {
        let oneLine = true;
        if (typeof(state) === "object" && state !== null) {
            if (state instanceof Array || state instanceof Set) {
                for (let item of state) {
                    if (typeof(item) === "object") {
                        oneLine = false;
                        break;
                    }
                }
            } else {
                for (let item of Object.values(state)) {
                    if (typeof(item) === "object" && item !== null) {
                        oneLine = false;
                        break;
                    }
                }
            }
        }

        if (oneLine) {
            const headerText = header ? `${header}: ` : "";
            if (state instanceof Set) console.log(headerText + `<${[...state.values()].join(", ")}>`);
            else console.log(headerText + `${JSON.stringify(state)}`);
        } else {
            console.groupCollapsed(header);
            if (typeof(state) === "object") {
                if (state instanceof Array) {
                    for (let item in state) {
                        log(state[item], item);
                    }
                } else if (state instanceof Set) {
                    for (let item of state.values())
                        log(item, undefined);
                } else {
                    let keys = isTopLevel ? topLeveLoggingOrder : Object.keys(state);
                    for (let key of keys) {
                        log(state[key], key);
                    }
                }
            }
            console.groupEnd();
        }
    }

    let topLeveLoggingOrder = [...LOGGING_ORDER, ...Object.keys(state).filter(k => LOGGING_ORDER.indexOf(k) === -1)];
    log(state, topLevelHeader, true);
 };
 