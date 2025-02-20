import { debounce } from "../util/debounce";

import { getConfig, addCallback } from "../config";

import { getInitialState, type State } from "../types/store/state";
import { getDefaultAuthState, auth } from "../types/store/data/auth";
import { editedObjects } from "../types/store/data/edited-objects";

import type { AppConfig } from "../types/config";
import type { AppStore } from "../types/store/store";
import type { SavedAppState } from "../types/local-storage-manager";


/**
 * Manages state loads and saves to the browser's local storage.
 * 
 * NOTE: save state timeout can be updated for an instance of this class via config changing functions, but not directly.
 */
export class LocalStorageManager {
    previousState: State

    constructor() {
        this.previousState = getInitialState();

        this.loadInitialState = this.loadInitialState.bind(this);
        this._saveState = this._saveState.bind(this);

        // Set up debounced save state function and its update on config updates
        this.setOnStateChangeCallback(getConfig());
        this.setOnStateChangeCallback = this.setOnStateChangeCallback.bind(this);
        addCallback(this.setOnStateChangeCallback);
    }

    /** Declaration of a callback run on store change, which is overwritten in constructor & on app config change. */
    onStateChangeCallback(store: AppStore) {}

    /** Assigns a new debounced state saving function to `this.onStateChangeCallback`. */
    setOnStateChangeCallback(config: AppConfig) {
        const { localStorageSaveTimeout } = config;
        this.onStateChangeCallback = debounce(this._saveState, localStorageSaveTimeout, "onCall");
    }

    /** Returns initial app state for a Redux store, populated with data saved in the `localStorage`. */
    loadInitialState() {
        const state = getInitialState();
        // Exit if localStorage usage is disabled
        if (!getConfig().useLocalStorage) {
            this.log("useLocalStorage is set to false, returning default state.");
            return state;
        }

        // Get saved state
        const savedState = this._loadState();

        // Add auth to state
        try {
            state.auth = auth.parse(savedState.auth);
            this.log(`Loaded saved auth state for ${state.auth.user_id > 0 ? "user " + state.auth.user_id : "anonymous"}.`)
        } catch(e) {
            this.warn("Failed to validate auth state, loading default values.");
            this.warn(e as unknown as string);
            state.auth = getDefaultAuthState();
        }

        // Add edited objects to state
        try {
            state.editedObjects = editedObjects.parse(savedState.editedObjects);

            const loadedEO = Object.keys(state.editedObjects).map(id => parseInt(id));
            this.log(loadedEO.length > 0 ? `Loaded saved edited objects: ${loadedEO}.` : "No objects were loaded.");
        } catch(e) {
            this.warn("Failed to validate edited objects.");
            this.warn(e as unknown as string);
        }

        // Update previousState and return state
        this.previousState = state;
        return state;
    }

    /** Returns saved state from `localStorage` or an empty object, if it's absent or corrupted. */
    _loadState(): Partial<SavedAppState> {
        try {
            const savedState = localStorage.getItem("appState");
            if (!savedState) this.warn("App state was not saved in localStorage.");
            return (JSON.parse(savedState!) || {}) as SavedAppState;
        } catch (e) {
            if (e instanceof SyntaxError) {
                this.warn("Failed to parse saved state.");
                this.warn(e as unknown as string);
                return {};
            } else throw e;
        }
    }

    /** Saves changes in auth info & edited objects to the `localStorage`. */
    _saveState(store: AppStore) {
        // Exit if `localStorage` usage is disabled
        if (!getConfig().useLocalStorage) {
            this.log("useLocalStorage is set to false, skipping state save.");
            return;
        }

        const currentState = store.getState();
        
        // Clear obsolete keys
        Object.keys(localStorage).forEach(key => {
            for (let pattern of [/^savedEditedObjects$/, /^editedObject_([-]?\d+)$/, /^authInfo$/])
                if (key.match(pattern)) {
                    localStorage.removeItem(key);
                    return;
                }
        });

        // Save state
        const { auth, editedObjects } = currentState;
        if (this.previousState.auth !== auth || this.previousState.editedObjects !== editedObjects) {
            localStorage.setItem("appState", JSON.stringify({ auth, editedObjects }));
            this.log("Saved state to localStorage.");
            const prevEO = Object.keys(this.previousState.editedObjects).map(id => parseInt(id));
            const currEO = Object.keys(editedObjects).map(id => parseInt(id));
            const remEO = prevEO.filter(id => !currEO.includes(id));
            this.log(`Current edited objects: ${JSON.stringify(currEO)}`);
            this.log(`Removed edited objects: ${JSON.stringify(remEO)}`);
        } else {
            this.log("State did not change since last save.");
        }

        // Update previous state
        this.previousState = currentState;
    }

    log(msg: string) {
        if (getConfig().debugLogging) console.log(msg);
    }

    warn(msg: string) {
        if (getConfig().debugLogging) console.warn(msg);
    }
};
