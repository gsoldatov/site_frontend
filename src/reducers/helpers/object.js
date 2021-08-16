import { deepCopy } from "../../util/copy";
import { defaultEditedObjectState } from "../../store/state-templates/edited-object";
import { getObjectDataFromStore, objectHasNoChanges } from "../../store/state-util/objects";


/**
 * Returns a deep copy of default edited object state.
 * Sets `object_id` in the returned object if it's provided.
 */
export const getDefaultEditedObjectState = object_id => {
    const defaultState = deepCopy(defaultEditedObjectState);
    if (object_id !== undefined) defaultState.object_id = object_id;
    return defaultState;
};


/** 
 * Resets state of edited objects with provided `objectIDs` to their last saved states.
 * 
 * Sets default attribute/tag/data values if `objectID` is not found in respective storage and `allowResetToDefaults` is true.
 * 
 * Throws an Error if attribute/tag/data are not found and `allowResetToDefaults` is false.
 */
export const getStateWithResetEditedObjects = (state, objectIDs, allowResetToDefaults) => {
    if (objectIDs.length === 0) return state;

    const throwIfDataIsMissing = (data, msg) => {
        if (data === undefined && !allowResetToDefaults)
            throw Error(msg);
    };

    const newEditedObjects = {...state.editedObjects};
    objectIDs.forEach(objectID => {
        let stateAfterReset = getDefaultEditedObjectState(objectID);

        // Set object attributes
        const attributes = state.objects[objectID];
        throwIfDataIsMissing(attributes, `Failed to reset object ${objectID}: attributes are missing.`);
        stateAfterReset = {
            ...stateAfterReset, 
            ...deepCopy(state.objects[objectID] || {})
        };
        
        // Set object's current tags (added & removed tags are already reset)
        const tags = state.objectsTags[objectID];
        throwIfDataIsMissing(tags, `Failed to reset object ${objectID}: tags are missing.`);
        stateAfterReset = {
            ...stateAfterReset,
            currentTagIDs: (tags || []).slice()
        };
        
        // Set object data
        const data = getObjectDataFromStore(state, objectID, true);
        throwIfDataIsMissing(data, `Failed to reset object ${objectID}: data is missing.`);
        stateAfterReset = {
            ...stateAfterReset,
            ...(data || {})
        };
        
        newEditedObjects[objectID] = stateAfterReset;
    });

    return { ...state, editedObjects: newEditedObjects };
};


/** 
 * Deletes the specified `objectIDs` from the state.editedObjects.
 * 
 * Composite objects' subobjects from `objectIDs`, also have all of thier new & unmodified existing non-composite children deleted.
 * 
 * If `deleteAllSubobjects` is true, deletes all non-composite subobjects.
 * 
 * Returns the state after delete(-s).
 */
export const getStateWithRemovedEditedObjects = (state, objectIDs, deleteAllSubobjects) => {
    if (objectIDs.length === 0) return state;

    let newEditedObjects = { ...state.editedObjects };

    objectIDs.forEach(objectID => {
        if (!(objectID in newEditedObjects)) return;

        if (newEditedObjects[objectID].object_type === "composite") {
            Object.keys(newEditedObjects[objectID].composite.subobjects).forEach(subobjectID => {
                subobjectID = parseInt(subobjectID);
                const objectType = newEditedObjects[subobjectID] ? newEditedObjects[subobjectID].object_type : null;
                // Delete subobject if it's not composite AND 
                // (all subobjects are set to be deleted OR subobject is new or unmodified existing)
                if (objectType !== "composite" &&
                    (
                        deleteAllSubobjects ||
                        subobjectID < 0 || (subobjectID > 0 && objectHasNoChanges(state, subobjectID))
                    ))
                    delete newEditedObjects[subobjectID];
            });
        }
    
        delete newEditedObjects[objectID];
    });

    return { ...state, editedObjects: newEditedObjects };
};


/** 
 * Deletes all new subobjects of each composite object in `objectIDs` from state.editedObjects.
 * 
 * Returns the state after deletes.
 */
export const getStateWithDeletedEditedNewSubobjects = (state, objectIDs) => {
    if (objectIDs.length === 0) return state;
    let newEditedObjects = { ...state.editedObjects };

    objectIDs.forEach(objectID => {
        if (!(objectID in newEditedObjects)) return;

        // Non-composite objects' check is required for deleting new subobjects of a new object, if its type was switched from composite before save.
        // if (!(objectID in newEditedObjects) || newEditedObjects[objectID].object_type !== "composite") return;

        Object.keys(newEditedObjects[objectID].composite.subobjects).forEach(subobjectID => {
            if (parseInt(subobjectID) < 0) delete newEditedObjects[subobjectID];
        });
    });

    return { ...state, editedObjects: newEditedObjects };
};


/**
 * Resets all edited existing non-composite subobjects of each composite object in `objectIDs` from state.editedObjects.
 * 
 * Removes edited existing non-composite subobjects, which were added since last save.
 * 
 * Returns the state after resets.
 */
export const getStateWithResetEditedExistingSubobjects = (state, objectIDs) => {
    if (objectIDs.length === 0) return state;
    let resetIDs = new Set(), deletedIDs = new Set();

    objectIDs.forEach(objectID => {
        if (!(objectID in state.editedObjects) || state.editedObjects[objectID].object_type !== "composite") return;
        const editedSubobjectIDs = Object.keys(state.editedObjects[objectID].composite.subobjects);
        // Get subobjects from last saved state; if objectID is not in composite for some reason, all subobjects are deleted
        const savedSubobjectIDs = objectID in state.composite ? Object.keys(state.composite[objectID].subobjects) : [];

        editedSubobjectIDs.forEach(subobjectID => {
            const subobjectObjectType = subobjectID in state.editedObjects ? state.editedObjects[subobjectID].object_type: "composite";  // don't delete or reset subobjects which are not present in editedObjects

            if (parseInt(subobjectID) > 0 && subobjectObjectType !== "composite") {
                const idAddedAfterSave = savedSubobjectIDs.indexOf(subobjectID) === -1;
                if (idAddedAfterSave) deletedIDs.add(subobjectID);
                else resetIDs.add(subobjectID);
            }
        });
    });

    // Delete composite subobjects which will be deleted from their parent objects after reset
    let newState = getStateWithRemovedEditedObjects(state, [...deletedIDs]);

    // Reset composite subobjects which will remain after their parent objects are reset
    newState = getStateWithResetEditedObjects(newState, [...resetIDs]);

    return newState;
};


/**
 * Returns state after all unchanged existing subobjects of an object `objectID` were removed.
 * 
 * Does nothing if object is not present in state.editedObjects or is not composite.
 */
const getStateWithRemovedUnchangedEditedSubobjects = (state, objectID) => {
    if (state.editedObjects[objectID] === undefined || state.editedObjects[objectID].object_type !== "composite") return state;
    let newEditedObjects = { ...state.editedObjects };

    for (let subobjectID of Object.keys(state.editedObjects[objectID].composite.subobjects)) {
        if (parseInt(subobjectID) > 0 && objectHasNoChanges(state, subobjectID, false)) delete newEditedObjects[subobjectID];
    }
    
    return { ...state, editedObjects: newEditedObjects }; 
};


/**
 * Returns the state with unchanged editedObjects being removed from it.
 *  - If `deleteNewObject` is true, removes new object and, its new and unchanged existing subobjects, if it's composite;
 *  - if `deleteNewObject` is false:
 *      - if current edited object is unchanged:
 *          - removes it;
 *          - removes all subobjects for composite objects;
 *      - if current edited object is changed:
 *          - removes all unchanged subobjects for composite objects.
 */
 export const getStateAfterObjectPageLeave = (state, deleteNewObject) => {
    const currentObjectID = state.objectUI.currentObjectID;
    let newState = state;

    // Force delete of new object
    if (deleteNewObject) newState = getStateWithRemovedEditedObjects(newState, [0]);
    else {
        if (objectHasNoChanges(state, currentObjectID, false)) newState = getStateWithRemovedEditedObjects(newState, [currentObjectID]);
        else newState = getStateWithRemovedUnchangedEditedSubobjects(newState, currentObjectID);
    }

    return newState;
};
