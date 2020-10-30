const LOGGING_ORDER = ["tagUI", "tagsUI", "objectUI", "objectsUI", "tags", "objects", "links"]


export default (state, topLevelHeader) => {
   /*
        Function for formatted logging of the state into the console.
        Prints top-level parts of the state set in the LOGGING_ORDER list, then prints the rest of the state.
    */
    const log = (state, header, isTopLevel = false) => {
        let oneLine = true;
        if (typeof(state) === "object") {
            if (state instanceof Array) {
                for (let item of state) {
                    if (typeof(item) === "object") {
                        oneLine = false;
                        break;
                    }
                }
            } else {
                for (let item of Object.values(state)) {
                    if (typeof(item) === "object") {
                        oneLine = false;
                        break;
                    }
                }
            }
        }

        if (oneLine) {
            console.log(`${header}: ${JSON.stringify(state)}`);
        } else {
            console.groupCollapsed(header);
            if (typeof(state) === "object") {
                if (state instanceof Array) {
                    for (let item in state) {
                        log(state[item], item);
                    }
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
