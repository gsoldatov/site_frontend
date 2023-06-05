import getInitialState from "./state-templates/initial-state";
import { defaultEditedObjectState } from "./state-templates/edited-object";
import { getDefaultAuthState } from "./state-templates/auth";

import debounce from "../util/debounce";
import { enumDebounceDelayRefreshMode } from "../util/enum-debounce-delay-refresh-mode";

import { getConfig } from "../config";


/**
 * Manages state loads and saves to the browser's local storage.
 * 
 * Accepts an optional `config` object with configuration override.
 * If omitted, uses configuration from the `config.json` file.
 * 
 * NOTE: `localStorageSaveTimeout` modification in config during runtime does not change the behaviour of existing instance.
 * To implement this, a new debounced function should be created on change, replacing the old one in the store subscriptions.
 */
export class LocalStorageManager {
    constructor(config) {
        this._config = config;

        this.previousState = getInitialState();

        this.loadState = this.loadState.bind(this);
        this.save = this.save.bind(this);

        this._authStateKeys = Object.keys(getDefaultAuthState());

        const { localStorageSaveTimeout } = this.getConfig();
        this.saveState = debounce(this.save, localStorageSaveTimeout, enumDebounceDelayRefreshMode.onCall);
    }

    /**
     * Returns a config object used by this instance
     * (passed as an argument or default app config)
     */
    getConfig() {
        return this._config || getConfig();
    }

    /**
     * Returns a copy of initial state populated with data saved in the localStorage.
     * Data from localStorage is being validated before load and is removed if validation failed.
     */
    loadState() {
        let state = getInitialState();
        // Exit if localStorage usage is disabled
        if (!this.getConfig().useLocalStorage) {
            this.log("useLocalStorage is set to false, returning default state");
            return state;
        }

        // Load auth info
        this.loadAuthInfo(state);

        // Load edited objects
        this.loadEditedObjects(state);

        // Update previousState and return state
        this.previousState = state;
        return state;
    }

    /**
     * Loads auth information into the `state` object.
     */
    loadAuthInfo(state) {
        try {
            let authInfo = getAuthInfo();

            // Save auth info if it was missing
            if (authInfo === null) {
                authInfo = getDefaultAuthState();
                setAuthInfo(authInfo);
            }

            // Add auth info to the state
            state.auth = authInfo;
            this.log(`Loaded auth information for ${authInfo.user_id > 0 ? "user " + authInfo.user_id : "anonymous"} from local storage.`);
        } catch(e) {
            this.log(`Error when loading auth info from local storage:\n` + e.message);
        }
    }

    /**
     * Loads edited objects from localStorage into the `state` object.
     */
    loadEditedObjects(state) {
        try {
            // Get list of saved edited objects
            const savedEditedObjects = getListOfSavedEditedObjects();
            const loadedEditedObjects = {}, deletedEditedObjects = new Set();

            // Try to load saved edited objects
            savedEditedObjects.forEach(objectID => {
                let editedObject = localStorage.getItem(getEditedObjectKey(objectID));
                if (editedObject === null) {
                    this.log(`Skipping load of invalid data from local storage for object "${objectID}"`);
                    deletedEditedObjects.add(objectID);
                    return;
                } else {
                    editedObject = deserializeData(editedObject);

                    try {
                        validateState(defaultEditedObjectState, editedObject);
                        loadedEditedObjects[objectID] = editedObject;
                    } catch(e) {
                        this.log(`Validation fail for object "${objectID}":\n` + e);
                        deletedEditedObjects.add(objectID);
                    }
                }
            });

            // Remove invalid edited objects from localStorage
            deletedEditedObjects.forEach(objectID => localStorage.removeItem(objectID));
            setListOfSavedEditedObjects(savedEditedObjects.filter(objectID => !deletedEditedObjects.has(objectID)));

            // Load edited objects into the state
            state.editedObjects = loadedEditedObjects;
            this.log(`Finished loading edited objects from local storage, loaded: ${Object.keys(loadedEditedObjects).length}, removed invalid: ${savedEditedObjects.length - Object.keys(loadedEditedObjects).length}`);
        } catch (e) {
            this.log("Error when loading edited objects from local storage:\n" + e.message);
        }
    }

    /**
     * Saves changes in auth info & edited objects to the localStorage.
     */
    save(store) {
        // Exit if localStorage usage is disabled
        if (!this.getConfig().useLocalStorage) {
            this.log("useLocalStorage is set to false, skipping state save");
            return;
        }

        const currentState = store.getState();

        this.saveAuthInfo(store);
        this.saveEditedObjects(store);

        // Update previous state
        this.previousState = currentState;
    }

    saveAuthInfo(store) {
        try {
            // Get current & previous state
            const currentState = store.getState(), previousState = this.previousState;

            for (let key of this._authStateKeys) {
                if (currentState.auth[key] != previousState.auth[key]) {
                    setAuthInfo(currentState.auth);
                    this.log("Saved auth information to the local storage.")
                    return;
                }
            }
            this.log("Auth information did not change.")
        } catch(e) {
            this.log("Error during auth information save:\n" + e.message);
        }
    }

    saveEditedObjects(store) {
        // Get current & previous state
        const currentState = store.getState(), previousState = this.previousState;

        // Exit if edited objects did not change
        if (currentState.editedObjects === previousState.editedObjects) {
            this.log("Edited objects did not change.");
            this.previousState = currentState;
            return;
        }

        let savedEditedObjects;
        let numberOfSavedObjects = 0, numberOfRemovedObjects = 0;

        try {
            // Get the list of saved edited objects
            savedEditedObjects = new Set(getListOfSavedEditedObjects());

            // Save modified objects from current state
            Object.keys(currentState.editedObjects).forEach(objectID => {
                if (currentState.editedObjects[objectID] !== previousState.editedObjects[objectID]) {
                    savedEditedObjects.add(objectID);
                    const serializedEditedObject = serializeData(currentState.editedObjects[objectID]);
                    localStorage.setItem(getEditedObjectKey(objectID), serializedEditedObject);
                    numberOfSavedObjects++;
                }
            });

            // Delete objects which were removed from current state (but are present in the previous state)
            Object.keys(previousState.editedObjects).forEach(objectID => {
                if (currentState.editedObjects[objectID] === undefined) {
                    savedEditedObjects.delete(objectID);
                    localStorage.removeItem(getEditedObjectKey(objectID));
                    numberOfRemovedObjects++;
                }
            });

            setListOfSavedEditedObjects(savedEditedObjects);
            this.log(`Saved state to local storage:\nSaved ${numberOfSavedObjects} edited objects, removed ${numberOfRemovedObjects} objects.`);
        } catch (e) {
            this.log("Error during edited objects save:\n" + e.message);
            // Try to save savedEditedObjects if error occured in the middle of the function execution
            try {
                if (savedEditedObjects) {
                    setListOfSavedEditedObjects(savedEditedObjects);
                    this.log(`Partially saved state to local storage:\nSaved ${numberOfSavedObjects} edited objects, removed ${numberOfRemovedObjects} objects.`);
                }
            } catch (e) {}
        }
    }

    log(msg) {
        if (this.getConfig().debugLogging) console.log(msg);
    }
};


/**
 * Returns a deserialized auth information saved in local storage.
 */
const getAuthInfo = () => {
    let authInfo = localStorage.getItem("authInfo");
    if (!authInfo) return null;
    else return deserializeData(authInfo);
};

/**
 * Saves `auth` object with auth info to the local storage.
 */
const setAuthInfo = auth => {
    localStorage.setItem("authInfo", serializeData(auth));
};


/**
 * Returns a localStorage key for the provided `objectID`.
 */
const getEditedObjectKey = objectID => `editedObject_${objectID}`;


/**
 * Returns a deserialized list of edited objects saved in local storage.
 */
const getListOfSavedEditedObjects = () => {
    let savedEditedObjects = localStorage.getItem("savedEditedObjects");
    if (!savedEditedObjects) return [];
    else return deserializeData(savedEditedObjects);
};


/**
 * Saves list of provided Array of edited objects into local storage.
 */
const setListOfSavedEditedObjects = savedEditedObjects => {
    if (savedEditedObjects instanceof Set) savedEditedObjects = new Array(...savedEditedObjects);
    if (!(savedEditedObjects instanceof Array)) throw TypeError("savedEditedObjects must be an Array or a Set.");
    localStorage.setItem("savedEditedObjects", serializeData(savedEditedObjects));
};


/**
 * Validates the integrity of the state parsed from local storage.
 * 
 * Non-empty sub-objects of expectedState are recursively checked over the same criteria, as the state object itself.
 * 
 * 1. Checks if the property keys of expectedState and parsedState are the same;
 * 
 *      1.1. If not, returns false;
 * 
 * 2. For each property key:
 * 
 *      2.1. If respective property type don't match, return false;
 * 
 *      2.2. If a property type is object, check that its prototypes match;
 * 
 *      2.3. If the property in the expectedState is a non-empty object (and not an Array), it's checked recursively;
 * 
 *          2.3.1. If the check from 2.2.1 isn't passed, return false;
 * 
 * 3. If all properties are checked, return true.
 */
const validateState = (expectedState, parsedState) => {
    let expectedStateKeys = Object.keys(expectedState).sort();
    let parsedStateKeys = Object.keys(parsedState).sort();
    if (JSON.stringify(expectedStateKeys) !== JSON.stringify(parsedStateKeys)) {
        throw new Error(`Initial and parsed state keys are different: [${expectedStateKeys}] !== [${parsedStateKeys}]`);
    }

    for (let key of expectedStateKeys) {
        if (typeof(expectedState[key]) !== typeof(parsedState[key])) {
            throw new Error(`Type mismatch for the property "${key}"`);
        }

        if (typeof(expectedState[key]) === "object" && Object.getPrototypeOf(expectedState[key]) !== Object.getPrototypeOf(parsedState[key])) {
            throw new Error(`Prototype mismatch for the property "${key}"`);
        }
    }

    for (let key of expectedStateKeys) {
        if (typeof(expectedState[key]) === "object"
                // not an Array
                && [Array].reduce((prev, curr) => prev && !(expectedState[key] instanceof curr))
                // not an empty object
                && Object.keys(expectedState[key]).length > 0) { 
            validateState(expectedState[key], parsedState[key]);
        }
    }

    return true;
}


/**
 * Deserializes provided `data` from local storage.
 */
const deserializeData = data => {
    return JSON.parse(data);
    // return JSON.parse(serializedState, (k, v) => {
    //     // parse date strings into Date objects
    //     return DATE_TIME_PROPERTY_NAMES.includes(k) ? new Date(v) : v;
    // });
};


/**
 * Serializes provided `data` into the format in which it will be stored in local storage.
 */
const serializeData = data => {
    return JSON.stringify(data);
};
