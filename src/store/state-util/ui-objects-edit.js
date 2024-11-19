import { createSelector } from "reselect";

import { ObjectsEditSelectors } from "../selectors/ui/objects-edit";


/*
    Functions for checking/getting data from a /objects/edit/:id page UI state.
*/


/**
 * Returns true if any of object page fetches are being performed.
 */
export const isFetchingObject = state => state.objectsEditUI.loadFetch.isFetching || state.objectsEditUI.saveFetch.isFetching;


/**
 * Returns true if any of object page fetches are being performed or on load fetch failed.
 */
export const isFetchingOrOnLoadFetchFailed = state => isFetchingObject(state) || state.objectsEditUI.loadFetch.fetchError;


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
    state => ObjectsEditSelectors.currentObject(state).currentTagIDs,
    state => ObjectsEditSelectors.currentObject(state).addedTags,
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
