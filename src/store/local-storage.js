import initialState from "./initial-state";

const DATE_TIME_PROPERTY_NAMES = ["updatedAt"];

export function loadState() {
    try {
        const serializedState = localStorage.getItem('state');
        if (serializedState === null) {
            throw new Error("No saved state found in local storage.");
        }

        let parsedState = deserializeStore(serializedState);

        validateStoreState(initialState, parsedState);

        console.log("Loaded saved state from local storage.");
        return parsedState;
    } catch (e) {
        console.log("Error when loading state from local storage: " + e.message);
        return initialState;
    }
};

let saveTime = new Date();
saveTime.setTime(saveTime.getTime() - 1000);
let saveScheduled = false;

export function saveState(store) {
    const save = () => {
        try {
            const state = store.getState();
            const serializedState = JSON.stringify(state);
            localStorage.setItem('state', serializedState);
            console.log("Saved state to local storage");
        } catch (e) {
            console.log("Error when saving state: " + e.message);
        } finally {
            saveTime = new Date();
            saveScheduled = false;
        }
    };

    // Write state to localStorage at most once per second
    let timeFromLastWrite = Date.now() - saveTime;

    if (timeFromLastWrite >= 1000) {
        save();
    } else if (!saveScheduled) {
        setTimeout(save, 1000 - timeFromLastWrite);
        saveScheduled = true;
    }
};

function validateStoreState(initialState, parsedState) {
    /*
        Validates the integrity of the state parsed from localStorage. 
        Non-empty sub-objects of initialState are recursively checked over the same criteria, as the state object itself.
        
        1. Checks if the property keys of initialState and parsedState are the same;
            1.1. If not, returns false;
        2. For each property key:
            2.1. If respective property type don't match, return false;
            2.2. If a property type is object, check that its prototypes match;
            2.3. If the property in the initialState is a non-empty object (and not an Array), it's checked recursively;
                2.3.1. If the check from 2.2.1 isn't passed, return false;
        3. If all properties are checked, return true.
    */

    let initialStateKeys = Object.keys(initialState).sort();
    let parsedStateKeys = Object.keys(parsedState).sort();
    // console.log("In validateStoreState, checking initial state: " + JSON.stringify(initialState));
    // console.log("initialStateKeys = " + initialStateKeys);
    // console.log("parsedStateKeys = " + parsedStateKeys);
    if (JSON.stringify(initialStateKeys) !== JSON.stringify(parsedStateKeys)) {
        throw new Error(`Initial and parsed state keys are different: [${initialStateKeys}] !== [${parsedStateKeys}]`);
    }

    for (let key of initialStateKeys) {
        if (typeof(initialState[key]) !== typeof(parsedState[key])) {
            throw new Error(`Type mismatch for the property "${key}"`);
            return false;
        }

        if (typeof(initialState[key]) === "object" && Object.getPrototypeOf(initialState[key]) !== Object.getPrototypeOf(parsedState[key])) {
            throw new Error(`Prototype mismatch for the property "${key}"`);
            return false;
        }
    }

    for (let key of initialStateKeys) {
        if (typeof(initialState[key]) === "object"
                // not an Array
                && [Array].reduce((prev, curr) => prev && !(initialState[key] instanceof curr))
                // not an empty object
                && Object.keys(initialState[key]).length > 0) { 
            let recursiveValidation = validateStoreState(initialState[key], parsedState[key]);
        }
    }

    return true;
}

function deserializeStore(serializedState) {
    return JSON.parse(serializedState, (k, v) => {
        // parse date strings into Date objects
        return DATE_TIME_PROPERTY_NAMES.includes(k) ? new Date(v) : v;
    });
}
