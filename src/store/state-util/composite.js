/*
    Functions for checking/getting data from the state of a composite objects and subobjects.
*/

import { deepEqual } from "../../util/equality-checks";
import { validateNonCompositeObject } from "./objects";


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
 * Accepts subobject state from object data (`stateInObjectData`) and editedObject (`stateInEditedObject`).
 * 
 * Returns true if the two state have different user-editable attributes.
 * 
 * Returns false if any of the two states are not found.
 */
export const subobjectStateIsModified = (stateInObjectData, stateInEditedObject) => {
    if (stateInObjectData === undefined || stateInEditedObject === undefined) return false;

    for (let attr of ["row", "column", "selected_tab"]) {
        if (!deepEqual(stateInObjectData[attr], stateInEditedObject[attr])) return true;
    }

    return false;
};


/**
 * Returns true if non-composite subobject attributes/data of `editedObject` are valid.
 * 
 * Always returns true for subobjects with composite object type or not present in the state.
 */
export const nonCompositeSubobjectIsValid = editedObject => {
    return getNonCompositeSubobjectValidationError(editedObject) === undefined;
};


/**
 * Returns validation error text for a non-composite edited object `editedObject`, if it's not valid.
 * 
 * If object is valid, has "composite" object type or not being edited, returns undefined.
 */
export const getNonCompositeSubobjectValidationError = editedObject => {
    if (editedObject === undefined || editedObject.object_type === "composite") return undefined;

    try {
        validateNonCompositeObject(editedObject);
        return undefined;
    } catch (e) {
        return e.message;
    }
};
