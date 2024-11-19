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

    /** Returns a list with current & added existing tag IDs. */
    static existingTagIDs(state: State) {
        return existingTagIDsSelector(state);
    }

    /** Returns a map between matching tag IDs and their names. */
    static matchingTagIDsName(state: State) {
        return matchingTagIDsNames(state);
    }

    /** Returns a boolean indicating if drag and drop is enabled for an edited to-do list with `objectID`. */
    static toDoListDragAndDropEnabled(state: State, objectID: number) {
        return !ObjectsEditSelectors.isFetching(state) 
            && ObjectsEditSelectors.editedOrDefaultSelector(objectID)(state).toDoList.sort_type === "default";
    }
}


/**
 * Returns memoized list with current & added existing tag IDs.
 */
export const existingTagIDsSelector = createSelector(
    (state: State) => ObjectsEditSelectors.currentObject(state).currentTagIDs,
    (state: State) => ObjectsEditSelectors.currentObject(state).addedTags,
    (currentTagIDs, addedTags) => currentTagIDs.concat(
        addedTags.filter(tag => typeof(tag) === "number")
    )
);


/**
 * Returns an object, which maps current matching tag IDs to their names for the new tag input dropdown option list.
 */
export const matchingTagIDsNames = createSelector(
    (state: State) => state.objectsEditUI.tagsInput.matchingIDs,
    (state: State) => state.tags,
    (matchingTagIDs, tagsStore) => matchingTagIDs.reduce((result, tagID) => {
        result[tagID] = tagsStore[tagID].tag_name;
        return result; 
    }, {} as Record<number, string>)
);
