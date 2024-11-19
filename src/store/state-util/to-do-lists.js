import { ObjectsEditSelectors } from "../selectors/ui/objects-edit";
import { getEditedObjectState } from "../types/data/edited-objects";


/**
 * Returns an insert position in `toDoList.itemOrder` list for an item, resulting in merge of items with ids `first` and `second`.
 */
export const getMergedItemInsertPosition = (toDoList, first, second) => {
    // For default sort always insert at the position of `first`
    if (toDoList.sort_type === "default") return toDoList.itemOrder.indexOf(first);

    if (toDoList.sort_type === "state") {
        const posFirst = toDoList.itemOrder.indexOf(first), posSecond = toDoList.itemOrder.indexOf(second);

        // If `first` is before `second`, insert at the position of `first`
        if (posFirst < posSecond) return posFirst;

        // If `first` is after `second`, insert at the position of `first` and move if left, 
        // because `second` will be removed and there'll be one item less before insertPosition in the new itemOrder
        else return posFirst - 1;
    }

    throw Error("getMergedItemInsertPosition() failed to return an insert position");
};


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
