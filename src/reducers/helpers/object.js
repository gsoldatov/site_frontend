import { deepCopy } from "../../util/copy";
import { defaultEditedObjectState } from "../../store/state-templates/edited-object";
import { getObjectDataFromStore } from "../../store/state-util/objects";
import { objectHasNoChanges } from "../../util/equality-checks";


/*
    Returns a deep copy of default edited object state.
    Sets `object_id` in the returned object if it's provided.
*/
export const getDefaultEditedObjectState = object_id => {
    const defaultState = deepCopy(defaultEditedObjectState);
    if (object_id !== undefined) defaultState.object_id = object_id;
    return defaultState;
}


// Inserts an object with default state into state.editedObjects
export const addEditedObject = (state, objectID) => {
    const defaultState = getDefaultEditedObjectState(objectID);

    return {
        ...state,
        editedObjects: {
            ...state.editedObjects,
            [objectID]: defaultState
        }
    };
};


// Resets state of edited objects with provided `objectIDs` to their last saved states.
// Does not reset new subobjects (with `objectID` < 0).
export const resetEditedObjects = (state, objectIDs) => {
    const newEditedObjects = {...state.editedObjects};
    objectIDs.forEach(objectID => {
        if (objectID < 0) return;

        let stateAfterReset = getDefaultEditedObjectState(objectID);

        if (objectID in state.objects)  // set attributes
            stateAfterReset = {
                ...stateAfterReset, 
                ...deepCopy(state.objects[objectID])
            };
        
        if (objectID in state.objectsTags)  // set current object tags (added & removed tags are already reset)
            stateAfterReset = {
                ...stateAfterReset,
                currentTagIDs: state.objectsTags[objectID].slice()
            };
        
        const objectData = getObjectDataFromStore(state, objectID);     // set object data
        if (objectData !== undefined)
            stateAfterReset = {
                ...stateAfterReset,
                ...objectData
            };
        
        newEditedObjects[objectID] = stateAfterReset;
    });

    return { ...state, editedObjects: newEditedObjects };
};


// Deletes the specified `objectID` from the state.editedObjects.
// If the object corresponding to the `objectID` is composite, also deletes all of its new & unmodified existing children.
// Returns the state after delete(-s).
export const removeEditedObject = (state, objectID) => {
    if (!(objectID in state.editedObjects)) return state;

    let newEditedObjects = { ...state.editedObjects };

    if (newEditedObjects[objectID].object_type === "composite") {
        Object.keys(newEditedObjects[objectID].composite.subobjects).forEach(subobjectID => {
            const intSubobjectID = parseInt(subobjectID);
            if (intSubobjectID < 0 || (intSubobjectID > 0 && objectHasNoChanges(state, intSubobjectID)))
                delete newEditedObjects[subobjectID];
        });
    }

    delete newEditedObjects[objectID];

    return {
        ...state,
        editedObjects: newEditedObjects
    };
};
