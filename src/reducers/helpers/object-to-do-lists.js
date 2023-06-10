import { getSortedItemIDs, getVisibleSortedItemIDs, getNewItemID, getPreviousItemIndent, 
        getParentIDs, getChildrenIDs, getMergedItemInsertPosition } from "../../store/state-util/to-do-lists";
import { deepCopy } from "../../util/copy";
import { getItemDefaults } from "../../store/state-templates/to-do-list-item";


/*
    Object page functions for manipulating to-do list's state.
*/

/**
 * Performs an update on items and other props of provided `toDoList` and returns a new to-do list object.
 * 
 * `update` is an object with `command` prop with the type of update to perform, as well as additional props specifying the update.
 */
export const getUpdatedToDoList = (toDoList, update) => {
    const command = update.command;
    // Adds a new item after the item with provided `id`. 
    // Sets the properties of the new item with provided properties or uses values stored in `itemDefaults`.
    //
    // Focuses the new item and sets the caret at the end of it.
    //
    // Expands all parents of the new item.
    if (command === "add") {
        const newItem = {};
        const itemDefaults = getItemDefaults();
        Object.keys(itemDefaults).forEach(k => {
            newItem[k] = update[k] !== undefined ? update[k] : itemDefaults[k];
        });

        const position = update.position !== undefined
            ? update.position
            : toDoList.itemOrder.indexOf(update.id) + 1;

        const newID = getNewItemID(toDoList);
        const newItemOrder = [...toDoList.itemOrder];
        newItemOrder.splice(position, 0, newID);
        const newItems = deepCopy(toDoList.items);
        newItems[newID] = newItem;

        // Expand parents of the new item
        let newToDoList = {
            ...toDoList,
            setFocusOnID: newID,
            itemOrder: newItemOrder,
            items: newItems
        };
        expandParents(newToDoList, newID);
        
        return newToDoList;
    }

    // Updates the properties of the item with provided `id` to values passed in the props.
    if (command === "update") {
        const newItem = {};
        Object.keys(getItemDefaults()).forEach(k => {
            newItem[k] = update[k] !== undefined ? update[k] : toDoList.items[update.id][k];
        });
        const newItems = deepCopy(toDoList.items);
        newItems[update.id] = newItem;
        return {
            ...toDoList,
            items: newItems
        };
    }

    // Deletes the item with provided `id`.
    // If `setFocus` is set to "prev" or "next", focuses the item before or after the deleted and places caret at the end of it.
    // If `deleteChildren` = true, deletes the children of the item.
    //
    // Reduces the indent of deleted item's children by 1 (if they are not deleted).
    //
    // Adjusts new item input's indent, so it can't be greater than new last item' indent + 1.
    if (command === "delete") {
        const { id, setFocus, deleteChildren } = update;
        let newItemOrder = toDoList.itemOrder.filter(i => i !== id);
        const newItems = deepCopy(toDoList.items);
        delete newItems[id];

        // Update children indent or delete them
        const childrenIDs = getChildrenIDs(toDoList, id);
        if (deleteChildren) {
            childrenIDs.forEach(i => { delete newItems[i] });
            newItemOrder = newItemOrder.filter(i => !childrenIDs.includes(i));
        }
        else 
            childrenIDs.forEach(i => { newItems[i].indent -= 1 });

        // Set focus (for Delete & Backspace key press handling)
        let setFocusOnID = toDoList.setFocusOnID;
        if (["prev", "next"].includes(setFocus)) {
            if (toDoList.itemOrder.length > 1) {
                const deletedPosition = toDoList.itemOrder.indexOf(id);
                const focusedPosition = setFocus === "prev"                         // position to focus after item is deleted
                    ? Math.max(deletedPosition - 1, 0)                              // prev: 0 => 0, i => i - 1, max => max - 1
                    : Math.min(deletedPosition, toDoList.itemOrder.length - 2);     // next: 0 => 0, i => i, max => max - 1 (-2 in a new list)
                setFocusOnID = newItemOrder[focusedPosition];
            } else {
                setFocusOnID = "newItem";   // if no items remain, focus new item input
            }
        }

        let newToDoList = {
            ...toDoList,
            setFocusOnID,
            itemOrder: newItemOrder,
            items: newItems
        };

        // Update new item input's indent
        setNewItemInputIndent(newToDoList);

        return newToDoList;
    }

    // Focuses the next visible item before the item with provided `id`.
    // Previous item is calculated based on the current sort_type.
    //
    // If `focusLastItem` is set to true, focuses the last item of the list instead.
    //
    // State order is: "active" -> "optional" -> "completed" -> "cancelled".
    if (command === "focusPrev") {
        const sortedItemIDs = getVisibleSortedItemIDs(toDoList);

        if (update.focusLastItem) {     // move from new item item to the last existing item
            if (sortedItemIDs.length === 0) return toDoList;
            return { ...toDoList, setFocusOnID: sortedItemIDs[sortedItemIDs.length - 1] };
        }

        const position = sortedItemIDs.indexOf(update.id);
        return {
            ...toDoList,
            setFocusOnID: position <= 0 ? sortedItemIDs[0] : sortedItemIDs[position - 1],
            caretPositionOnFocus: position <= 0
                ? 0     // If trying to move top from the topmost item, explicitly set caret at its start
                : (update.caretPositionOnFocus > -1 ? update.caretPositionOnFocus : toDoList.caretPositionOnFocus)
        };
    }

    // Focuses the next visible item after the item with provided `id`.
    // Next item is calculated based on the current sort_type.
    //
    // State order is: "active" -> "optional" -> "completed" -> "cancelled".
    if (command === "focusNext") {
        const sortedItemIDs = getVisibleSortedItemIDs(toDoList);
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
    // New items have the same state, commentary and indent as the replaced item.
    //
    // Focuses the second new item and places the caret at its beginning.
    if (command === "split") {
        const newCurrID = getNewItemID(toDoList);
        const newItemOrder = [...toDoList.itemOrder];
        const position = newItemOrder.indexOf(update.id);
        newItemOrder.splice(position, 1, newCurrID, newCurrID + 1);
        
        const newItems = deepCopy(toDoList.items);
        delete newItems[update.id];
        const { item_state, commentary, indent } = toDoList.items[update.id];
        newItems[newCurrID] = {...getItemDefaults(), item_text: update.before, item_state, commentary, indent};
        newItems[newCurrID + 1] = {...getItemDefaults(), item_text: update.after, item_state, commentary, indent};

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
    //
    // New item text contains the merged texts of the replaced items.
    // New item state and commentary are the same as the state of replaced item, previous to the item with the `id`.
    //
    // Reduces the indent of the item's children by 1, if it was > the indent of previous item.
    // Adjusts new item input's indent, so it can't be greater than new last item' indent + 1.
    //
    // New item is focused and caret is placed between at the border of the old items' texts.
    //
    // Expands all parents of the new item.
    if (command === "mergeWithPrev") {
        const { id } = update;
        const sortedItemIDs = getSortedItemIDs(toDoList);
        const sortedPosition = sortedItemIDs.indexOf(id);
        // Do nothing if first item is focused
        if (sortedPosition === 0) return toDoList;

        // Update itemOrder
        const prevID = sortedItemIDs[sortedPosition - 1];
        const newCurrID = getNewItemID(toDoList);
        const itemChildren = getChildrenIDs(toDoList, id);
        const newItemOrder = toDoList.itemOrder.filter(i => i !== prevID && i !== id && !itemChildren.includes(i));     // delete prev and current items + current item children
        const insertPosition = getMergedItemInsertPosition(toDoList, prevID, id);
        newItemOrder.splice(insertPosition, 0, newCurrID, ...itemChildren);

        // Replace merged items with a new one
        const newItem = {
            ...getItemDefaults(),
            item_text: toDoList.items[prevID].item_text + toDoList.items[id].item_text,
            item_state: toDoList.items[prevID].item_state,
            commentary: toDoList.items[prevID].commentary,
            indent: toDoList.items[prevID].indent
        };
        const newItems = deepCopy(toDoList.items);
        newItems[newCurrID] = newItem;
        delete newItems[id];
        delete newItems[prevID];

        // Reduce indent of the item's children, if it indent was > previous item's indent
        if (toDoList.items[prevID].indent < toDoList.items[id].indent) {
            getChildrenIDs(toDoList, id).forEach(i => {
                let indent = toDoList.items[i].indent - 1;
                newItems[i] = {...toDoList.items[i], indent};
            });
        }

        // Update new item input's indent
        const newToDoList = {
            ...toDoList,
            setFocusOnID: newCurrID,
            caretPositionOnFocus: toDoList.items[prevID].item_text.length,
            itemOrder: newItemOrder,
            items: newItems
        };
        setNewItemInputIndent(newToDoList);

        // Expand parent of the new item
        expandParents(newToDoList, newCurrID);

        return newToDoList;
    }

    // Replaces the item with provided `id` and the item after it with a new item.
    // Which item is after the item with `id` depends on the current sort_type.
    //
    // New item text contains the merged texts of the replaced items.
    // New item state, commentary and indent are the same as the state of replaced item with the `id`.
    //
    // Reduces the indent of second merged item's children by 1, if it was > the indent of item with the `id`.
    // Adjusts new item input's indent, so it can't be greater than new last item' indent + 1.
    //
    // New item is focused and caret is placed between at the border of the old items' texts.
    if (command === "mergeWithNext") {
        const { id } = update;
        const sortedItemIDs = getSortedItemIDs(toDoList);
        const sortedPosition = sortedItemIDs.indexOf(id);
        // Do nothing if last item is focused
        if (sortedPosition === sortedItemIDs.length - 1) return toDoList;

        // Update itemOrder
        const nextID = sortedItemIDs[sortedPosition + 1];
        const newCurrID = getNewItemID(toDoList);
        const nextItemChildren = getChildrenIDs(toDoList, nextID);
        const newItemOrder = toDoList.itemOrder.filter(i => i !== id && i !== nextID && !nextItemChildren.includes(i));     // delete curr and next items + next item children
        const insertPosition = getMergedItemInsertPosition(toDoList, id, nextID);
        newItemOrder.splice(insertPosition, 0, newCurrID, ...nextItemChildren);

        // Replace merged items with a new one
        const newItem = {
            ...getItemDefaults(),
            item_text: toDoList.items[id].item_text + toDoList.items[nextID].item_text,
            item_state: toDoList.items[id].item_state,
            commentary: toDoList.items[id].commentary,
            indent: toDoList.items[id].indent
        };
        const newItems = deepCopy(toDoList.items);
        newItems[newCurrID] = newItem;
        delete newItems[id];
        delete newItems[nextID];

        // Reduce indent of next item's children, if current item's indent was < next item's indent
        if (toDoList.items[id].indent < toDoList.items[nextID].indent) {
            getChildrenIDs(toDoList, nextID).forEach(i => {
                let indent = toDoList.items[i].indent - 1;
                newItems[i] = {...toDoList.items[i], indent};
            });
        }

        // Update new item input's indent
        const newToDoList = {
            ...toDoList,
            setFocusOnID: newCurrID,
            caretPositionOnFocus: toDoList.items[id].item_text.length,
            itemOrder: newItemOrder,
            items: newItems
        };
        setNewItemInputIndent(newToDoList);

        return newToDoList;
    }

    // Sets toDoList.draggedItems with `id` and its children.
    if (command === "startDrag") {
        const { id } = update;
        // const draggedItems = [id].concat(getChildrenIDs(toDoList, id));
        const draggedChildren = getChildrenIDs(toDoList, id);
        return {...toDoList, draggedParent: id, draggedChildren };
    }

    // Clears toDoList.draggedItems.
    if (command === "endDrag") {
        return {...toDoList, draggedParent: -1, draggedChildren: [], draggedOver: -1 };
    }

    // Moves the item with id = `movedID` and its children before the item with id = `targetID`.
    // If `targetLastItem` == true, moves the item to the end of the item list (has a higher priority than `targetID`).
    // Expands new parents of the moved item (to avoid errors caused by React DnD trying to update state of an unmounted component).
    //
    // Supports only the default sort_type of the list.
    if (command === "moveItems") {
        const { movedID, targetID, targetLastItem } = update;

        // Move item and its children
        const movedChildren = getChildrenIDs(toDoList, movedID);
        const newItemOrder = [...toDoList.itemOrder];
        const movedPosition = newItemOrder.indexOf(movedID);
        newItemOrder.splice(movedPosition, 1 + movedChildren.length);
        const targetPosition = targetLastItem ? newItemOrder.length : newItemOrder.indexOf(targetID);
        newItemOrder.splice(targetPosition, 0, movedID, ...movedChildren);

        // Update indent of item and children
        const newItems = deepCopy(toDoList.items);
        newItems[movedID].indent = toDoList.dropIndent;
        const indentDifference = toDoList.dropIndent - toDoList.items[movedID].indent;
        movedChildren.forEach(i => {
            newItems[i].indent = Math.min(Math.max(newItems[i].indent + indentDifference, 0), 5);
        });
        
        // Update new item input's indent
        const newToDoList = { ...toDoList, itemOrder: newItemOrder, items: newItems };
        setNewItemInputIndent(newToDoList);

        // Expand parent of the new item
        expandParents(newToDoList, movedID);

        return newToDoList;
    }

    // Updates indent of the item with provided `id` and its children.
    // If `id` = "newItem", sets indent of new item input.
    // Accepts `increase`/`decrease` boolean arguments to increase/decrease indent by 1 or a new value passed in `indent` argument.
    //
    // Supports only the default sort_type of the list.
    //
    // Adjusts new item input's indent, so it can't be greater than new last item' indent + 1.
    if (command === "setIndent") {
        if (toDoList.sort_type !== "default") return toDoList;
        let { id, increase, decrease, indent } = update;

        // Update new item indent
        if (id === "newItem") {
            if (increase) indent = toDoList.newItemInputIndent + 1;
            else if (decrease) indent = toDoList.newItemInputIndent - 1;
            indent = Math.min(Math.max(indent, 0), 5);
            indent = Math.min(indent, getPreviousItemIndent(toDoList, id) + 1);
            return { ...toDoList, newItemInputIndent: indent };
        }

        // Update existing items
        const newItems = {...toDoList.items};   // item
        let item = toDoList.items[id];
        if (increase) indent = item.indent + 1;
        else if (decrease) indent = item.indent - 1;
        indent = Math.min(Math.max(indent, 0), 5);
        indent = Math.min(indent, getPreviousItemIndent(toDoList, id) + 1);
        newItems[id] = {...item, indent};

        const indentDifference = indent - item.indent;      // children
        getChildrenIDs(toDoList, id).forEach(i => {
            let item = toDoList.items[i];
            let indent = Math.min(Math.max(item.indent + indentDifference, 0), 5);
            newItems[i] = {...item, indent};
        });

        // Update new item input's indent
        const newToDoList = { ...toDoList, items: newItems };
        setNewItemInputIndent(newToDoList);

        // Expand parents 
        // (if indent was increased, and a new parent is collapsed, 
        // this will cause current item to disappear, which is not convenient)
        expandParents(newToDoList, id);

        return newToDoList;
    }
};


/**
 * Updates the new item input's indent in the provided `toDoList`, based on the current indent of the last item in the list.
 * New item input's indent can't be > than last item's indent + 1.
 *
 * The update is performed in the original toDoList object.
 */
const setNewItemInputIndent = toDoList => {
    const sortedItemIDs = getSortedItemIDs(toDoList);
    if (sortedItemIDs.length > 0) {
        const lastItemID = sortedItemIDs[sortedItemIDs.length - 1];
        toDoList.newItemInputIndent = Math.min(toDoList.newItemInputIndent, toDoList.items[lastItemID].indent + 1);
    } else
        toDoList.newItemInputIndent = 0;
};


/** 
 * Expands all parent items of the parent with the provided `id`.
 *
 * The update is performed in the original toDoList object.
 */
const expandParents = (toDoList, id) => {
    const parentIDs = getParentIDs(toDoList, id);
    parentIDs.forEach(id => {
        toDoList.items[id].is_expanded = true;
    });
};
