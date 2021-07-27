import getInitialState from "./state-templates/initial-state";
import intervalWrapper from "../util/interval-wrapper";
import { defaultEditedObjectState } from "./state-templates/edited-object";


/**
 * Manages state loads and saves to the browser's local storage.
 */
export class LocalStorageManager {
    constructor({ useLocalStorage, enableDebugLogging, saveTimeout }) {
        this.useLocalStorage = useLocalStorage;
        this.enableDebugLogging = enableDebugLogging;

        this.previousState = getInitialState();

        this.loadState = this.loadState.bind(this);
        this.save = this.save.bind(this);

        this.saveState = intervalWrapper(this.save, saveTimeout, false);
    }

    /**
     * Returns a copy of initial state populated with data saved in the localStorage.
     * Data from localStorage is being validated before load and is removed if validation failed.
     */
    loadState() {
        let state = getInitialState();
        // Exit if localStorage usage is disabled
        if (!this.useLocalStorage) {
            this.log("useLocalStorage is set to false, returning default state");
            return state;
        }

        try {
            // Get list of saved edited objects
            const savedEditedObjects = getListOfSavedEditedObjects();
            const loadedEditedObjects = [], deletedEditedObjects = new Set();

            // Try to load saved edited objects
            savedEditedObjects.forEach(objectID => {
                let editedObject = localStorage.getItem(getEditedObjectKey(objectID));
                if (editedObject === null) {
                    this.log(`Skipping load of invalid data from localStorage for object "${objectID}"`);
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
            this.log(`Finished loading edited objects from state, loaded: ${loadedEditedObjects.length}, removed invalid: ${savedEditedObjects.length - loadedEditedObjects.length}`);
        } catch (e) {
            this.log("Error when loading state from local storage:\n" + e.message);
        }

        // Update previousState and return state
        this.previousState = state;
        return state;
    };

    /**
     * Saves changed edited objects to the localStorage.
     */
    save(store) {
        // Exit if localStorage usage is disabled
        if (!this.useLocalStorage) {
            this.log("useLocalStorage is set to false, skipping state save");
            return;
        }

        // Get current & previous state
        const currentState = store.getState(), previousState = this.previousState;

        // Exit if edited objects did not change
        if (currentState.editedObjects === previousState.editedObjects) {
            this.log("Edited objects did not change, exiting save function");
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
            this.log("Error during state save:\n" + e.message);
            // Try to save savedEditedObjects if error occured in the middle of the function execution
            try {
                if (savedEditedObjects) {
                    setListOfSavedEditedObjects(savedEditedObjects);
                    this.log(`Partially saved state to local storage:\nSaved ${numberOfSavedObjects} edited objects, removed ${numberOfRemovedObjects} objects.`);
                }
            } catch (e) {}
        } finally {
            // Update previous state
            this.previousState = currentState;
        }
    }

    log(msg) {
        if (this.enableDebugLogging) console.log(msg);
    }
};


/**
 * Returns a localStorage key for the provided `objectID`.
 */
const getEditedObjectKey = objectID => `editedObject_${objectID}`;


/**
 * Returns a deserialized list of edited objects saved in localStorage.
 */
const getListOfSavedEditedObjects = () => {
    let savedEditedObjects = localStorage.getItem("savedEditedObjects");
    if (!savedEditedObjects) return [];
    else return deserializeData(savedEditedObjects);
};


/**
 * Saves list of provided Array of edited objects into localStorage
 */
const setListOfSavedEditedObjects = savedEditedObjects => {
    if (savedEditedObjects instanceof Set) savedEditedObjects = new Array(...savedEditedObjects);
    if (!(savedEditedObjects instanceof Array)) throw TypeError("savedEditedObjects must be an Array or a Set.");
    localStorage.setItem("savedEditedObjects", serializeData(savedEditedObjects));
};


/**
 * Validates the integrity of the state parsed from localStorage.
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
 * Deserializes provided `data` from localStorage.
 */
const deserializeData = data => {
    return JSON.parse(data);
    // return JSON.parse(serializedState, (k, v) => {
    //     // parse date strings into Date objects
    //     return DATE_TIME_PROPERTY_NAMES.includes(k) ? new Date(v) : v;
    // });
};


/**
 * Serializes provided `data` into the format in which it will be stored in localStorage.
 */
const serializeData = data => {
    return JSON.stringify(data);
};
