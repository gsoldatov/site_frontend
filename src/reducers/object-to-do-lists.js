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

        const newID = getNewID(toDoList.itemOrder);
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
    if (update.command === "focusPrev") {
        if (update.focusLastItem) {     // move from new item item to the last existing item
            if (toDoList.itemOrder.length === 0) return toDoList;
            return { ...toDoList, setFocusOnID: toDoList.itemOrder[toDoList.itemOrder.length - 1] };
        }

        const position = toDoList.itemOrder.indexOf(update.id);
        return {
            ...toDoList,
            setFocusOnID: position <= 0 ? toDoList.itemOrder[0] : toDoList.itemOrder[position - 1],
            caretPositionOnFocus: update.caretPositionOnFocus > -1 ? update.caretPositionOnFocus : toDoList.caretPositionOnFocus
        };
    }

    // Focuses the item after the item with provided `id`.
    // If `id` refers to the last item in the list, new item input is focused.
    if (update.command === "focusNext") {
        const position = toDoList.itemOrder.indexOf(update.id);
        if (position < 0) return toDoList;
        return {
            ...toDoList,
            setFocusOnID: position < toDoList.itemOrder.length - 1 ? toDoList.itemOrder[position + 1] : "newItem",   // handle item -> item + 1 and item -> newItem cases
            caretPositionOnFocus: position < toDoList.itemOrder.length - 1 && update.caretPositionOnFocus > -1
                ? update.caretPositionOnFocus       // update caretPositionOnFocus if it's provided and an existing item is selected
                : toDoList.caretPositionOnFocus
        };
    }

    // Replaces item with the provided `id` by two new items.
    // New items receive the texts contained in `before` and `after` (which should contain the text before and after the caret in the old item).
    // Focuses the second new item and places the caret at its beginning.
    if (update.command === "split") {
        const newCurrID = getNewID(toDoList.itemOrder);
        const newItemOrder = [...toDoList.itemOrder];
        const position = newItemOrder.indexOf(update.id);
        newItemOrder.splice(position, 1, newCurrID, newCurrID + 1);
        
        const newItems = {...toDoList.items};
        delete newItems[toDoList.id];
        newItems[newCurrID] = {...itemDefaults, item_text: update.before};
        newItems[newCurrID + 1] = {...itemDefaults, item_text: update.after};

        return {
            ...toDoList,
            setFocusOnID: newCurrID + 1,
            caretPositionOnFocus: 0,
            itemOrder: newItemOrder,
            items: newItems
        };
    }

    // Replaces the item with provided `id` and the item before it with a new item.
    // The new item text contains the merged texts of the replaced items.
    // New item is focused and caret is placed between at the border of the old items' texts.
    if (update.command === "mergeWithPrev") {
        const position = toDoList.itemOrder.indexOf(update.id);
        if (position === 0) return toDoList;

        const newCurrID = getNewID(toDoList.itemOrder);
        const newItemOrder = [...toDoList.itemOrder];
        newItemOrder.splice(position - 1, 2, newCurrID);

        const prevID = toDoList.itemOrder[position - 1];
        const newItem = { ...itemDefaults, item_text: toDoList.items[prevID].item_text + toDoList.items[update.id].item_text };
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
    // The new item text contains the merged texts of the replaced items.
    // New item is focused and caret is placed between at the border of the old items' texts.
    if (update.command === "mergeWithNext") {
        const position = toDoList.itemOrder.indexOf(update.id);
        if (position === toDoList.itemOrder.length - 1) return toDoList;

        const newCurrID = getNewID(toDoList.itemOrder);
        const newItemOrder = [...toDoList.itemOrder];
        newItemOrder.splice(position, 2, newCurrID);

        const nextID = toDoList.itemOrder[position + 1];
        const newItem = { ...itemDefaults, item_text: toDoList.items[update.id].item_text + toDoList.items[nextID].item_text };
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
};


// Get a new value to use as an item id
const getNewID = itemOrder => itemOrder.length > 0 ? Math.max(...itemOrder) + 1 : 0;
