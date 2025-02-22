import { act } from "@testing-library/react";

import { fireEvent, waitFor } from "@testing-library/dom";
import { savedAppState, type SavedAppState } from "../../src/types/local-storage-manager";
import { type EditedObjects, type EditedObject } from "../../src/types/store/data/edited-objects";
import { type Auth } from "../../src/types/store/data/auth";
import { getBackend } from "../_mock-backend/mock-backend";


const appStateKey = "appState";

type LocalStorageStateUpdate = {
    auth?: Auth,
    editedObjects?: EditedObjects
}


export class LocalStorageTestUtils {
    /** Returns validated app state, saved in `localStorage`, or an empty object. */
    static loadSavedState(): Partial<SavedAppState> {
        const savedState = localStorage.getItem(appStateKey);
        if (savedState === null) return {};
        return savedAppState.parse(JSON.parse(savedState));
    }

    /** Returns a validated edited object with `objectID`, saved in `localStorage`, or `undefined`. */
    static getEditedObject(objectID: number): EditedObject | undefined {
        const state = LocalStorageTestUtils.loadSavedState();
        return ("editedObjects" in state) ? state.editedObjects[objectID]: undefined;
    }

    /** Returns `true`, if `objectID` is present in the `localStorage`, of `false`, otherwise. */
    static editedObjectIsSaved(objectID: number) {
        const state = LocalStorageTestUtils.loadSavedState();
        if (!("editedObjects" in state)) return false;
        return objectID in state.editedObjects;
    }

    /** Waits for each ID from `objectIDs` to be present in the `localStorage`. */
    static async waitForSavedObjectIDs(objectIDs: number[]) {
        await waitFor(() => {
            for (let objectID of objectIDs) {
                expect(LocalStorageTestUtils.editedObjectIsSaved(objectID)).toBeTruthy();
            }
        });
    }

    /** Waits for each ID from `objectIDs` to be absent in the `localStorage`. */
    static async waitForAbsentObjectIDs(objectIDs: number[]) {
        await waitFor(() => {
            for (let objectID of objectIDs) {
                expect(LocalStorageTestUtils.editedObjectIsSaved(objectID)).toBeFalsy();
            }
        });
    }

    /** Waits for saved auth state to be equal to `expectedAuthInfo`. */
    static async waitForAuthInfo(expectedAuthInfo: Auth) {
        await waitFor(() => {
            const state = LocalStorageTestUtils.loadSavedState();
            expect(state.auth).toMatchObject(expectedAuthInfo);
            expect(expectedAuthInfo).toMatchObject(state.auth!);
        });
    }

    /**
     * Updates or adds a new app state with provided `auth` & `editedObjects` in the localStorage.
     * 
     * Adds default values (anonymous auth info & empty edited objects store),
     * if corresponding values were not provided or saved earlier in the state.
     */
    static updateLocalStorageState({ auth, editedObjects }: LocalStorageStateUpdate) {
        const backend = getBackend();

        let newSavedState = JSON.parse(localStorage.getItem(appStateKey) || "{}");
        
        // Set default values, if no saved was saved before
        newSavedState = { 
            auth: auth || backend.data.generator.auth.frontendAuth(),
            editedObjects: {},
            ...newSavedState
        };
        
        // Add provided custom values
        if (auth !== undefined) newSavedState = { ...newSavedState, auth };
        if (editedObjects !== undefined) newSavedState = { ...newSavedState, editedObjects };

        localStorage.setItem(appStateKey, JSON.stringify(newSavedState));
    }

    /**
     * Updates `localStorage` & fires a mock `storage` window event.
     */
    static mockStorageEvent(customSavedState: LocalStorageStateUpdate) {
        // Update localStorage
        LocalStorageTestUtils.updateLocalStorageState(customSavedState);

        // Fire a mock event
        act(() => {
            fireEvent(
                window,
                new StorageEvent('storage', {
                    key: appStateKey,
                    storageArea: localStorage,
                    newValue: localStorage.getItem(appStateKey)
                })
            );
        });
    }
}
