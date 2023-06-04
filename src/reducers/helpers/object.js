import { deepCopy } from "../../util/copy";
import { defaultEditedObjectState } from "../../store/state-templates/edited-object";
import { getObjectDataFromStore, objectHasNoChanges } from "../../store/state-util/objects";
import { getEditedObjectAndSubobjectIDs } from "../../store/state-util/ui-objects-edit";


/**
 * Returns a deep copy of default edited object state.
 * Sets `object_id`, `display_in_feed` and `owner_id` in the returned object if they are provided as `overrideValues` attributes.
 */
export const getDefaultEditedObjectState = (overrideValues = {}) => {
    const overridableAttributes = ["object_id", "display_in_feed", "owner_id"];

    const defaultState = deepCopy(defaultEditedObjectState);
    for (let attr of overridableAttributes)
        if (attr in overrideValues) defaultState[attr] = overrideValues[attr];
    
    return defaultState;
};


/** 
 * Resets state of edited objects with provided `objectIDs` to their last saved states.
 * 
 * Sets default attribute/tag/data values if `objectID` is not found in respective storage and `allowResetToDefaults` is true.
 * 
 * Throws an Error if attribute/tag/data are not found and `allowResetToDefaults` is false.
 * 
 * If `defaultDisplayInFeed` is provided, all objects without saved object attributes have their `display_in_feed` set to this value.
 */
export const getStateWithResetEditedObjects = (state, objectIDs, { allowResetToDefaults, defaultDisplayInFeed } = {}) => {
    if (objectIDs.length === 0) return state;

    const throwIfDataIsMissing = (data, msg) => {
        if (data === undefined && !allowResetToDefaults)
            throw Error(msg);
    };

    const newEditedObjects = {...state.editedObjects};
    objectIDs.forEach(objectID => {
        const overrideValues = { object_id: objectID };
        if (defaultDisplayInFeed !== undefined) overrideValues.display_in_feed = defaultDisplayInFeed;
        let stateAfterReset = getDefaultEditedObjectState(overrideValues);

        // Set object attributes
        const attributes = state.objects[objectID];
        throwIfDataIsMissing(attributes, `Failed to reset object ${objectID}: attributes are missing.`);
        stateAfterReset = {
            ...stateAfterReset, 
            ...deepCopy(state.objects[objectID] || {})
        };

        // Set object's `owner_id` to current user, if it's not set after attributes reset
        if (stateAfterReset.owner_id <= 0) stateAfterReset.owner_id = state.auth.user_id;
        
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
 * Deletes the specified `objectIDs` from the state.editedObjects and deselects them on the edited page.
 * 
 * Composite objects' subobjects from `objectIDs`, also have all of thier new & unmodified existing non-composite children deleted.
 * 
 * If `deleteAllSubobjects` is true, deletes all non-composite subobjects.
 * 
 * If `excludedObjectIDs` contains an array of object IDs, those objects and their subobjects will not be deleted.
 * 
 * Returns the state after delete(-s).
 */
export const getStateWithRemovedEditedObjects = (state, objectIDs, { deleteAllSubobjects, excludedObjectIDs } = {}) => {
    if (objectIDs.length === 0) return state;

    deleteAllSubobjects = deleteAllSubobjects === undefined ? false : deleteAllSubobjects;
    excludedObjectIDs = excludedObjectIDs === undefined ? [] : excludedObjectIDs;
    let newEditedObjects = { ...state.editedObjects };

    // Exclude subobjects of excluded objects
    const _excludedIDs = getEditedObjectAndSubobjectIDs(state, excludedObjectIDs);

    // Remove objects and their subobjects, if they're not excluded
    objectIDs.forEach(objectID => {
        if (!(objectID in newEditedObjects)) return;
        objectID = parseInt(objectID);

        if (newEditedObjects[objectID].object_type === "composite") {
            Object.keys(newEditedObjects[objectID].composite.subobjects).forEach(subobjectID => {
                subobjectID = parseInt(subobjectID);
                const objectType = newEditedObjects[subobjectID] ? newEditedObjects[subobjectID].object_type : null;
                // Delete subobject if it's not composite
                // AND (all subobjects are set to be deleted OR subobject is new or unmodified existing)
                // AND subobjects is NOT excluded from deletion
                if (objectType !== "composite" &&
                    (
                        deleteAllSubobjects ||
                        subobjectID < 0 || (subobjectID > 0 && objectHasNoChanges(state, subobjectID))
                    )
                    && !_excludedIDs.has(subobjectID))
                    delete newEditedObjects[subobjectID];
            });
        }
    
        if (!_excludedIDs.has(objectID)) delete newEditedObjects[objectID];
    });

    let newState = { ...state, editedObjects: newEditedObjects };

    // Deselect deleted edited objects on the /objects/edited page
    newState = deselectNonExistantEditedObjects(newState);

    return newState;
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
 * If `excludedObjectIDs` is provided, object IDs contained inside it are excluded from deletion
 * 
 * Does nothing if object is not present in state.editedObjects or is not composite.
 */
const getStateWithRemovedUnchangedEditedSubobjects = (state, objectID, { excludedObjectIDs } = {}) => {
    if (state.editedObjects[objectID] === undefined || state.editedObjects[objectID].object_type !== "composite") return state;
    let newEditedObjects = { ...state.editedObjects };
    excludedObjectIDs = excludedObjectIDs === undefined ? [] : excludedObjectIDs;

    // Exclude subobjects of excluded objects
    const _excludedIDs = getEditedObjectAndSubobjectIDs(state, excludedObjectIDs);

    for (let subobjectID of Object.keys(state.editedObjects[objectID].composite.subobjects)) {
        subobjectID = parseInt(subobjectID);
        if (subobjectID > 0 && !_excludedIDs.has(subobjectID) && objectHasNoChanges(state, subobjectID, false)) delete newEditedObjects[subobjectID];
    }
    
    return { ...state, editedObjects: newEditedObjects }; 
};


/**
 * Returns the state with unchanged editedObjects being removed from it.
 * 
 * Expects either `deleteNewObject` = true or `editedObjectID` to be provided.
 * 
 *  - If `deleteNewObject` is true, removes new object and, its new and unchanged existing subobjects, if it's composite;
 *  - if `deleteNewObject` is false:
 *      - if `excludedObjectID` is provided, corresponding object and its subobjects are not removed;
 *      - if object with `editedObjectID` is unchanged:
 *          - removes it;
 *          - removes all subobjects for composite objects;
 *      - if object with `editedObjectID` is changed:
 *          - removes all unchanged subobjects for composite objects.
 */
 export const getStateAfterObjectPageLeave = (state, { deleteNewObject, editedObjectID, excludedObjectID } = {}) => {
    let newState = state;

    // Force delete of new object
    if (deleteNewObject) newState = getStateWithRemovedEditedObjects(newState, [0]);

    // Delete unchanged edited object & subobject data for `editedObjectID`
    else if (editedObjectID !== undefined) {
        const excludedObjectIDs = excludedObjectID !== undefined ? [excludedObjectID] : undefined;
        if (objectHasNoChanges(state, editedObjectID, false)) newState = getStateWithRemovedEditedObjects(newState, [editedObjectID], { excludedObjectIDs });
        else newState = getStateWithRemovedUnchangedEditedSubobjects(newState, editedObjectID, { excludedObjectIDs });
    }

    return newState;
};


/**
 * Returns the state with non-existant edited objects being removed from state.editedObjectsUI.selectedObjectIds.
 */
export const deselectNonExistantEditedObjects = (state) => {
    const newSelectedObjectIDs = new Set([...state.editedObjectsUI.selectedObjectIDs].filter(objectID => objectID in state.editedObjects));
    
    return {
        ...state,
        editedObjectsUI: {
            ...state.editedObjectsUI,
            selectedObjectIDs: newSelectedObjectIDs
        }
    };
};