/*
    Object page functions for manipulating to-do list's state.
*/


// If a mutable prop is added, getNewToDoListItems should be updated to get its copy, rather than the original.
const itemDefaults = { item_state: "active", item_text: "", commentary: "", indent: 0, is_expanded: true };
/*
    Performs an update on items and other props of provided `toDoList` and returns a new to-do list object.
    `update` is an object with `command` prop with the type of update to perform, as well as additional props specifying the update.
    Possible combinations of `update` props and their values:
    - `command` = "add", `position` = [position in the list], `id` = [id of the item to insert after, if position is not provided],
        any prop specified in `itemDefaults` can be provided to override the default value;
    - `command` = "update", `id` = [updated item id], any prop specified in `itemDefaults` with the new value;
    - `command` = "delete", `id` = [updated item id], `setFocus` = ["prev"|"next" enum indicating which item should be focused after delete];
    - `command` = "focusPrev", `focusLastItem` = [bool indicating that a last item should be focused], `id` = [id of item after the item to be focused];
    - `command` = "focusNext", `id` = [id of item before the item to be focused];
    - `command` = "swap" // TODO update when implemented
*/
export const updateToDoListItems = (toDoList, update) => {
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
};


// Get a new value to use as an item id
const getNewID = itemOrder => itemOrder.length > 0 ? Math.max(...itemOrder) + 1 : 0;
