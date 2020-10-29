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