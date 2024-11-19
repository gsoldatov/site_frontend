import { ObjectsEditSelectors } from "../selectors/ui/objects-edit";
import { getEditedObjectState } from "../types/data/edited-objects";


/**
 * Returns a selector for checking if to-do list drag and drop functionality is enabled.
 */
export const getIsTDLDragAndDropEnabledSelector = objectID => state => !ObjectsEditSelectors.isFetching(state) 
    && ObjectsEditSelectors.editedOrDefaultSelector(objectID)(state).toDoList.sort_type === "default";


/**
 * Accepts current `state`, `objectID` and `toDoList` object with a to-do list object data and returns an object with attributes and data serialized for update fetch.
 */
export const getToDoListUpdateFetchBody = (state, objectID, toDoList) => {
    return getEditedObjectState({...state.objects[objectID], toDoList});
};
