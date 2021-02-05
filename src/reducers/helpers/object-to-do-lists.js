import { getSortedItemIDs, getNewItemID } from "../../store/state-util/to-do-lists";


/*
    Object page functions for manipulating to-do list's state.
*/
// If a mutable prop is added, getNewToDoListItems should be updated to get its copy, rather than the original.
const itemDefaults = { item_state: "active", item_text: "", commentary: "", indent: 0, is_expanded: true };
/*
    Performs an update on items and other props of provided `toDoList` and returns a new to-do list object.
    `update` is an object with `command` prop with the type of update to perform, as well as additional props specifying the update.
*/
export const updateToDoListItems = (toDoList, update) => {
    // Adds a new item after the item with provided `id`. 
    // Sets the properties of the new item with provided properties or uses values stored in `itemDefaults`.
    // Focuses the new item and sets the caret at the end of it.
    if (update.command === "add") {
        const newItem = {};
        Object.keys(itemDefaults).forEach(k => {
            newItem[k] = update[k] !== undefined ? update[k] : itemDefaults[k];
        });

        const position = update.position !== undefined
            ? update.position
            : toDoList.itemOrder.indexOf(update.id) + 1;

        const newID = getNewItemID(toDoList);
        const newItemOrder = [...toDoList.itemOrder];
        newItemOrder.splice(position, 0, newID);
        return {
            ...toDoList,
            setFocusOnID: newID,
            itemOrder: newItemOrder,
            items: {...toDoList.items, [newID]: newItem }
        };
    }

    // Updates the properties of the item with provided `id` to values passed in the props.
    if (update.command === "update") {
        const newItem = {};
        Object.keys(itemDefaults).forEach(k => {
            newItem[k] = update[k] !== undefined ? update[k] : toDoList.items[update.id][k];
        });
        return {
            ...toDoList,
            items: { ...toDoList.items, [update.id]: newItem }
        };
    }

    // Deletes the item with provided `id`.
    // If `setFocus` is set to "prev" or "next", focuses the item before or after the deleted and places caret at the end of it.
    if (update.command === "delete") {
        const newItemOrder = toDoList.itemOrder.filter(id => id !== update.id);
        const newItems = {...toDoList.items};
        delete newItems[update.id];

        // Set focus (for Delete & Backspace key press handling)
        let setFocusOnID = toDoList.setFocusOnID;
        if (["prev", "next"].includes(update.setFocus)) {
            if (toDoList.itemOrder.length > 1) {
                const deletedPosition = toDoList.itemOrder.indexOf(update.id);
                const focusedPosition = update.setFocus === "prev"                  // position to focus after item is deleted
                    ? Math.max(deletedPosition - 1, 0)                              // prev: 0 => 0, i => i - 1, max => max - 1
                    : Math.min(deletedPosition, toDoList.itemOrder.length - 2);     // next: 0 => 0, i => i, max => max - 1 (-2 in a new list)
                setFocusOnID = newItemOrder[focusedPosition];
            } else {
                setFocusOnID = "newItem";   // if no items remain, focus new item input
            }
        }

        return {
            ...toDoList,
            setFocusOnID,
            itemOrder: newItemOrder,
            items: newItems
        };
    }

    // Focuses the item before the item with provided `id`.
    // If `focusLastItem` is set to true, focuses the last item of the list.
    // If current sort_type is "default", selects previous item in the default item order.
    // If current sort_type is "state", selects the previous item with the same state, then selects the last item with the previous state type.
    // State order is: "active" -> "optional" -> "completed" -> "cancelled".
    if (update.command === "focusPrev") {
        const sortedItemIDs = getSortedItemIDs(toDoList);

        if (update.focusLastItem) {     // move from new item item to the last existing item
            if (sortedItemIDs.length === 0) return toDoList;
            return { ...toDoList, setFocusOnID: sortedItemIDs[sortedItemIDs.length - 1] };
        }

        const position = sortedItemIDs.indexOf(update.id);
        return {
            ...toDoList,
            setFocusOnID: position <= 0 ? sortedItemIDs[0] : sortedItemIDs[position - 1],
            caretPositionOnFocus: update.caretPositionOnFocus > -1 ? update.caretPositionOnFocus : toDoList.caretPositionOnFocus
        };
    }

    // Focuses the item after the item with provided `id`.
    // If current sort_type is "default", selects next item. If `id` refers to the last item in the list, new item input is focused.
    // If current sort_type is "state", selects the next item with the same state, then selects the first item with the following state type or a new item input.
    // State order is: "active" -> "optional" -> "completed" -> "cancelled".
    if (update.command === "focusNext") {
        const sortedItemIDs = getSortedItemIDs(toDoList);
        const position = sortedItemIDs.indexOf(update.id);
        if (position < 0) return toDoList;
        return {
            ...toDoList,
            setFocusOnID: position < sortedItemIDs.length - 1 ? sortedItemIDs[position + 1] : "newItem",   // handle item -> item + 1 and item -> newItem cases
            caretPositionOnFocus: position < toDoList.itemOrder.length - 1 && update.caretPositionOnFocus > -1
                ? update.caretPositionOnFocus       // update caretPositionOnFocus if it's provided and an existing item is selected
                : toDoList.caretPositionOnFocus
        };
    }

    // Replaces item with the provided `id` by two new items.
    // New items receive the texts contained in `before` and `after` (which should contain the text before and after the caret in the replaced item).
    // New items have the same state as the replaced item.
    // Focuses the second new item and places the caret at its beginning.
    if (update.command === "split") {
        const newCurrID = getNewItemID(toDoList);
        const newItemOrder = [...toDoList.itemOrder];
        const position = newItemOrder.indexOf(update.id);
        newItemOrder.splice(position, 1, newCurrID, newCurrID + 1);
        
        const newItems = {...toDoList.items};
        delete newItems[update.id];
        const item_state = toDoList.items[update.id].item_state;
        newItems[newCurrID] = {...itemDefaults, item_text: update.before, item_state};
        newItems[newCurrID + 1] = {...itemDefaults, item_text: update.after, item_state};

        return {
            ...toDoList,
            setFocusOnID: newCurrID + 1,
            caretPositionOnFocus: 0,
            itemOrder: newItemOrder,
            items: newItems
        };
    }

    // Replaces the item with provided `id` and the item before it with a new item.
    // Which item is before the item with `id` depends on the current sort_type.
    // New item text contains the merged texts of the replaced items.
    // New item state is the same as the state of replaced item, previous to the item with the `id`.
    // New item is focused and caret is placed between at the border of the old items' texts.
    if (update.command === "mergeWithPrev") {
        const sortedItemIDs = getSortedItemIDs(toDoList);
        const position = sortedItemIDs.indexOf(update.id);
        if (position === 0) return toDoList;

        const prevID = sortedItemIDs[position - 1];
        const newCurrID = getNewItemID(toDoList);
        const newPosition = toDoList.itemOrder.indexOf(prevID);
        const newItemOrder = toDoList.itemOrder.filter(id => id !== prevID && id !== update.id);
        newItemOrder.splice(newPosition, 0, newCurrID);

        const newItem = {
            ...itemDefaults,
            item_text: toDoList.items[prevID].item_text + toDoList.items[update.id].item_text,
            item_state: toDoList.items[prevID].item_state
        };
        const newItems = {...toDoList.items, [newCurrID]: newItem };
        delete newItems[update.id];
        delete newItems[prevID];

        return {
            ...toDoList,
            setFocusOnID: newCurrID,
            caretPositionOnFocus: toDoList.items[prevID].item_text.length,
            itemOrder: newItemOrder,
            items: newItems
        };
    }

    // Replaces the item with provided `id` and the item after it with a new item.
    // Which item is after the item with `id` depends on the current sort_type.
    // New item text contains the merged texts of the replaced items.
    // New item state is the same as the state of replaced item with the `id`.
    // New item is focused and caret is placed between at the border of the old items' texts.
    if (update.command === "mergeWithNext") {
        const sortedItemIDs = getSortedItemIDs(toDoList);
        const position = sortedItemIDs.indexOf(update.id);
        if (position === sortedItemIDs.length - 1) return toDoList;

        const nextID = sortedItemIDs[position + 1];
        const newCurrID = getNewItemID(toDoList);
        const newItemOrder = toDoList.itemOrder.filter(id => id !== update.id && id !== nextID);
        newItemOrder.splice(position, 0, newCurrID);
        
        const newItem = {
            ...itemDefaults,
            item_text: toDoList.items[update.id].item_text + toDoList.items[nextID].item_text,
            item_state: toDoList.items[update.id].item_state
        };
        const newItems = {...toDoList.items, [newCurrID]: newItem };
        delete newItems[update.id];
        delete newItems[nextID];

        return {
            ...toDoList,
            setFocusOnID: newCurrID,
            caretPositionOnFocus: toDoList.items[update.id].item_text.length,
            itemOrder: newItemOrder,
            items: newItems
        };
    }

    // Moves the item with id = `movedID` before the item with id = `targetID`.
    // If `targetLastItem` == true, moves the item to the end of the item list (has a higher priority than `targetID`).
    // Supports only the default sort_type of the list.
    if (update.command === "moveItems") {
        const newItemOrder = [...toDoList.itemOrder];
        const movedPosition = newItemOrder.indexOf(update.movedID);
        newItemOrder.splice(movedPosition, 1);
        const targetPosition = update.targetLastItem ? newItemOrder.length : newItemOrder.indexOf(update.targetID);
        newItemOrder.splice(targetPosition, 0, update.movedID);
        return {
            ...toDoList,
            itemOrder: newItemOrder
        };
    }
};
