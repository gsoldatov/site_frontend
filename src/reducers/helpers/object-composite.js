import { addObjectsToState, addObjectDataToState } from "./data-objects";
import { addEditedObject, resetEditedObjects } from "./object";

import { subobjectDefaults } from "../../store/state-templates/composite-subobjects";
import { getNewSubobjectID } from "../../store/state-util/composite";
import { deepCopy } from "../../util/copy";


/*
    Object page functions for updating state of composite objects' and their subobjects.
    Return a fully modified instance of state.
*/
export const updateComposite = (state, objectID, update) => {
    const { command } = update;

    // Adds a new subobject with default state to state.editedObjects & composite object data.
    if (command === "addNew") {
        // Add a new edited object
        const newID = update.subobjectID !== undefined ? update.subobjectID : getNewSubobjectID(state);     // take existing subobjectID if it's passed
        let newState = addEditedObject(state, newID);
        
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

        if (resetEditedObject) newState = resetEditedObjects(state, [subobjectID]);
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
    // - updates new & modified subobjects in state.editedObjects (maps subobject IDs & created_at & modified_at timestamps);
    // - adds new & modified subobject attributes & data to state storages;
    // - maps subobject IDs of the saved composite objects in state.editedObjects[objectID].
    //
    // Object attributes, tags & data of the saved object are added to the storages in the add/update fetch functions.
    if (command === "updateSubobjectsOnSave") {
        // `object` contains response object attributes & data, `object_data` contains object data as it was sent in request
        const { object, object_data } = update;

        // Exit if object is not composite
        if (object.object_type !== "composite") return state;

        // Map new subobject IDs in state.editedObjects and update created_at & modified_at values
        const objectUpdateTimeStamp = object.modified_at;
        const IDMapping = object.object_data.id_mapping;
        const modifiedExistingSubobjectIDs = object_data.subobjects.filter(so => so.object_id > 0 && so.object_name !== undefined).map(so => so.object_id);
        let newEditedObjects = {};
        for (let oldObjectID of Object.keys(state.editedObjects)) {
            const intOldObjectID = parseInt(oldObjectID);
            const isNewSubobject = IDMapping[oldObjectID] !== undefined;
            const isModifiedExistingSubobject = modifiedExistingSubobjectIDs.indexOf(parseInt(oldObjectID)) > -1;

            // If edited object was a new subobject, copy it, update its ID and add created_at & modified_at values
            if (isNewSubobject) {
                const newObjectID = IDMapping[oldObjectID];
                newEditedObjects[newObjectID] = { ...state.editedObjects[oldObjectID] };
                newEditedObjects[newObjectID].created_at = objectUpdateTimeStamp;
                newEditedObjects[newObjectID].modified_at = objectUpdateTimeStamp;
            }
            // If edited object was an existing modified subobject, copy it and update its modified_at value
            else if (isModifiedExistingSubobject) {
                newEditedObjects[oldObjectID] = { ...state.editedObjects[oldObjectID] };
                newEditedObjects[oldObjectID].modified_at = objectUpdateTimeStamp;
            }
            // If edited object was not updated, do not copy it
            else {
                newEditedObjects[oldObjectID] = state.editedObjects[oldObjectID];
            }
        }
        let newState = { ...state, editedObjects: newEditedObjects };

        // Filter new & modified existing subobjects and map new subobject IDs from object_data
        let subobjectsToAddToState = object_data.subobjects.filter(so => so.object_name !== undefined).map(so => {
            const newSO = deepCopy(so);
            const newObjectID = IDMapping[so.object_id];
            if (newObjectID !== undefined) {
                newSO.object_id = newObjectID;
                newSO.created_at = objectUpdateTimeStamp;
                newSO.modified_at = objectUpdateTimeStamp;
            } else {
                newSO.created_at = state.objects[so.object_id].created_at;
                newSO.modified_at = objectUpdateTimeStamp;
            }
            return newSO;
        });

        // Add new & modified existing attributes & data to state
        newState = addObjectsToState(newState, subobjectsToAddToState);
        newState = addObjectDataToState(newState, subobjectsToAddToState);
        
        // Map subobjectIDs for the composite object in state.editedObjects[objectID]
        const newComposite = { ...newState.editedObjects[objectID].composite };
        const newSubobjects = {};
        Object.keys(newComposite.subobjects).forEach(subobjectID => {
            if (subobjectID in IDMapping)
                newSubobjects[IDMapping[subobjectID]] = newComposite.subobjects[subobjectID];
            else
                newSubobjects[subobjectID] = newComposite.subobjects[subobjectID];
        });
        newComposite.subobjects = newSubobjects;

        newState = {
            ...state,
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