import { waitFor } from "@testing-library/dom";
import { savedAppState, type SavedAppState } from "../../src/types/local-storage-manager";
import { type EditedObject } from "../../src/types/store/data/edited-objects";
import { type Auth } from "../../src/types/store/data/auth";


export class LocalStorageTestUtils {
    /** Returns validated app state, saved in `localStorage`, or an empty object. */
    static loadSavedState(): Partial<SavedAppState> {
        const savedState = localStorage.getItem("appState");
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
}
