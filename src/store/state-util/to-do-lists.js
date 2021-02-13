/*
    Functions for checking/getting data from a to-do list state.
*/


// Accepts a to-do list object and returns the IDs of its items sorted according to its current sort_type.
export const getSortedItemIDs = toDoList => {
    let sortedItems;

    if (toDoList.sort_type === "default") sortedItems = [...toDoList.itemOrder];

    if (toDoList.sort_type === "state") {
        sortedItems = [];
        ["active", "optional", "completed", "cancelled"].forEach(state => {
            sortedItems = sortedItems.concat(toDoList.itemOrder.filter(id => toDoList.items[id].item_state === state));
        });
    }

    return sortedItems;
};


// Returns a new value to use as an item id
export const getNewItemID = toDoList => toDoList.itemOrder.length > 0 ? Math.max(...toDoList.itemOrder) + 1 : 0;


// Returns the indent of the item previous to the item with provided `id` (TODO filter collapsed items?).
// If `id` = "newItem", returns the indent of the last item in the list.
// If item is first in the list, returns -1.
export const getPreviousItemIndent = (toDoList, id) => {
    const itemOrder = getSortedItemIDs(toDoList);

    if (id === "newItem"){
        const prevID = itemOrder[itemOrder.length - 1];
        return toDoList.items[prevID].indent;
    }

    const index = itemOrder.indexOf(id);
    if (index === 0) return -1;
    else {
        const prevID = itemOrder[index - 1];
        return toDoList.items[prevID].indent;
    }
};
