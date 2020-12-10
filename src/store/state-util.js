import { isFetchingTags } from "./state-check-functions";
/*
    Utility functions for working with state.
*/

export function getCurrentObjectData(state) {
    // Function must return a copy of the object if its data is mutable;
    // This will prevent potential inconsistency in local storage due to user inputs during the add fetch.
    const currentObject = state.objectUI.currentObject;
    switch (currentObject.object_type) {
        case "link":
            return { "link": currentObject.link };
        default:
            return null;
    }
}

/* Returns object data for the provided object_id or null */
export function getObjectData(state, object_id) {
    for (let dataStore of ["links"]) {
        if (object_id in state[dataStore]) {
            return state[dataStore][object_id];
        }
    }

    return null;
};


/* Returns the ID corresponding to the provided tag name. */
export function getTagIDByName(state, name) {
    for (let id of Object.keys(state.tags)) {
        if (state.tags[id].tag_name.toLowerCase() === name.toLowerCase()) return parseInt(id);
    }
};


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
            if (commonTagIDs.size > 0) commonTagIDs.forEach(tagID => {
                if (!state.objectsTags[objectID].includes(tagID)) commonTagIDs.delete(tagID);
            });
            state.objectsTags[objectID].forEach(tagID => allTagIDs.add(tagID));
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
const getAddedTagsCacheKey = state => state.objectsUI.addedTags.sort().join(",") + "|" + objectsGetPartiallyAppliedTagIDs(state).sort().join(",");     // addedTags + partially applied
const getAddedTags = state => addedTagsCache[getAddedTagsCacheKey(state)];
const calculateAddedTags = state => {
    let addedTags = state.objectsUI.addedTags.filter(tagID => !objectsGetPartiallyAppliedTagIDs(state).includes(tagID));
    addedTagsCache[getAddedTagsCacheKey(state)] = addedTags;
    return addedTags;
};
