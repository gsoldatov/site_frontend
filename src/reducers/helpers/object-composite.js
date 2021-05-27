import { addEditedObject } from "./object";
import { getNewSubobjectID } from "../../store/state-util/composite";
import { deepCopy } from "../../util/copy";


/*
    Object page functions for updating state of composite objects' and their subobjects.
    Return a fully modified instance of state.
*/
const subobjectDefaults = { row: -1, column: -1, isDeleted: false, deleteMode: "none", showResetDialog: false, selectedTab: 0, fetchError: "" };

export const updateComposite = (state, objectID, update) => {
    const { command } = update;

    // Adds a new subobject with default state to state.editedObjects & composite object data.
    if (command === "addNew") {
        // Add a new edited object
        const newID = getNewSubobjectID(state);
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
    if (command === "addExisting") {
        const { subobjectID, row, column } = update;

        const newSubobjects = { ...state.editedObjects[objectID].composite.subobjects };
        newSubobjects[subobjectID] = { ...deepCopy(subobjectDefaults), row, column };
        
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

    // Sets selected tab of the subobject card
    if (command === "selectTab") {
        const { subobjectID, selectedTab } = update;
        const newSubobjectState = { ...state.editedObjects[objectID].composite.subobjects[subobjectID], selectedTab };

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
}