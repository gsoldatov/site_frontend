import { getObjectDataFromStore, objectDataIsInState } from "../store/state-util/objects";
import { deepCopy } from "./copy";


// Returns true if `a` is deeply equal to `b` (cyclic references are not checked).
export const deepEqual = (a, b) => {
    // Check if types are the same
    if (typeof(a) !== typeof(b)) return false;

    // Types which can be directly compared
    if (["undefined", "string", "boolean", "bigint", "function"].includes(typeof(a))) return a === b;

    // Numbers (with additional check for NaN)
    if (typeof(a) === "number") return a === b || (isNaN(a) && isNaN(b));

    // Objects
    // Nulls
    if (a === null && b === null) return true;
    else if (a === null || b === null) return false;

    // Check if objects have the same constructors
    if (a.constructor !== b.constructor) return false;

    // Dates
    if (a instanceof Date) return a.getTime() === b.getTime()

    // Arrays
    if (a instanceof Array) {
        if (a.length !== b.length) return false;

        for (let i in a)
            if (!deepEqual(a[i], b[i])) return false;
        return true;
    }
    
    // General object check
    let keys = Object.keys(a);
    if (keys.length !== Object.keys(b).length) return false;

    for (let k of keys)
        if (!deepEqual(a[k], b[k])) return false;
    return true;
};


export const currentObjectHasNoChanges = state => {
    const currentObjectID = state.objectUI.currentObjectID;

    // If currentObjectID is not present in edited objects, return true to avoid copying edited objects
    if (!state.editedObjects.hasOwnProperty(currentObjectID)) return true;

    // If saved object attributes, tags or data are missing, return true to avoid deleting existing changes of a non-cached object
    if (!state.objects.hasOwnProperty(currentObjectID) || !state.objectsTags.hasOwnProperty(currentObjectID) || !objectDataIsInState(state, currentObjectID)) 
        return true;
    
    const editedObject = state.editedObjects[currentObjectID];
    
    // Check object attributes
    let savedAttributes = state.objects[currentObjectID];
    for (let key of Object.keys(savedAttributes))
        if (!deepEqual(editedObject[key], savedAttributes[key])) return false;

    // Check object tags
    if (editedObject.addedTags.length > 0 || editedObject.removedTagIDs.length > 0 || !deepEqual(editedObject.currentTagIDs, state.objectsTags[currentObjectID])) return false;

    // Check object data
    let savedObjectData = getObjectDataFromStore(state, currentObjectID);
    for (let key of Object.keys(savedObjectData))
    if (!deepEqual(editedObject[key], savedObjectData[key])) return false;

    // No changes were made
    return true;
}
