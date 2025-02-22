import { debounce } from "../util/debounce";

import { getConfig, addCallback } from "../config";

import { EditedObjectsSelectors } from "./selectors/data/objects/edited-objects";
import { setNewState } from "../reducers/common";

import { getInitialState, type State } from "../types/store/state";
import { getAuthState, auth } from "../types/store/data/auth";
import { EditedObjects, editedObjects } from "../types/store/data/edited-objects";

import type { AppConfig } from "../types/config";
import type { AppStore } from "../types/store/store";
import { savedAppState, type SavedAppState } from "../types/local-storage-manager";


const appStateKey = "appState";


/**
 * Manages state loads and saves to the browser's local storage.
 * 
 * NOTE: save state timeout can be updated for an instance of this class via config changing functions, but not directly.
 */
export class LocalStorageManager {
    store?: AppStore
    previousState: State

    /**
     * Forces `_saveState` to exit without saving on its next call.
     * 
     * This variable is set to true, when app state is modified in `storageEventHandler`
     * to avoid triggering a storage event with those changes (since they are or will be synced anyway).
     */
    skipNextSave: boolean

    constructor() {
        this.previousState = getInitialState();
        this.skipNextSave = false;

        this.loadInitialState = this.loadInitialState.bind(this);
        this._saveState = this._saveState.bind(this);

        // Set up debounced save state function and its update on config updates
        this.setOnStateChangeCallback(getConfig());
        this.setOnStateChangeCallback = this.setOnStateChangeCallback.bind(this);
        addCallback(this.setOnStateChangeCallback);

        // Add a `storage` event listener to sync with other tabs
        this.storageEventHandler = this.storageEventHandler.bind(this);
        window.addEventListener('storage', this.storageEventHandler);
    }

    /** Returns initial app state for a Redux store, populated with data saved in the `localStorage`. */
    loadInitialState() {
        const state = getInitialState();
        // Exit if localStorage usage is disabled
        if (!getConfig().useLocalStorage) {
            this._log("useLocalStorage is set to false, returning default state.");
            return state;
        }

        // Get saved state
        const savedState = this._loadState();

        // Add auth to state
        try {
            state.auth = auth.parse(savedState.auth);
            this._log(`Loaded saved auth state for ${state.auth.user_id > 0 ? "user " + state.auth.user_id : "anonymous"}.`)
        } catch(e) {
            this._warn("Failed to validate auth state, loading default values.");
            this._warn(e as unknown as string);
            state.auth = getAuthState();
        }

        // Add edited objects to state
        try {
            state.editedObjects = editedObjects.parse(savedState.editedObjects);

            const loadedEO = Object.keys(state.editedObjects).map(id => parseInt(id));
            this._log(loadedEO.length > 0 ? `Loaded saved edited objects: ${loadedEO}.` : "No objects were loaded.");
        } catch(e) {
            this._warn("Failed to validate edited objects.");
            this._warn(e as unknown as string);
        }

        // Update previousState and return state
        this.previousState = state;
        return state;
    }

    /** Returns saved state from `localStorage` or an empty object, if it's absent or corrupted. */
    _loadState(): Partial<SavedAppState> {
        try {
            const savedState = localStorage.getItem(appStateKey);
            if (!savedState) this._warn("App state was not saved in localStorage.");
            return (JSON.parse(savedState!) || {}) as SavedAppState;
        } catch (e) {
            if (e instanceof SyntaxError) {
                this._warn("Failed to parse saved state.");
                this._warn(e as unknown as string);
                return {};
            } else throw e;
        }
    }
    
    /** Callback, which is run on `storage` event of window (localStorage changes made in other tabs). */
    storageEventHandler(event: StorageEvent) {
        // Exit if localStorage usage is disabled
        if (!getConfig().useLocalStorage) {
            this._log("useLocalStorage is set to false, returning default state.");
            return;
        }
        if (this.store === undefined) throw Error("store instance is not set.");

        if (event.storageArea === localStorage) {
            // Exit, if another key was modified
            if (event.key !== appStateKey) return;

            this._log("Loading modified app state from localStorage.")

            try {
                // Validate new saved state
                const savedState = savedAppState.parse(JSON.parse(event.newValue!));
                const { auth, editedObjects } = savedState;

                // Reload page, if access token changed
                if (auth.access_token !== this.store.getState().auth.access_token) {
                    this._log("Access token changed, reloading page.");
                    _reloadPage();
                    return;
                }

                // Check if all objects displayed on /objects/edit/:id page are present
                if (location.pathname.match(/^\/objects\/edit\/(new|[-]?\d+)/)) {
                    const state = this.store.getState();
                    const { currentObjectID } = state.objectsEditUI;
                    const currentEditedObjectsAndSubobjects = EditedObjectsSelectors.objectAndSubobjectIDs(state, [currentObjectID], false);
                    const newStateEditedObjectIDs = Object.keys(editedObjects).map(id => parseInt(id));
                    const missingEditedObjectIDs = currentEditedObjectsAndSubobjects.filter(id => !newStateEditedObjectIDs.includes(id));

                    if (missingEditedObjectIDs.length > 0) {
                        this._log(`Displayed edited objects are no longer present in state: ${JSON.stringify(missingEditedObjectIDs)}`);
                        location.replace("/");
                        return;
                    }
                }

                // Update state with data read from `localStorage`
                // & set next save to be skipped to avoid cascade event triggering
                this.skipNextSave = true;
                const previousEditedObjects = this.store.getState().editedObjects;
                this.store.dispatch(setNewState({ ...this.store.getState(), auth, editedObjects }));
                this._log("Finished loading modified app state from localStorage.")
                this._logEditedObjectChanges(editedObjects, previousEditedObjects);

                // Update previous state
                this.previousState = this.store.getState();

            } catch (e) {
                // Set new state & hard reload the page, if new state validation failed
                localStorage.setItem(appStateKey, event.newValue!);
                _reloadPage();
                this._log("Failed to validate new saved state.");
                this._log(e as unknown as string);
            }
        }
    }

    /** Declaration of a callback run on store change, which is overwritten in constructor & on app config change. */
    onStateChangeCallback(store: AppStore) {}

    /** Assigns a new debounced state saving function to `this.onStateChangeCallback`. */
    setOnStateChangeCallback(config: AppConfig) {
        const { localStorageSaveTimeout } = config;
        this.onStateChangeCallback = debounce(this._saveState, localStorageSaveTimeout, "onCall");
    }

    /** Saves changes in auth info & edited objects to the `localStorage`. */
    _saveState(store: AppStore) {
        // Exit if `localStorage` usage is disabled
        if (!getConfig().useLocalStorage) {
            this._log("useLocalStorage is set to false, skipping state save.");
            return;
        }

        // Exit, if state was changed by `storage` event handler
        if (this.skipNextSave) {
            this._log(`Skipping current state save.`);
            this.skipNextSave = false;
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
            localStorage.setItem(appStateKey, JSON.stringify({ auth, editedObjects }));
            this._log("Saved state to localStorage.");
            this._logEditedObjectChanges(editedObjects, this.previousState.editedObjects);
        } else {
            this._log("State did not change since last save.");
        }

        // Update previous state
        this.previousState = currentState;
    }

    _log(msg: string) {
        if (getConfig().debugLogging) console.log(msg);
    }

    _warn(msg: string) {
        if (getConfig().debugLogging) console.warn(msg);
    }

    _logEditedObjectChanges(curr: EditedObjects, prev: EditedObjects) {
        const currEO = Object.keys(curr).map(id => parseInt(id));
        const prevEO = Object.keys(prev).map(id => parseInt(id));
        const remEO = prevEO.filter(id => !currEO.includes(id));
        this._log(`Current edited objects: ${JSON.stringify(currEO)}`);
        this._log(`Removed edited objects: ${JSON.stringify(remEO)}`);
    }
};


const _reloadPage = () => {
    // @ts-ignore "true" is set for reload ignoring cache & supported only in Firefox
    location.reload(true);
};
