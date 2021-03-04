/*
    Functions for checking/getting data from a /objects page UI state.
*/


// Returns true if object page fetch is being performed.
export const isFetchingObjects = state => state.objectsUI.fetch.isFetching;


// Returns true if object page fetch is being performed or a confirmation dialog is being displayed.
export const isFetchinOrShowingDialogObjects = state => isFetchingObjects(state) || state.objectsUI.showDeleteDialog;


// Returns true if there are currently added or removed tags in objectsUI state
export const isObjectsTagsEditActive = state => state.objectsUI.addedTags.length > 0 || state.objectsUI.removedTagIDs.length > 0;


/* Resets objects caches */
export const resetObjectCaches = () => {
    commonAndPartiallyAppliedTagsCache = {};
    addedTagsCache = {};
};


/* 
    Common and partially applied tags cache & calculation for the /objects page.
    Calculates and caches lists of common & partially applied tag IDs for the current ids in the state.objectsUI.selectedObjectIDs list.
    Cache is reset with resetObjectCaches function manually in setObjectsFetch reducer. Additional reset calls may be added to correctly handle state updates which invalidate cached data.

    Main functions:
    - objectsGetCommonTagIDs - return cached or calculated list of common tag IDs for the current state;
    - objectsGetPartiallyAppliedTagIDs - return cached or calculated list of partially applied tag IDs for the current state;
    
    Internal:
    - commonAndPartiallyAppliedTagsCache - the cache object;
    - getCommonAndPartiallyAppliedCacheKey - returns the cache key for the current state;
    - getCommonAndPartiallyAppliedTags - returns the cached object with commonTagIDs and partiallyAppliedTagIDs lists (of undefined) for the current ids in the state.objectsUI.selectedObjectIDs;
    - calculateCommonAndPartiallyAppliedTags - calculates, caches and returns an object with commonTagIDs and partiallyAppliedTagIDs lists for the current ids in the state.objectsUI.selectedObjectIDs.
*/
export const objectsGetCommonTagIDs = state => (getCommonAndPartiallyAppliedTags(state) || calculateCommonAndPartiallyAppliedTags(state)).commonTagIDs;
export const objectsGetPartiallyAppliedTagIDs = state => (getCommonAndPartiallyAppliedTags(state) || calculateCommonAndPartiallyAppliedTags(state)).partiallyAppliedTagIDs;

export let commonAndPartiallyAppliedTagsCache = {}; // exported for testing purposes
const getCommonAndPartiallyAppliedTags = state => commonAndPartiallyAppliedTagsCache[getCommonAndPartiallyAppliedCacheKey(state)];
const getCommonAndPartiallyAppliedCacheKey = state => state.objectsUI.selectedObjectIDs.sort().join(",");
const calculateCommonAndPartiallyAppliedTags = state => {
    let commonTagIDs, allTagIDs;
    state.objectsUI.selectedObjectIDs.forEach(objectID => {
        if (commonTagIDs === undefined) {   // initialize common and partially applied tag ID sets on the first iteration
            commonTagIDs = new Set(state.objectsTags[objectID]);
            allTagIDs = new Set(state.objectsTags[objectID]);
        } else {    // update common and partially applied tag ID sets
            if (commonTagIDs.size > 0) {
                if (state.objectsTags[objectID] === undefined) commonTagIDs.clear();
                else commonTagIDs.forEach(tagID => {
                    if (!state.objectsTags[objectID].includes(tagID)) commonTagIDs.delete(tagID);
                });
            }
            if (state.objectsTags[objectID] !== undefined) state.objectsTags[objectID].forEach(tagID => allTagIDs.add(tagID));
            // if (commonTagIDs.size > 0) commonTagIDs.forEach(tagID => {
            //     if (!state.objectsTags[objectID].includes(tagID)) commonTagIDs.delete(tagID);
            // });
            // state.objectsTags[objectID].forEach(tagID => allTagIDs.add(tagID));
        }
    });
    // Prepare, cache and return result
    let result = { 
        commonTagIDs: commonTagIDs ? [...commonTagIDs] : [], 
        partiallyAppliedTagIDs: allTagIDs ? [...allTagIDs].filter(tagID => !commonTagIDs.has(tagID)) : [] 
    };
    commonAndPartiallyAppliedTagsCache[getCommonAndPartiallyAppliedCacheKey(state)] = result;
    return result;
};


/*
    Added tags cache & calculation for the /objects page.
    Calculates and caches lists of tag ids/tags to be displayed in added tags inline item list (filters out partially applied tag ids).
    Cache is reset manually by resetObjectCaches function in setObjectsFetch reducer. Additional reset calls may be added to correctly handle state updates which invalidate cached data.
*/
export const objectsGetAddedTags = state => getAddedTags(state) || calculateAddedTags(state);

export let addedTagsCache = {};
// const getAddedTagsCacheKey = state => state.objectsUI.addedTags.sort().join(",") + "|" + objectsGetPartiallyAppliedTagIDs(state).sort().join(",");     // addedTags + partially applied
const getAddedTagsCacheKey = state => state.objectsUI.addedTags.sort().map(t => {
    if (typeof(t) === "string" && t.replace(/\D/g, "").length === t.length) return `!@"${t}"@!`;    // handle strings consisting of digits only (which get the same key as numeric ids of the same value otherwise)
    return t;
}).join(",") + "|" + objectsGetPartiallyAppliedTagIDs(state).sort().join(",");     // addedTags + partially applied
const getAddedTags = state => addedTagsCache[getAddedTagsCacheKey(state)];
const calculateAddedTags = state => {
    let addedTags = state.objectsUI.addedTags.filter(tagID => !objectsGetPartiallyAppliedTagIDs(state).includes(tagID));
    addedTagsCache[getAddedTagsCacheKey(state)] = addedTags;
    return addedTags;
};
