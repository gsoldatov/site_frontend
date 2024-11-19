import { ToDoListSelectors } from "../selectors/data/objects/to-do-list";
import { ObjectsEditSelectors } from "../selectors/ui/objects-edit";
import { getEditedObjectState } from "../types/data/edited-objects";
/*
    Functions for checking/getting data and UI state for to-do lists.
*/


/**
 * Returns a recursively sorted by state `items` of the `toDoList`. Child items are also sorted, but are kept after the same parent.
 */
const sortByState = (toDoList, items) => {
    // Exit function if an empty item list is passed as an argument
    if (items.length === 0) return [];

    // Get top-level items and their children
    const topLevelIndent = toDoList.items[items[0]].indent;
    let topLevelItems = [], children = {}, currentTopLevelItem;
    for (let i = 0; i < items.length; i++) {
        if (toDoList.items[items[i]].indent === topLevelIndent) {
            currentTopLevelItem = items[i];
            topLevelItems.push(currentTopLevelItem);
            children[currentTopLevelItem] = [];
        } else
            children[currentTopLevelItem].push(items[i]);
    }

    // Sort all children
    let sortedChildren = {};
    for (let i = 0; i < topLevelItems.length; i++) {
        let item = topLevelItems[i];
        sortedChildren[item] = sortByState(toDoList, children[item]);
    }

    // Sort top-level items by state
    let sortedItems = [];
    ["active", "optional", "completed", "cancelled"].forEach(state => {
        sortedItems = sortedItems.concat(topLevelItems.filter(id => toDoList.items[id].item_state === state));
    });

    // Insert sorted children after top-level items
    let i = 0;
    while (i < sortedItems.length) {
        let item = sortedItems[i];
        sortedItems.splice(i + 1, 0, ...sortedChildren[item]);
        i += sortedChildren[item].length + 1;
    }

    // Return sorted list
    return sortedItems;
}


/**
 * Returns the indent of the `toDoList` item, previous to the item with provided `id`.
 * 
 * If `id` = "newItem", returns the indent of the last item in the list.
 * 
 * If item is first in the list, returns -1.
 */
export const getPreviousItemIndent = (toDoList, id) => {
    const itemOrder = ToDoListSelectors.sortedItemIDs(toDoList);

    if (id === "newItem"){
        const prevID = itemOrder[itemOrder.length - 1];
        if (prevID === undefined) return -1;
        return toDoList.items[prevID].indent;
    }

    const index = itemOrder.indexOf(id);
    if (index === 0) return -1;
    else {
        const prevID = itemOrder[index - 1];
        return toDoList.items[prevID].indent;
    }
};



/**
 * Returns an array of children item IDs in the `toDoList` for a provided `id`.
 */
export const getChildrenIDs = (toDoList, id) => {
    let childrenIDs = [];
    const index = toDoList.itemOrder.indexOf(id);
    for (let i = index + 1; i < toDoList.itemOrder.length; i++) {
        const currentID = toDoList.itemOrder[i];
        if (toDoList.items[currentID].indent <= toDoList.items[id].indent) break;
        childrenIDs.push(currentID);
    }
    return childrenIDs;
};


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
