import { createSelector } from "reselect";

import { ObjectsEditSelectors } from "../selectors/ui/objects-edit";


/*
    Functions for checking/getting data from a /objects/edit/:id page UI state.
*/



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
