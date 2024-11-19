import { createSelector } from "reselect";

import { getEditedObjectState } from "../../types/data/edited-objects";
import type { State } from "../../types/state";


export class ObjectsEditSelectors {
    /**
     * Returns current edited object's state.
     * If current edited object is not loaded into `state.editedObjects`, returns default edited object state
     * (required as a fallback for some components, which access the state before its loaded).
     */
    static currentObject(state: State) {
        return state.editedObjects[state.objectsEditUI.currentObjectID] || getEditedObjectState();
    }

    /** Returns a selector for an edited object's or default state. */
    static editedOrDefaultSelector(objectID: number) {
        return (state: State) => state.editedObjects[objectID] || getEditedObjectState();
    }

    /** Returns a boolean indicating if there is an ongoing fetch. */
    static isFetching(state: State) {
        return state.objectsEditUI.loadFetch.isFetching || state.objectsEditUI.saveFetch.isFetching;
    }

    /** Returns a boolean indicating if there is an ongoing fetch, or a load fetch failed. */
    static isFetchingOrLoadFailed(state: State) {
        return ObjectsEditSelectors.isFetching(state) || state.objectsEditUI.loadFetch.fetchError;
    }

    /** Returns a set containing provided `objectIDs` and IDs of all their subobjects found in state.editedObjects. */
    static objectAndSubobjectIDs(state: State, objectIDs: (number | string)[]) {
        const objectAndSubobjectIDs = new Set(objectIDs.map(objectID => parseInt(objectID as string)));
        objectAndSubobjectIDs.forEach(objectID => {
            const editedObject = state.editedObjects[objectID];
            if (editedObject !== undefined && editedObject.object_type === "composite")
                Object.keys(editedObject.composite.subobjects).forEach(objectID => objectAndSubobjectIDs.add(parseInt(objectID)));
        });
    
        return objectAndSubobjectIDs;
    };
}
