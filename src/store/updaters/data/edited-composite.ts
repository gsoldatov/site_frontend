import { deepCopy } from "../../../util/copy";

import { EditedObjectsSelectors } from "../../selectors/data/objects/edited-objects";
import { EditedObjectsUpdaters } from "./edited-objects";
import { ObjectsUpdaters } from "./objects";

import type { State } from "../../../types/store/state";
import { type EditedObjects } from "../../../types/store/data/edited-objects";
import { compositeSubobject, getCompositeSubobject, SubobjectDeleteMode, 
    type CompositeSubobject, type CompositeSubobjects } from "../../../types/store/data/composite";
import { type ObjectsAddRequestObjectData, type ObjectsAddResponseBodyObject } from "../../../types/fetches/data/objects/add";
import { type ObjectsUpdateRequestObjectData, type ObjectsUpdateResponseBodyObject } from "../../../types/fetches/data/objects/update";
import { type ObjectsTags } from "../../../types/store/data/objects-tags";


/** Contains methods, which update state of an edited composite object & related data (edited subobjects, etc). */
export class EditedCompositeUpdaters {
    /** Performs an `update` command on an edited composite object & related data (edited subobjects, etc). */
    static runUpdateCommand(state: State, objectID: number, update: GetUpdatedEditedCompositeParams): State {
        const { command } = update;
        if (command === "addNewSubobject") return addNewSubobject(state, objectID, update);
        if (command === "addExistingSubobject") return addExistingSubobject(state, objectID, update);
        if (command === "updateSubobject") return updateSubobject(state, objectID, update);
        if (command === "toggleSubobjectsIsPublished") return toggleSubobjectsIsPublished(state, objectID, update);
        if (command === "setSubobjectsFetchError") return setSubobjectsFetchError(state, objectID, update);
        if (command === "updatePositionsOnDrop") return updatePositionsOnDrop(state, objectID, update);
        if (command === "updateSubobjectsOnSave") return updateSubobjectsOnSave(state, objectID, update);
        throw Error(`Command '${command}' handler not implemented.`);
    }

    /**
     * Modifies object data sent via /objects/add & /objects/update fetches 
     * to prepare it for adding to the respective storage/
     */
    static modifyObjectDataPostSave(object_data: ObjectsAddRequestObjectData | ObjectsUpdateRequestObjectData, 
        object: ObjectsAddResponseBodyObject | ObjectsUpdateResponseBodyObject) {
        const { object_type } = object;
        
        switch (object_type) {
            // Map IDs of the new subobjects to their new values
            case "composite":
                const IDMapping = object.object_data?.id_mapping;
                if (IDMapping === undefined) throw Error("Missing `id_mapping` in successful object update response.");
                if (!("subobjects" in object_data)) throw Error("Missing `subobjects` in composite request data.");
                return {
                    ...object_data,
                    subobjects: object_data.subobjects.map(so => {
                        const subobject_id = IDMapping[so.subobject_id] !== undefined ? IDMapping[so.subobject_id] : so.subobject_id;
                        return { ...so, subobject_id };
                    })
                };
            default:
                return object_data;
        }
    }
}


/** 
 * Adds a new composite subobject for edited object `objectID` with default state.
 * Places the subobject on the `update.row` & `update.column` position.
 * Sets its ID to `update.subobjectID`, if its proivded, or generates a new ID.
 * 
 * Adds an edited object for the new subobject.
 */
const addNewSubobject = (state: State, objectID: number, update: ParamsAddNewSubobject): State  => {
    const { row, column } = update;
    const subobjectID = update.subobjectID !== undefined ? update.subobjectID : EditedObjectsSelectors.getNewSubobjectID(state);

    // Add a new edited object
    const { is_published } = state.editedObjects[objectID];     // Get `is_published` setting from parent object
    const display_in_feed = false;                              // disable for subobjects by default
    const newState = EditedObjectsUpdaters.loadEditedObjects(state, [subobjectID], {is_published, display_in_feed });
    
    // Add the new subobject to composite data
    const subobjects = { ...state.editedObjects[objectID].composite.subobjects, [subobjectID]: getCompositeSubobject({ row, column })};
    const composite = { ...state.editedObjects[objectID].composite, subobjects };
    const editedObject = { ...state.editedObjects[objectID], composite };
    return { ...newState, editedObjects: { ...newState.editedObjects, [objectID]: editedObject }};
};


/**
 * Adds an existing subobject to the composite object `objectID` on the `update.row` & `update.column` position.
 * If `update.resetEditedObject` is set to true, resets the object in state.editedObjects (for composite objects also deletes all of their new subobjects).
 */
const addExistingSubobject = (state: State, objectID: number, update: ParamsAddExistingSubobject): State => {
    const { resetEditedObject, subobjectID, row, column } = update;
    let newState = state;

    if (resetEditedObject) {
        newState = EditedObjectsUpdaters.loadEditedObjects(newState, [subobjectID]);
    }
    const newSubobjects = { ...newState.editedObjects[objectID].composite.subobjects };
    newSubobjects[subobjectID] = getCompositeSubobject({ row, column });
    
    return {
        ...newState,
        editedObjects: {
            ...newState.editedObjects,
            [objectID]: {
                ...newState.editedObjects[objectID],
                composite: {
                    ...newState.editedObjects[objectID].composite,
                    subobjects: newSubobjects
                }
            }
        }
    };
};


/** Updates the state of the provided `update.subobjectID` of a composite object `objectID` with the values passed in `update`. */
const updateSubobject = (state: State, objectID: number, update: ParamsUpdateSubobject): State => {
    const { subobjectID } = update;
    const subobject = compositeSubobject.parse({ ...state.editedObjects[objectID].composite.subobjects[subobjectID], ...update });
    const subobjects = { ...state.editedObjects[objectID].composite.subobjects, [subobjectID]: subobject };
    const composite = { ...state.editedObjects[objectID].composite, subobjects };
    const editedObject = { ...state.editedObjects[objectID], composite };
    return { ...state, editedObjects: { ...state.editedObjects, [objectID]: editedObject }};
};


/**
 * Toggles `is_published` prop of of all edited objects, which are subobjects of a composite object `objectID`,
 * based on the provided `subobjectsIsPublishedState` value.
 * If `subobjectsIsPublishedState` == "yes", sets `is_published` values to false, otherwise - to true.
 */
const toggleSubobjectsIsPublished = (state: State, objectID: number, update: ParamsToggleSubobjectsIsPublished): State => {
    const editedObject = state.editedObjects[objectID];
    if (editedObject.object_type !== "composite") return state;

    const { subobjectsIsPublishedState } = update;
    const is_published = subobjectsIsPublishedState !== "yes";

    const newEditedObjects: EditedObjects = {};
    Object.keys(editedObject.composite.subobjects).map(id => parseInt(id)).forEach(subobjectID => {
        if (subobjectID in state.editedObjects) newEditedObjects[subobjectID] = { ...state.editedObjects[subobjectID], is_published };
    });

    return { ...state, editedObjects: { ...state.editedObjects, ...newEditedObjects }};
}


/** Updates `fetchError` value of subobjects `updates.subobjectIDs` of a composite object `objectID`. */
const setSubobjectsFetchError = (state: State, objectID: number, update: ParamsSetSubobjectsFetchError): State => {
    const { fetchError, subobjectIDs } = update;
    const newSubobjects = { ...state.editedObjects[objectID].composite.subobjects };
    subobjectIDs.forEach(subobjectID => {
        if (newSubobjects[subobjectID] === undefined) throw Error(`setFetchError command received a non-existing subobject ID ${subobjectID} for object ID ${objectID}`);
        newSubobjects[subobjectID] = { ...newSubobjects[subobjectID], fetchError };
    });

    return {
        ...state,
        editedObjects: {
            ...state.editedObjects,
            [objectID]: {
                ...state.editedObjects[objectID],
                composite: {
                    ...state.editedObjects[objectID].composite,
                    subobjects: newSubobjects
                }
            }
        }
    };
};


/**
 * Updates state when a subobject card is successfully dropped on another position.
 * 
 * Accepts one of four sets of arguments:
 * 1) `subobjectID` of the dragged subobject and `dropTargetSubobjectID` if dropped on another subobject card;
 * 2) `subobjectID`, `newColumn` & `newRow` if dropped on an add menu;
 * 3) `subobjectID`, `newColumn`, `newRow` & `isDroppedToTheLeft` if dropped on a new column dropzone to the left of an existing column;
 * 4) `subobjectID`, `newColumn`, `newRow` & `isDroppedToTheRight` if dropped on a new column dropzone to the right an existing column.
 * 
 * Updates column row and values of dropped subobject card and other subobjects, which should be affected by position change.
 */
const updatePositionsOnDrop = (state: State, objectID: number, update: ParamsUpdatePositionsOnDrop): State => {
    let { subobjectID, dropTargetSubobjectID, newColumn, newRow, isDroppedToTheLeft, isDroppedToTheRight } = update;
    if (dropTargetSubobjectID !== undefined) {
        newColumn = state.editedObjects[objectID].composite.subobjects[dropTargetSubobjectID].column;
        newRow = state.editedObjects[objectID].composite.subobjects[dropTargetSubobjectID].row;
    }
    if (newColumn === undefined || newRow === undefined) throw Error("Either `dropTargetSubobjectID` or `newColumn` & `newRow` must be present.");

    // Exit if position was not changed (dropped on the row after its starting position)
    const { column, row } = state.editedObjects[objectID].composite.subobjects[subobjectID];
    if (newColumn === column && newRow === row + 1) return state;
    
    const stringSubobjectID = subobjectID.toString();
    let newSubobjects = deepCopy(state.editedObjects[objectID].composite.subobjects);

    // Handle drop on a new column dropzone
    if (isDroppedToTheLeft || isDroppedToTheRight) {
        const minColumnToIncrease = isDroppedToTheLeft ? newColumn : newColumn + 1;
        let remaininngItemsInStartColumn = 0;
        for (let soID of Object.keys(newSubobjects))
            if (soID !== stringSubobjectID) {
                const so = newSubobjects[soID];
                // Reduce rows of subobjects in the start column after the start row
                if (so.column === column && so.row > row) so.row--;
                if (so.column === column) remaininngItemsInStartColumn++;
                
                // Increase column number to the right of the dropped column
                if (so.column >= minColumnToIncrease) so.column += 1;
            }
        
        // Set new column & row of the dragged card
        newSubobjects[subobjectID].column = isDroppedToTheLeft ? newColumn : newColumn + 1;
        newSubobjects[subobjectID].row = 0;

        // Reduce column numbers if start column has no remaining subobjects
        if (remaininngItemsInStartColumn === 0) {
            for (let soID of Object.keys(newSubobjects)) {
                const so = newSubobjects[soID];
                if (so.column > column) so.column--;
            }
        }
    }
    // Handle drop in the same column
    else if (column === newColumn) {
        // Dropped lower
        if (newRow > row + 1) {
            for (let soID of Object.keys(newSubobjects))
                if (soID !== stringSubobjectID) {     // reduce rows of cards between start and end positions by 1
                    const so = newSubobjects[soID];
                    if (so.column === column && so.row > row && so.row < newRow) so.row -= 1;
                }
            newSubobjects[subobjectID].row = newRow - 1;    // set new row of dragged subobject
        // Dropped higher
        } else {
            for (let soID of Object.keys(newSubobjects))
                if (soID !== stringSubobjectID) {     // increase rows of cards between end and start positions by 1
                    const so = newSubobjects[soID];
                    if (so.column === column && so.row >= newRow && so.row < row) so.row += 1;
                }
            newSubobjects[subobjectID].row = newRow;    // set new row of dragged subobject
        }
    // Handle drop in another column
    } else {
        let remaininngItemsInStartColumn = 0;
        for (let soID of Object.keys(newSubobjects))
            if (soID !== stringSubobjectID) {
                const so = newSubobjects[soID];
                // Reduce rows of subobjects in the start column after the start row
                if (so.column === column && so.row > row) so.row--;
                if (so.column === column) remaininngItemsInStartColumn++;

                // Increase rows of subobjects in the new column after the new row
                if (so.column === newColumn && so.row >= newRow) so.row++;
            }
        
        // Set new column & row of the dragged card
        newSubobjects[subobjectID].column = newColumn;
        newSubobjects[subobjectID].row = newRow;

        // Reduce column numbers if start column has no remaining subobjects
        if (remaininngItemsInStartColumn === 0) {
            for (let soID of Object.keys(newSubobjects)) {
                const so = newSubobjects[soID];
                if (so.column > column) so.column--;
            }
        }
    }

    return {
        ...state,
        editedObjects: {
            ...state.editedObjects,
            [objectID]: {
                ...state.editedObjects[objectID],
                composite: {
                    ...state.editedObjects[objectID].composite,
                    subobjects: newSubobjects
                }
            }
        }
    };
};


/**
 * Updates state after add or update of a composite object:
 * - removes any new subobjects from state.editedObjects if the main object is not composite (for when it was changed after subobject creation);
 * - removes deleted and fully deleted existing subobjects from state;
 * - updates new & modified subobjects in state.editedObjects (maps subobject IDs & created_at & modified_at timestamps);
 * - adds new & modified subobject attributes & data to state storages;
 * - adds empty records in objectsTags storage for new subobjects;
 * - maps subobject IDs of the saved composite object and removes deleted subobjects in state.editedObjects[objectID];
 * - updates subobject row positions in state.editedObjects[objectID].
 * 
 * Object attributes, tags & data of the saved object are added to the storages in the add/update fetch functions.
 */
const updateSubobjectsOnSave = (state: State, objectID: number, update: ParamsUpdateSubobjectsOnSave): State => {
    // Don't update non-existing edited object (e.g. when updating data via /objects/view/:id fetches)
    if (state.editedObjects[objectID] === undefined) return state;

    // `object` contains response object attributes & data, `object_data` contains object data as it was sent in request
    const { object, object_data } = update;

    // If object is not composite, delete any new subobjects which were created before object type was changed
    if (object.object_type !== "composite") {
        const newSubobjectIDs = EditedObjectsSelectors.newSubobjectIDs(state, [objectID]);
        return EditedObjectsUpdaters.removeEditedObjects(state, newSubobjectIDs);
    }
    let newState = state;

    // Remove new and unchanged (non-fully) deleted existing objects from state
    let subobjectIDs = Object.keys(newState.editedObjects[objectID].composite.subobjects).map(id => parseInt(id));
    const deletedSubobjectIDs = subobjectIDs.filter(subobjectID => 
                                newState.editedObjects[objectID].composite.subobjects[subobjectID].deleteMode === SubobjectDeleteMode.subobjectOnly
                                && EditedObjectsSelectors.isNewOrUnchangedExisting(newState, subobjectID));
    newState = ObjectsUpdaters.deleteObjects(newState, deletedSubobjectIDs);
    
    // Remove fully deleted existing objectsfrom state
    let fullyDeletedExistingSubobjectIDs = subobjectIDs.filter(subobjectID => {
        return subobjectID > 0 && newState.editedObjects[objectID].composite.subobjects[subobjectID].deleteMode === SubobjectDeleteMode.full
    });
    newState = ObjectsUpdaters.deleteObjects(newState, fullyDeletedExistingSubobjectIDs);

    // Map new subobject IDs in state.editedObjects and update object_id, created_at & modified_at values
    // Also add empty records in objectsTags storage for new subobjects
    const objectUpdateTimeStamp = object.modified_at;
    const IDMapping = object.object_data!.id_mapping;
    if (!("subobjects" in object_data)) throw Error("Missing `subobjects` in object_data.");
    const modifiedExistingSubobjectIDs = object_data.subobjects.filter(so => so.subobject_id > 0 && "object_name" in so).map(so => so.subobject_id);
    let newEditedObjects: EditedObjects = {}, newObjectsTags: ObjectsTags = {};
    for (let oldObjectID of Object.keys(newState.editedObjects).map(id => parseInt(id))) {
        const isNewSubobject = IDMapping[oldObjectID] !== undefined;
        const isModifiedExistingSubobject = modifiedExistingSubobjectIDs.indexOf(oldObjectID) > -1;

        // If edited object was a new subobject, copy it, update its ID and add created_at & modified_at values
        // Add an empty list as its current tags
        if (isNewSubobject) {
            const newObjectID = IDMapping[oldObjectID];
            newEditedObjects[newObjectID] = { ...newState.editedObjects[oldObjectID] };
            newEditedObjects[newObjectID].object_id = newObjectID;
            newEditedObjects[newObjectID].created_at = objectUpdateTimeStamp;
            newEditedObjects[newObjectID].modified_at = objectUpdateTimeStamp;
            newObjectsTags[newObjectID] = [];
        }
        // If edited object was an existing modified subobject, copy it and update its modified_at value
        else if (isModifiedExistingSubobject) {
            newEditedObjects[oldObjectID] = { ...newState.editedObjects[oldObjectID] };
            newEditedObjects[oldObjectID].modified_at = objectUpdateTimeStamp;
        }
        // If edited object was not updated, do not copy it
        else {
            newEditedObjects[oldObjectID] = newState.editedObjects[oldObjectID];
        }
    }
    newState = { ...newState, editedObjects: newEditedObjects, objectsTags: { ...state.objectsTags, ...newObjectsTags } };

    // Filter new & modified existing subobjects and map new subobject IDs from object_data
    let subobjectsToAddToState = object_data.subobjects.filter(so => "object_name" in so).map(so => {
        const newSO = deepCopy(so);
        const newObjectID = IDMapping[so.object_id];
        if (newObjectID !== undefined) {
            newSO.object_id = newObjectID;
            newSO.created_at = objectUpdateTimeStamp;
            newSO.modified_at = objectUpdateTimeStamp;
        } else {
            newSO.created_at = newState.objects[so.object_id].created_at;
            newSO.modified_at = objectUpdateTimeStamp;
        }
        return newSO;
    });

    // Add new & modified existing attributes & data to state
    newState = ObjectsUpdaters.addObjectsAttributes(newState, subobjectsToAddToState);
    newState = ObjectsUpdaters.addObjectsDataFromBackend(newState, subobjectsToAddToState);
    
    // Map subobjectIDs of the composite object and remove deleted subobjects in state.editedObjects[objectID].
    // Update row positions of non-deleted objects.
    const newRowPositions: Record<number, number> = {};
    object_data.subobjects.forEach(so => {
        newRowPositions[so.subobject_id] = so.row;
    });
    const newComposite = { ...newState.editedObjects[objectID].composite };
    const newSubobjects: CompositeSubobjects["subobjects"] = {};
    Object.keys(newComposite.subobjects).map(id => parseInt(id)).forEach(subobjectID => {
        // Filter out deleted subobjects
        if (deletedSubobjectIDs.indexOf(subobjectID) > -1 || fullyDeletedExistingSubobjectIDs.indexOf(subobjectID) > -1) return;

        const mappedSubobjectID = subobjectID in IDMapping ? IDMapping[subobjectID] : subobjectID;
        newSubobjects[mappedSubobjectID] = { ...newComposite.subobjects[subobjectID], row: newRowPositions[subobjectID] };
    });
    newComposite.subobjects = newSubobjects;

    newState = {
        ...newState,
        editedObjects: {
            ...newState.editedObjects,
            [objectID]: {
                ...newState.editedObjects[objectID],
                composite: newComposite
            }
        }
    };

    return newState;
};


type ParamsAddNewSubobject = { command: "addNewSubobject", subobjectID?: number, row: number, column: number };
type ParamsAddExistingSubobject = { command: "addExistingSubobject", 
    subobjectID: number, row: number, column: number, resetEditedObject?: boolean
};
type ParamsUpdateSubobject = { command: "updateSubobject", subobjectID: number } & Partial<CompositeSubobject>;
type ParamsToggleSubobjectsIsPublished = { command: "toggleSubobjectsIsPublished", subobjectsIsPublishedState: "yes" | "partially" | "no" };
type ParamsSetSubobjectsFetchError = { command: "setSubobjectsFetchError", fetchError: string, subobjectIDs: number[] };
type ParamsUpdatePositionsOnDrop = { command: "updatePositionsOnDrop"
    subobjectID: number, dropTargetSubobjectID?: number, newColumn?: number, newRow?: number, 
    isDroppedToTheLeft?: number, isDroppedToTheRight?: number
};
type ParamsUpdateSubobjectsOnSave = { command: "updateSubobjectsOnSave", 
    object: ObjectsAddResponseBodyObject | ObjectsUpdateResponseBodyObject, 
    object_data: ObjectsAddRequestObjectData | ObjectsUpdateRequestObjectData
};
export type GetUpdatedEditedCompositeParams = ParamsAddNewSubobject | ParamsAddExistingSubobject | ParamsUpdateSubobject | 
    ParamsToggleSubobjectsIsPublished | ParamsSetSubobjectsFetchError | ParamsUpdatePositionsOnDrop | ParamsUpdateSubobjectsOnSave;
