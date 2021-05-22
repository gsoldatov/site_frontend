/*
    Functions for checking/getting data from the state of a composite objects and subobjects.
*/


// Returns an available object_id value for a new subobject.
export const getNewSubobjectID = state => {
    let minObjectID = 0;
    for (let id of Object.keys(state.editedObjects)) {
        let currID = parseInt(id);
        if (isNaN(currID)) throw TypeError(`Received a non-numerical object ID when calculating an ID of new subobject: "${id}"`);
        minObjectID = Math.min(minObjectID, currID);
    }
    return minObjectID - 1;
};


// Returns the ordered by column/row subobject positions. Result is a list with each item being a list for a specific column.
export const getSubobjectDisplayOrder = composite => {
    let displayOrder = [[]];    // always return at least one empty column

    for (let objectID of Object.keys(composite.subobjects)) {
        const { row, column } = composite.subobjects[objectID];

        // Insert empty lists for new column and all not-yet added columns to the left of it
        for (let i = displayOrder.length; i <= column; i++)
            displayOrder.push([]);
        
        // Insert subobject
        displayOrder[column][row] = objectID;
    }

    return displayOrder;
};
