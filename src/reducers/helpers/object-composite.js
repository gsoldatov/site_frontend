import { getStateWithAddedObjects, getStateWithAddedObjectsData, getStateWithDeletedObjects } from "./data-objects";
import { getStateWithDeletedEditedNewSubobjects, getStateWithResetEditedObjects } from "./object";

import { enumDeleteModes, subobjectDefaults } from "../../store/state-templates/composite-subobjects";
import { getNewSubobjectID } from "../../store/state-util/composite";
import { objectHasNoChanges } from "../../store/state-util/objects";
import { deepCopy } from "../../util/copy";


/**
 * Processes update commands for a composite object and its subobjects and returns the state after updates.
 */
export const getStateWithCompositeUpdate = (state, objectID, update) => {
    const { command } = update;

    // Adds a new subobject with default state to state.editedObjects & composite object data.
    if (command === "addNew") {
        // Add a new edited object
        const newID = update.subobjectID !== undefined ? update.subobjectID : getNewSubobjectID(state);     // take existing subobjectID if it's passed
        let newState = getStateWithResetEditedObjects(state, [newID], true);
        
        // Add the new object to composite data
        let newCompositeData = {
            ...state.editedObjects[objectID].composite,
            subobjects: { ...state.editedObjects[objectID].composite.subobjects }
        };

        const { row, column } = update;
        newCompositeData.subobjects[newID] = { ...deepCopy(subobjectDefaults), row, column };

        newState.editedObjects[objectID] = {
            ...newState.editedObjects[objectID],
            composite: newCompositeData
        };

        return newState;
    }

    // Adds an existing subobject to the composite object
    // If `resetEditedObject` is set to true, resets the object in state.editedObjects
    if (command === "addExisting") {
        const { resetEditedObject, subobjectID, row, column } = update;
        let newState = state;
        console.log(`IN addExisting command for object ${objectID}`)
        console.log(`resetEditedObject = ${resetEditedObject}, subobjectID = ${subobjectID}, row = ${row}, column = ${column}`)

        if (resetEditedObject) newState = getStateWithResetEditedObjects(state, [subobjectID]);
        const newSubobjects = { ...newState.editedObjects[objectID].composite.subobjects };
        newSubobjects[subobjectID] = { ...deepCopy(subobjectDefaults), row, column };
        
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

    // Updates the state of the provided `subobjectID` with the provided attribute values
    if (command === "updateSubobject") {
        const { subobjectID } = update;
        const oldSubobjectState = state.editedObjects[objectID].composite.subobjects[subobjectID];
        if (oldSubobjectState === undefined) return state;
        
        const newSubobjectState = { ...oldSubobjectState };
        for (let attr of Object.keys(subobjectDefaults))
            if (update[attr] !== undefined) newSubobjectState[attr] = update[attr];
        
        return {
            ...state,
            editedObjects: {
                ...state.editedObjects,
                [objectID]: {
                    ...state.editedObjects[objectID],
                    composite: {
                        ...state.editedObjects[objectID].composite,
                        subobjects: {
                            ...state.editedObjects[objectID].composite.subobjects,
                            [subobjectID]: newSubobjectState
                        }
                    }
                }
            }
        };
    }

    // Updates `fetchError` values of the provided `subobjectIDs`
    if (command === "setFetchError") {
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

    // Updates state after add or update of a composite object:
    // - removes any new subobjects from state.editedObjects if the main object is not composite (for when it was changed after subobject creation);
    // 
    // - removes fully deleted and unchanged deleted existing subobjects from state;
    // - updates new & modified subobjects in state.editedObjects (maps subobject IDs & created_at & modified_at timestamps);
    // - adds new & modified subobject attributes & data to state storages;
    // - maps subobject IDs of the saved composite object and removes deleted subobjects in state.editedObjects[objectID];
    // - updates subobject row positions in state.editedObjects[objectID].
    // Object attributes, tags & data of the saved object are added to the storages in the add/update fetch functions.
    if (command === "updateSubobjectsOnSave") {
        // `object` contains response object attributes & data, `object_data` contains object data as it was sent in request
        const { object, object_data } = update;

        // If object is not composite, delete any new subobjects which were created before object type was changed
        if (object.object_type !== "composite") return getStateWithDeletedEditedNewSubobjects(state, [objectID]);
        let newState = state;

        // Remove unchanged (non-fully) deleted existing objects from state
        let subobjectIDs = Object.keys(newState.editedObjects[objectID].composite.subobjects);
        let deletedExistingSubobjectIDsWithoutChanges = subobjectIDs.filter(subobjectID => parseInt(subobjectID) > 0 
                                                        && newState.editedObjects[objectID].composite.subobjects[subobjectID].deleteMode === enumDeleteModes.subobjectOnly
                                                        && objectHasNoChanges(newState, subobjectID));

        newState = getStateWithDeletedObjects(newState, deletedExistingSubobjectIDsWithoutChanges);
        
        // Remove fully deleted existing objectsfrom state
        let fullyDeletedExistingSubobjectIDs = subobjectIDs.filter(subobjectID => {
            return parseInt(subobjectID) > 0 && newState.editedObjects[objectID].composite.subobjects[subobjectID].deleteMode === enumDeleteModes.full
        });
        newState = getStateWithDeletedObjects(newState, fullyDeletedExistingSubobjectIDs);

        // Map new subobject IDs in state.editedObjects and update object_id, created_at & modified_at values
        const objectUpdateTimeStamp = object.modified_at;
        const IDMapping = object.object_data.id_mapping;
        const modifiedExistingSubobjectIDs = object_data.subobjects.filter(so => so.object_id > 0 && so.object_name !== undefined).map(so => so.object_id);
        let newEditedObjects = {};
        for (let oldObjectID of Object.keys(newState.editedObjects)) {
            const intOldObjectID = parseInt(oldObjectID);
            const isNewSubobject = IDMapping[oldObjectID] !== undefined;
            const isModifiedExistingSubobject = modifiedExistingSubobjectIDs.indexOf(parseInt(oldObjectID)) > -1;

            // If edited object was a new subobject, copy it, update its ID and add created_at & modified_at values
            if (isNewSubobject) {
                const newObjectID = IDMapping[oldObjectID];
                newEditedObjects[newObjectID] = { ...newState.editedObjects[oldObjectID] };
                newEditedObjects[newObjectID].object_id = newObjectID;
                newEditedObjects[newObjectID].created_at = objectUpdateTimeStamp;
                newEditedObjects[newObjectID].modified_at = objectUpdateTimeStamp;
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
        newState = { ...newState, editedObjects: newEditedObjects };

        // Filter new & modified existing subobjects and map new subobject IDs from object_data
        let subobjectsToAddToState = object_data.subobjects.filter(so => so.object_name !== undefined).map(so => {
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
        newState = getStateWithAddedObjects(newState, subobjectsToAddToState);
        newState = getStateWithAddedObjectsData(newState, subobjectsToAddToState);
        
        // Map subobjectIDs of the composite object and remove deleted subobjects in state.editedObjects[objectID].
        // Update row positions of non-deleted objects.
        const newRowPositions = {};
        object_data.subobjects.forEach(so => {
            newRowPositions[so.object_id] = so.row;
        });
        const newComposite = { ...newState.editedObjects[objectID].composite };
        const newSubobjects = {};
        Object.keys(newComposite.subobjects).forEach(subobjectID => {
            // Filter out deleted subobjects
            if (deletedExistingSubobjectIDsWithoutChanges.indexOf(subobjectID) > -1 || fullyDeletedExistingSubobjectIDs.indexOf(subobjectID) > -1) return;

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
    }
}