import { deepCopy } from "../../util/copy";
import { defaultEditedObjectState } from "../../store/state-templates/edited-object";


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
