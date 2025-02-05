import { debounce } from "../util/debounce";

import { getConfig, addCallback } from "../config";

import type { AppConfig } from "../util/types/config";
import type { AppStore } from "./types/store";
import { getInitialState, type State } from "./types/state";
import { editedObject, type EditedObjects } from "./types/data/edited-objects";
import { getDefaultAuthState, auth, type Auth } from "./types/data/auth";


/**
 * Manages state loads and saves to the browser's local storage.
 * 
 * NOTE: save state timeout can be updated for an instance of this class via config changing functions, but not directly.
 */
export class LocalStorageManager {
    previousState: State

    constructor() {
        this.previousState = getInitialState();

        this.loadState = this.loadState.bind(this);
        this.save = this.save.bind(this);

        // Set up debounced save state function and its update on config updates
        this.setSaveState(getConfig());
        this.setSaveState = this.setSaveState.bind(this);
        addCallback(this.setSaveState);
    }

    /** Stub method, which is overwritten in constructor */
    saveState(store: AppStore) {}

    /**
     * Assigns a new debounced state saving function to `this.saveState`
     */
    setSaveState(config: AppConfig) {
        const { localStorageSaveTimeout } = config;
        this.saveState = debounce(this.save, localStorageSaveTimeout, "onCall");
    }

    /**
     * Returns a copy of initial state populated with data saved in the localStorage.
     * Data from localStorage is being validated before load and is removed if validation failed.
     */
    loadState() {
        let state = getInitialState();
        // Exit if localStorage usage is disabled
        if (!getConfig().useLocalStorage) {
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
    loadAuthInfo(state: State) {
        const savedAuthInfo = localStorage.getItem("authInfo");
        if (savedAuthInfo === null) {
            state.auth = getDefaultAuthState();
            this.log(`No saved auth state found, loaded default values.`);
            setAuthInfo(state.auth);
        } else {
            try {
                state.auth = auth.parse(JSON.parse(savedAuthInfo));
                this.log(`Loaded auth state for ${state.auth.user_id > 0 ? "user " + state.auth.user_id : "anonymous"}.`)
            } catch(e) {
                this.warn(`Failed to load auth state, loading default values:\n` + e);
                state.auth = getDefaultAuthState();
                setAuthInfo(state.auth);
            }
        }
    }

    /**
     * Loads edited objects from localStorage into the `state` object.
     */
    loadEditedObjects(state: State) {
        const loadedEditedObjects: EditedObjects = {}, invalidObjectKeys: Set<string> = new Set();

        Object.keys(localStorage).forEach(key => {
            // Skip, if an item is not an edited object
            const match = key.match(editedObjectKeyRegex);
            if (match === null) return;
            
            // Validate edited object
            const objectID = parseInt(match[1]);
            const savedEditedObject = localStorage.getItem(key);

            try {
                loadedEditedObjects[objectID] = editedObject.parse(JSON.parse(savedEditedObject!));
            } catch(e) {
                this.warn(`Validation fail for object "${objectID}":\n` + e);
                invalidObjectKeys.add(key);
            }
        });

        // Clear invalid edited objects
        invalidObjectKeys.forEach(key => localStorage.removeItem(key));

        // Add valid edited objects to the state
        state.editedObjects = loadedEditedObjects;
        this.log("Finished loading edited objects from local storage," +
            `loaded: ${Object.keys(loadedEditedObjects).length},` +
            `removed invalid: ${invalidObjectKeys.size}`);
    }

    /**
     * Saves changes in auth info & edited objects to the localStorage.
     */
    save(store: AppStore) {
        // Exit if localStorage usage is disabled
        if (!getConfig().useLocalStorage) {
            this.log("useLocalStorage is set to false, skipping state save");
            return;
        }

        const currentState = store.getState();
        
        // Clear obsolete keys
        ["savedEditedObjects"].forEach(key => localStorage.removeItem(key));

        this.saveAuthInfo(store);
        this.saveEditedObjects(store);

        // Update previous state
        this.previousState = currentState;
    }

    saveAuthInfo(store: AppStore) {
        const auth = store.getState().auth;

        if (auth !==  this.previousState.auth) {
            setAuthInfo(auth);
            this.log("Saved auth state to the local storage.")
        }
        else this.log("Auth state did not change.");
    }

    saveEditedObjects(store: AppStore) {
        // Exit if edited objects did not change
        const editedObjects = store.getState().editedObjects;
        const prevEditedObjects = this.previousState.editedObjects
        if (editedObjects === prevEditedObjects) {
            this.log("Edited objects did not change.");
            return;
        }

        // Save modified edited objects
        let numberOfSavedObjects = 0, numberOfRemovedObjects = 0;
        Object.keys(editedObjects).map(id => parseInt(id)).forEach(objectID => {
            const editedObject = editedObjects[objectID];
            if (editedObject !== prevEditedObjects[objectID]) {
                const serializedEditedObject = JSON.stringify(editedObject);
                localStorage.setItem(getEditedObjectKey(objectID), serializedEditedObject);
                numberOfSavedObjects++;
            }
        });

        // Delete edited objects, no longer present in state
        Object.keys(prevEditedObjects).map(id => parseInt(id)).forEach(objectID => {
            if (editedObjects[objectID] === undefined) {
                localStorage.removeItem(getEditedObjectKey(objectID));
                numberOfRemovedObjects++;
            }
        });

        this.log("Saved state to local storage:" +
            `\nSaved ${numberOfSavedObjects} edited objects,` +
            ` removed ${numberOfRemovedObjects} objects.`);
    }

    log(msg: string) {
        if (getConfig().debugLogging) console.log(msg);
    }

    warn(msg: string) {
        if (getConfig().debugLogging) console.warn(msg);
    }
};


/**
 * Saves `auth` object with auth info to the local storage.
 */
const setAuthInfo = (auth: Auth) => {
    localStorage.setItem("authInfo", JSON.stringify(auth));
};


/**
 * Returns a localStorage key for the provided `objectID`.
 */
const getEditedObjectKey = (objectID: string | number) => `editedObject_${objectID}`;
const editedObjectKeyRegex = /^editedObject_(\d+)$/;
