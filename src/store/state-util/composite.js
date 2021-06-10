/*
    Functions for checking/getting data from the state of a composite objects and subobjects.
*/

import { deepEqual } from "../../util/equality-checks";
import { validateObject } from "./objects";


/**
 *  Returns an available object_id value for a new subobject.
 */
export const getNewSubobjectID = state => {
    let minObjectID = 0;
    for (let id of Object.keys(state.editedObjects)) {
        let currID = parseInt(id);
        if (isNaN(currID)) throw TypeError(`Received a non-numerical object ID when calculating an ID of new subobject: "${id}"`);
        minObjectID = Math.min(minObjectID, currID);
    }
    return minObjectID - 1;
};


/**
 *  Returns the ordered by column/row subobject positions of `composite` object. Result is a list with each item being a list for a specific column.
 * If `collapseEmptyRows` is set to true, removes empty rows inside each column
 */
export const getSubobjectDisplayOrder = (composite, collapseEmptyRows) => {
    let displayOrder = [[]];    // always return at least one empty column

    for (let subobjectID of Object.keys(composite.subobjects)) {
        const { row, column } = composite.subobjects[subobjectID];

        // Insert empty lists for new column and all not-yet added columns to the left of it
        for (let i = displayOrder.length; i <= column; i++)
            displayOrder.push([]);
        
        // Insert subobject
        displayOrder[column][row] = subobjectID;
    }

    // Collapse empty rows inside each column
    if (collapseEmptyRows) {
        for (let i = 0; i < displayOrder.length; i++)
            displayOrder[i] = displayOrder[i].filter(subobjectID => subobjectID !== undefined)
    }

    return displayOrder;
};


/**
 * Returns true if subobject with `subobjectID` parameters in parent composite object with `objectID` were modified.
 * 
 * If object is not present in state.editedObjects or state.composite, returns false.
 * 
 * If subobject is not present in edited or saved state, returns false.
 */
 export const subobjectStateIsModified = (state, objectID, subobjectID) => {
    const objectData = state.composite[objectID], editedObject = state.editedObjects[objectID];
    if (objectData === undefined || editedObject === undefined) return false;

    const savedSubobjectState = objectData.subobjects[subobjectID], editedSubobjectState = editedObject.composite.subobjects[subobjectID];
    if (savedSubobjectState === undefined || editedSubobjectState === undefined) return false;

    for (let attr of ["row", "column", "selected_tab"]) {
        if (!deepEqual(savedSubobjectState[attr], editedSubobjectState[attr])) return true;
    }

    return false;
};


/**
 * Returns true if non-composite subobject attributes/data are valid.
 * 
 * Always returns true for subobjects with composite object type or not present in the state.
 */
export const nonCompositeSubobjectIsValid = (state, subobjectID) => {
    return getNonCompositeSubobjectValidationError(state, subobjectID) === undefined;
};


/**
 * Returns validation error text for a non-composite edited object, if it's not valid.
 * 
 * If object is valid, has "composite" object type or not being edited, returns undefined.
 */
export const getNonCompositeSubobjectValidationError = (state, subobjectID) => {
    const editedObject = state.editedObjects[subobjectID];
    if (editedObject === undefined || editedObject.object_type === "composite") return undefined;

    try {
        validateObject(state, editedObject);
        return undefined;
    } catch (e) {
        return e.message;
    }
};
