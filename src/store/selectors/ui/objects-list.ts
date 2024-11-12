import { createSelector } from "reselect";

import type { State } from "../../types/state";


export class ObjectsListSelectors {
    /**
     * Returns true if an /objects/list page fetch is being performed.
     */
    static isFetching(state: State) {
        return state.objectsListUI.fetch.isFetching;
    }

    /**
     * Returns true if an /objects/list page fetch is being performed or a confirmation dialog is being displayed.
     */
    static isFetchingOrShowingDeleteDialog(state: State) {
        return ObjectsListSelectors.isFetching(state) || state.objectsListUI.showDeleteDialog;
    }

    /**
     * Returns true if there are currently added or removed tags in objectsListUI state.
     */
    static isObjectsTagsEditActive(state: State) {
        return state.objectsListUI.addedTags.length > 0 || state.objectsListUI.removedTagIDs.length > 0;
    }

    /**
     * Returns common tag IDs of selected objects on the /objects/list page.
     */
    static commonTagIDs(state: State) {
        return commonTagIDsSelector(state);
    }

    /**
     * Returns partially applied tag IDs of selected objects on the /objects/list page.
     */
    static partiallyAppliedTagIDs(state: State) {
        return partiallyAppliedTagIDsSelector(state);
    }

    /**
     * Returns common, partially applied and added existing tag IDs for selected objects on the /objects/list page.
     */
    static existingTagIDs(state: State) {
        return existingTagIDsSelector(state);
    }

    /**
     * Returns added tags / tag IDs, which are applied to ALL selected objects on the /objects/list page.
     */
    static addedTags(state: State) {
        return addedTagsSelector(state);
    }

    /**
     * Returns a mapping of matching tag IDs from tags input to their tag names
     */
    static matchingTagIDsNames(state: State) {
        return matchingTagIDsNames(state);
    }
}


/**
 * Selector with memoization for calculating common and partially applied tags on /objects/list page.
 * Calculates and caches lists of common & partially applied tag IDs for the current ids in the state.objectsListUI.selectedObjectIDs list.
 */
const commonAndPartiallyAppliedTagsSelector = createSelector(
    (state: State) => state.objectsListUI.selectedObjectIDs,
    (state: State) => state.objectsTags,
    (selectedObjectIDs, objectsTags) => {
        let commonTagIDs: Set<number> = new Set(), allTagIDs: Set<number> = new Set();      // initialize sets with placeholders to narrow their types
        let isFirstIteration = true;

        selectedObjectIDs.forEach(objectID => {
            if (isFirstIteration) {   // initialize common and partially applied tag ID sets on the first iteration
                commonTagIDs = new Set(objectsTags[objectID]);
                allTagIDs = new Set(objectsTags[objectID]);
                isFirstIteration = false;
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
        return { 
            commonTagIDs: commonTagIDs ? [...commonTagIDs] : [], 
            partiallyAppliedTagIDs: allTagIDs ? [...allTagIDs].filter(tagID => !commonTagIDs.has(tagID)) : [] 
        };
    }
);


/**
 * Selector with memoization which returns common tag IDs of selected objects on /objects/list page.
 */
const commonTagIDsSelector = createSelector(commonAndPartiallyAppliedTagsSelector, commonAndPartiallyAppliedTags => commonAndPartiallyAppliedTags.commonTagIDs);


/**
 * Selector with memoization which returns partially applied tag IDs of selected objects on /objects/list page.
 */
const partiallyAppliedTagIDsSelector = createSelector(commonAndPartiallyAppliedTagsSelector, commonAndPartiallyAppliedTags => commonAndPartiallyAppliedTags.partiallyAppliedTagIDs);


/**
 * Selector with memoization which returns common, partially applied and added existing tag IDs for selected objects on /objects/list page.
 */
const existingTagIDsSelector = createSelector(
    (state: State) => state.objectsListUI.addedTags,
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
const addedTagsSelector = createSelector(
    (state: State) => state.objectsListUI.addedTags,
    partiallyAppliedTagIDsSelector,
    (addedTags, partiallyAppliedTagIDs) => addedTags.filter(tagID => !partiallyAppliedTagIDs.includes(tagID as number))
);


/**
 * Returns an object, which maps current matching tag IDs to their names for the new tag input dropdown option list.
 */
const matchingTagIDsNames = createSelector(
    (state: State) => state.objectsListUI.tagsInput.matchingIDs,
    (state: State) => state.tags,
    (matchingTagIDs, tagsStore) => matchingTagIDs.reduce((result, tagID) => {
        result[tagID] = tagsStore[tagID].tag_name;
        return result; 
    }, {} as Record<number, string>)
);
