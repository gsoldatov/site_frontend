import { createSelector } from "reselect";
/*
    Functions for checking/getting data from a /objects/list page UI state.
*/


/**
 * Returns true if objects page fetch is being performed.
 */
export const isFetchingObjects = state => state.objectsListUI.fetch.isFetching;


/**
 * Returns true if object page fetch is being performed or a confirmation dialog is being displayed.
 */
export const isFetchingOrShowingDeleteDialogObjects = state => isFetchingObjects(state) || state.objectsListUI.showDeleteDialog;


/**
 * Returns true if there are currently added or removed tags in objectsListUI state.
 */
export const isObjectsTagsEditActive = state => state.objectsListUI.addedTags.length > 0 || state.objectsListUI.removedTagIDs.length > 0;


/**
 * Selector with memoization for calculating common and partially applied tags on /objects/list page.
 * Calculates and caches lists of common & partially applied tag IDs for the current ids in the state.objectsListUI.selectedObjectIDs list.
 */
export const commonAndPartiallyAppliedTagsSelector = createSelector(
    state => state.objectsListUI.selectedObjectIDs,
    state => state.objectsTags,
    (selectedObjectIDs, objectsTags) => {
        let commonTagIDs, allTagIDs;
        selectedObjectIDs.forEach(objectID => {
            if (commonTagIDs === undefined) {   // initialize common and partially applied tag ID sets on the first iteration
                commonTagIDs = new Set(objectsTags[objectID]);
                allTagIDs = new Set(objectsTags[objectID]);
            } else {    // update common and partially applied tag ID sets
                if (commonTagIDs.size > 0) {
                    if (objectsTags[objectID] === undefined) commonTagIDs.clear();
                    else commonTagIDs.forEach(tagID => {
                        if (!objectsTags[objectID].includes(tagID)) commonTagIDs.delete(tagID);
                    });
                }
                if (objectsTags[objectID] !== undefined) objectsTags[objectID].forEach(tagID => allTagIDs.add(tagID));
            }
        });
        // Prepare, cache and return result
        let result = { 
            commonTagIDs: commonTagIDs ? [...commonTagIDs] : [], 
            partiallyAppliedTagIDs: allTagIDs ? [...allTagIDs].filter(tagID => !commonTagIDs.has(tagID)) : [] 
        };
        return result;
    }
);


/**
 * Selector with memoization which returns common tag IDs of selected objects on /objects/list page.
 */
export const commonTagIDsSelector = createSelector(commonAndPartiallyAppliedTagsSelector, commonAndPartiallyAppliedTags => commonAndPartiallyAppliedTags.commonTagIDs);


/**
 * Selector with memoization which returns partially applied tag IDs of selected objects on /objects/list page.
 */
 export const partiallyAppliedTagIDsSelector = createSelector(commonAndPartiallyAppliedTagsSelector, commonAndPartiallyAppliedTags => commonAndPartiallyAppliedTags.partiallyAppliedTagIDs);


/**
 * Selector with memoization which returns common, partially applied and added existing tags for selected objects on /objects/list page.
 */
export const existingTagIDsSelector = createSelector(
    state => state.objectsListUI.addedTags,
    commonAndPartiallyAppliedTagsSelector,
    (addedTags, commonAndPartiallyAppliedTags) => {
        const result = commonAndPartiallyAppliedTags.commonTagIDs.concat(
            commonAndPartiallyAppliedTags.partiallyAppliedTagIDs.concat(
                addedTags.filter(tag => typeof(tag) === "number")
        ));

        // Deduplicate IDs (partially selected tags can also be in the added ones)
        return [...new Set(result)];
    }
);


/**
 * Selector with memoization for calculating added tags on /objects/list page.
 * Calculates and caches lists of tag ids/tags to be displayed in added tags inline item list (filters out partially applied tag ids).
 */
export const addedTagsSelector = createSelector(
    state => state.objectsListUI.addedTags,
    partiallyAppliedTagIDsSelector,
    (addedTags, partiallyAppliedTagIDs) => addedTags.filter(tagID => !partiallyAppliedTagIDs.includes(tagID))
);


/**
 * Returns an object, which maps current matching tag IDs to their names for the new tag input dropdown option list.
 */
export const matchingTagIDsNames = createSelector(
    state => state.objectsListUI.tagsInput.matchingIDs,
    state => state.tags,
    (matchingTagIDs, tagsStore) => matchingTagIDs.reduce((result, tagID) => {
        result[tagID] = tagsStore[tagID].tag_name;
        return result; 
    }, {})
);