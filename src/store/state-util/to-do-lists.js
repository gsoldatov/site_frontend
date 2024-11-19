import { getEditedObjectState } from "../types/data/edited-objects";


/**
 * Accepts current `state`, `objectID` and `toDoList` object with a to-do list object data and returns an object with attributes and data serialized for update fetch.
 * 
 * TODO move to transformers?
 */
export const getToDoListUpdateFetchBody = (state, objectID, toDoList) => {
    return getEditedObjectState({...state.objects[objectID], toDoList});
};
