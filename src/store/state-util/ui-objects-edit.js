import { createSelector } from "reselect";

import { getEditedObjectState } from "../../store/types/data/edited-objects";


/*
    Functions for checking/getting data from a /objects/edit/:id page UI state.
*/


/**
 * Returns the currentObjectID data from state.editedObjects.
 * 
 * `getEditedObjectState` is called as a fallback to allow first render of the object page for objects not present in state.editedObjects,
 * as well as component rendering.
 * 
 * A workaround for the first case is to reimplement <Layout> as a class component and invoke on load effects in constructor (before first render).
 * 
 * Another option is to refactor all selectors dependant on the `getCurrentObject` function to use default value when the function returns `undefined`.
 */
export const getCurrentObject = state => state.editedObjects[state.objectsEditUI.currentObjectID] || getEditedObjectState();


/**
 * Returns a selector for the object data from state.editedObjects for the provided `objectID` or default edited object state.
 */
export const getEditedOrDefaultObjectSelector = objectID => state => state.editedObjects[objectID] || getEditedObjectState();


/**
 * Returns true if any of object page fetches are being performed.
 */
export const isFetchingObject = state => state.objectsEditUI.objectOnLoadFetch.isFetching || state.objectsEditUI.objectOnSaveFetch.isFetching;


/**
 * Returns true if any of object page fetches are being performed or on load fetch failed.
 */
export const isFetchingOrOnLoadFetchFailed = state => isFetchingObject(state) || state.objectsEditUI.objectOnLoadFetch.fetchError;


/**
 * Returns a Set containing provided `objectIDs` and IDs of all their subobjects found in state.editedObjects.
 */
export const getEditedObjectAndSubobjectIDs = (state, objectIDs) => {
    const objectAndSubobjectIDs = new Set(objectIDs.map(objectID => parseInt(objectID)));
    objectAndSubobjectIDs.forEach(objectID => {
        const editedObject = state.editedObjects[objectID];
        if (editedObject !== undefined && editedObject.object_type === "composite")
            Object.keys(editedObject.composite.subobjects).forEach(objectID => objectAndSubobjectIDs.add(parseInt(objectID)));
    });

    return objectAndSubobjectIDs;
};


/**
 * Returns memoized list with current & added existing tag IDs.
 */
export const existingTagIDsSelector = createSelector(
    state => getCurrentObject(state).currentTagIDs,
    state => getCurrentObject(state).addedTags,
    (currentTagIDs, addedTags) => currentTagIDs.concat(
        addedTags.filter(tag => typeof(tag) === "number")
    )
);


/**
 * Returns an object, which maps current matching tag IDs to their names for the new tag input dropdown option list.
 */
export const matchingTagIDsNames = createSelector(
    state => state.objectsEditUI.tagsInput.matchingIDs,
    state => state.tags,
    (matchingTagIDs, tagsStore) => matchingTagIDs.reduce((result, tagID) => {
        result[tagID] = tagsStore[tagID].tag_name;
        return result; 
    }, {})
);
