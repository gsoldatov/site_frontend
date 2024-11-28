import { deepCopy } from "../../../util/copy";

import { EditedObjectsUpdaters } from "./edited-objects";
import { CompositeSelectors } from "../../selectors/data/objects/composite";
import { getStateWithResetEditedObjects, getStateWithDeletedEditedNewSubobjects } from "../../../reducers/helpers/object";

import { compositeSubobject, getCompositeSubobject, type CompositeSubobject } from "../../types/data/composite";
import { getEditedObjectState, type EditedObjects } from "../../types/data/edited-objects";
import type { State } from "../../types/state"
import { type ObjectsAddRequestObjectData, type ObjectsAddResponseBodyObject } from "../../../fetches/types/data/objects/add";


/** Contains methods, which update state of an edited composite object & related data (edited subobjects, etc). */
export class EditedCompositeUpdaters {
    /** 
     * Adds a new composite subobject for edited object `objectID` with default state.
     * Places the subobject on the `update.row` & `update.column` position.
     * Sets its ID to `update.subobjectID`, if its proivded, or generates a new ID.
     * 
     * Adds an edited object for the new subobject.
     */
    static addNewSubobject(state: State, objectID: number, update: ParamsAddNewSubobject): State {
        const { row, column } = update;
        const subobjectID = update.subobjectID !== undefined ? update.subobjectID : CompositeSelectors.getNewSubobjectID(state);

        // Add a new edited object
        const { is_published } = state.editedObjects[objectID];     // Get `is_published` setting from parent object
        const display_in_feed = false;                              // disable for subobjects by default
        const newState = EditedObjectsUpdaters.loadEditedObjects(state, [subobjectID], {is_published, display_in_feed });
        
        // Add the new subobject to composite data
        const subobjects = { ...state.editedObjects[objectID].composite.subobjects, [subobjectID]: getCompositeSubobject({ row, column })};
        const composite = { ...state.editedObjects[objectID].composite, subobjects };
        const editedObject = { ...state.editedObjects[objectID], composite };
        return { ...newState, editedObjects: { ...newState.editedObjects, [objectID]: editedObject }};
    }

    /**
     * Adds an existing subobject to the composite object `objectID` on the `update.row` & `update.column` position.
     * If `update.resetEditedObject` is set to true, resets the object in state.editedObjects (for composite objects also deletes all of their new subobjects).
     */
    static addExistingSubobject(state: State, objectID: number, update: ParamsAddExistingSubobject): State {
        const { resetEditedObject, subobjectID, row, column } = update;
        let newState = state;

        if (resetEditedObject) {
            newState = getStateWithDeletedEditedNewSubobjects(newState, [subobjectID]);
            newState = getStateWithResetEditedObjects(newState, [subobjectID]);
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
    }

    /** Updates the state of the provided `update.subobjectID` of a composite object `objectID` with the values passed in `update`. */
    static updateSubobject(state: State, objectID: number, update: ParamsUpdateSubobject): State {
        const { subobjectID } = update;
        const subobject = compositeSubobject.parse({ ...state.editedObjects[objectID].composite.subobjects[subobjectID], ...update });
        const subobjects = { ...state.editedObjects[objectID].composite.subobjects, [subobjectID]: subobject };
        const composite = { ...state.editedObjects[objectID].composite, subobjects };
        const editedObject = { ...state.editedObjects[objectID], composite };
        return { ...state, editedObjects: { ...state.editedObjects, [objectID]: editedObject }};
    }

    /**
     * Toggles `is_published` prop of of all edited objects, which are subobjects of a composite object `objectID`,
     * based on the provided `subobjectsIsPublishedState` value.
     * If `subobjectsIsPublishedState` == "yes", sets `is_published` values to false, otherwise - to true.
     */
    static toggleSubobjectsIsPublished(state: State, objectID: number, update: ParamsToggleSubobjectsIsPublished): State {
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
    static setSubobjectsFetchError(state: State, objectID: number, update: ParamsSetSubobjectsFetchError): State {
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
    }

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
    static updatePositionsOnDrop(state: State, objectID: number, update: ParamsUpdatePositionsOnDrop): State {
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
    }

    static updateSubobjectsOnSave(state: State, objectID: number, update: ParamsUpdateSubobjectsOnSave): State {
        throw Error("Not implemented"); // TODO add typed post-update composite data typing or remove
    }

    /**
     * Modifies object data sent via /objects/add & /objects/update fetches 
     * to prepare it for adding to the respective storage/
     */
    static modifyObjectDataPostSave(object_data: ObjectsAddRequestObjectData, object: ObjectsAddResponseBodyObject) {
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
                        const object_id = IDMapping[so.object_id] !== undefined ? IDMapping[so.object_id] : so.object_id;
                        return { ...so, object_id };
                    })
                };
            default:
                return object_data;
        }
    }
}

// TODO swap dispatching function & with handlers (in & out of the class)

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
type ParamsUpdateSubobjectsOnSave = { command: "updateSubobjectsOnSave", object: ObjectsAddResponseBodyObject, object_data: ObjectsAddRequestObjectData };
export type GetUpdatedEditedCompositeParams = ParamsAddNewSubobject | ParamsAddExistingSubobject | ParamsUpdateSubobject | 
    ParamsToggleSubobjectsIsPublished | ParamsSetSubobjectsFetchError | ParamsUpdatePositionsOnDrop | ParamsUpdateSubobjectsOnSave;

export const getUpdatedEditedComposite = (state: State, objectID: number, update: GetUpdatedEditedCompositeParams): State => {
    const { command } = update;
    if (command === "addNewSubobject") return EditedCompositeUpdaters.addNewSubobject(state, objectID, update);
    if (command === "addExistingSubobject") return EditedCompositeUpdaters.addExistingSubobject(state, objectID, update);
    if (command === "updateSubobject") return EditedCompositeUpdaters.updateSubobject(state, objectID, update);
    if (command === "toggleSubobjectsIsPublished") return EditedCompositeUpdaters.toggleSubobjectsIsPublished(state, objectID, update);
    if (command === "setSubobjectsFetchError") return EditedCompositeUpdaters.setSubobjectsFetchError(state, objectID, update);
    if (command === "updatePositionsOnDrop") return EditedCompositeUpdaters.updatePositionsOnDrop(state, objectID, update);
    if (command === "updateSubobjectsOnSave") return EditedCompositeUpdaters.updateSubobjectsOnSave(state, objectID, update);
    throw Error(`Command '${command}' handler not implemented.`);
};
