import { deepCopy } from "../../../util/copy";

import { ToDoListSelectors } from "../../selectors/data/objects/to-do-list";
import { getToDoListItem, type ToDoListItem, type ToDoList, type ToDoListNewOrExistingItemNumber } from "../../types/data/to-do-list";


export class ToDoListUpdaters {
    /**
     * Adds a new item at the `position` or after the item with provided `previousItemID`.
     * If `newItemID` is provided, sets new item's ID to it.
     * 
     * New item is populated with props passed via `update` or default values.
     * 
     * Focuses the new item and sets the caret at the end of it.
     * 
     * Expands all parents of the new item.
     */    
    static addItem(toDoList: ToDoList, update: ToDoListUpdateParamsAddItem): ToDoList {
        let { previousItemID, position, newItemID } = update;
        if (previousItemID === undefined && position === undefined) throw Error(`'previousItemID' or 'position' must be specified.`);
        const newItem = getToDoListItem(update);

        if (position === undefined) position = toDoList.itemOrder.indexOf(previousItemID!) + 1;
        if (newItemID === undefined) newItemID = ToDoListSelectors.newItemID(toDoList);
        const newItemOrder = [...toDoList.itemOrder];
        newItemOrder.splice(position, 0, newItemID);
        const newItems = deepCopy(toDoList.items);
        newItems[newItemID] = newItem;

        // Expand parents of the new item
        let result = {
            ...toDoList,
            setFocusOnID: newItemID,
            itemOrder: newItemOrder,
            items: newItems
        };
        expandParents(result, newItemID);
        return result;
    }

    /** Updates the properties of the item with provided `itemID` to values passed in the props of `update`. */
    static updateItem(toDoList: ToDoList, update: ToDoListUpdateParamsUpdateItem): ToDoList {
        const { itemID } = update;
        const updatedItem = getToDoListItem({ ...toDoList.items[itemID], ...update });
        return { ...toDoList, items: { ...toDoList.items, [itemID]: updatedItem } };
    }

    /**
     * Deletes the item with provided `id`.
     * If `setFocus` is set to "prev" or "next", focuses the item before or after the deleted and places caret at the end of it.
     * If `deleteChildren` = true, deletes the children of the item.
     * 
     * Reduces the indent of deleted item's children by 1 (if they are not deleted).
     * 
     * Adjusts new item input's indent, so it can't be greater than new last item' indent + 1.
     */
    static deleteItem(toDoList: ToDoList, update: ToDoListUpdateParamsDeleteItem): ToDoList {
        const { itemID, setFocus, deleteChildren } = update;
        let newItemOrder = toDoList.itemOrder.filter(i => i !== itemID);
        const newItems = deepCopy(toDoList.items);
        delete newItems[itemID];

        // Update children indent or delete them
        const childrenIDs = ToDoListSelectors.childrenIDs(toDoList, itemID);
        if (deleteChildren) {
            childrenIDs.forEach(i => { delete newItems[i] });
            newItemOrder = newItemOrder.filter(i => !childrenIDs.includes(i));
        }
        else 
            childrenIDs.forEach(i => { newItems[i].indent -= 1 });
        

        // Set focus (for Delete & Backspace key press handling)
        let setFocusOnID: ToDoListNewOrExistingItemNumber = toDoList.setFocusOnID;
        if (setFocus !== undefined) {
            if (toDoList.itemOrder.length > 1) {
                const deletedPosition = toDoList.itemOrder.indexOf(itemID);
                const focusedPosition = setFocus === "prev"                         // position to focus after item is deleted
                    ? Math.max(deletedPosition - 1, 0)                              // prev: 0 => 0, i => i - 1, max => max - 1
                    : Math.min(deletedPosition, toDoList.itemOrder.length - 2);     // next: 0 => 0, i => i, max => max - 1 (-2 in a new list)
                setFocusOnID = newItemOrder[focusedPosition];
            } else {
                setFocusOnID = "newItem";   // if no items remain, focus new item input
            }
        }

        let result = {
            ...toDoList,
            setFocusOnID,
            itemOrder: newItemOrder,
            items: newItems
        };

        // Add an empty item, if no items are present in to-do list after deletes
        if ([...Object.keys(result.items)].length === 0) {
            // Get an ID for the new item which did not previously exist, so that deleted item components get unmounted
            const newItemID = ToDoListSelectors.newItemID(toDoList);
            result = ToDoListUpdaters.addItem(result, { command: "addItem", position: 0, indent: 0, newItemID });
        };

        // Update new item input's indent
        setNewItemInputIndent(result);
        
        return result;
    }

    /**
     * Focuses the closest visible item before the item with provided `itemID` and puts caret on `caretPositionOnFocus`.
     * Previous item is calculated based on the current sort_type.
     * 
     * If `focusLastItem` is set to true, focuses the last item of the list instead.
     * 
     * State order is: "active" -> "optional" -> "completed" -> "cancelled".
     */
    static focusPrevItem(toDoList: ToDoList, update: ToDoListUpdateParamsFocusPrevItem): ToDoList {
        const visibleItemIDs = ToDoListSelectors.visibleItemIDs(toDoList);

        if ("focusLastItem" in update) {     // move from new item item to the last existing item
            if (visibleItemIDs.length === 0) return toDoList;
            else return { ...toDoList, setFocusOnID: visibleItemIDs[visibleItemIDs.length - 1] };
        } 
        else {
            const position = visibleItemIDs.indexOf(update.itemID);
            return {
                ...toDoList,
                setFocusOnID: position <= 0 ? visibleItemIDs[0] : visibleItemIDs[position - 1],
                caretPositionOnFocus: position <= 0
                    ? 0     // If trying to move top from the topmost item, explicitly set caret at its start
                    : (update.caretPositionOnFocus > -1 ? update.caretPositionOnFocus : toDoList.caretPositionOnFocus)
            };
        }
    }

    /**
     * Focuses the closest visible item after the item with provided `itemID` and puts caret on `caretPositionOnFocus`.
     * Next item is calculated based on the current sort_type.
     * 
     * State order is: "active" -> "optional" -> "completed" -> "cancelled".
     */
    static focusNextItem(toDoList: ToDoList, update: ToDoListUpdateParamsFocusNextItem): ToDoList {
        const visibleItemIDs = ToDoListSelectors.visibleItemIDs(toDoList);
        const position = visibleItemIDs.indexOf(update.itemID);
        if (position < 0) return toDoList;
        else return {
            ...toDoList,
            setFocusOnID: position < visibleItemIDs.length - 1 ? visibleItemIDs[position + 1] : "newItem",   // handle item -> item + 1 and item -> newItem cases
            caretPositionOnFocus: position < toDoList.itemOrder.length - 1 && update.caretPositionOnFocus > -1
                ? update.caretPositionOnFocus       // update caretPositionOnFocus if it's provided and an existing item is selected
                : toDoList.caretPositionOnFocus
        };
    }

    /**
     * Replaces item with the provided `itemID` by two new items.
     * New items receive the texts contained in `before` and `after` (which should contain the text before and after the caret in the replaced item).
     * 
     * New items have the same state, commentary and indent as the replaced item.
     *
     * Focuses the second new item and places the caret at its beginning.
     */
    static splitItem(toDoList: ToDoList, update: ToDoListUpdateParamsSplitItem): ToDoList {
        const { itemID, before, after } = update;
        const newCurrID = ToDoListSelectors.newItemID(toDoList);
        const itemOrder = [...toDoList.itemOrder];
        const position = itemOrder.indexOf(itemID);
        itemOrder.splice(position, 1, newCurrID, newCurrID + 1);
        
        const items = deepCopy(toDoList.items);
        delete items[itemID];
        const { item_state, commentary, indent } = toDoList.items[itemID];
        items[newCurrID] = getToDoListItem({ item_text: before, item_state, commentary, indent });
        items[newCurrID + 1] = getToDoListItem({ item_text: after, item_state, commentary, indent });

        return { ...toDoList, setFocusOnID: newCurrID + 1, caretPositionOnFocus: 0, itemOrder, items };
    }

    /** 
     * Replaces the item with provided `itemID` and the item before it with a new item.
     * Which item is before the item with `itemID` depends on the current sort_type.
     * 
     * New item text contains the merged texts of the replaced items.
     * New item state and commentary are the same as the state of replaced item, previous to the item with the `itemID`.
     * 
     * Reduces the indent of the item's children by 1, if it was > the indent of previous item.
     * Adjusts new item input's indent, so it can't be greater than new last item' indent + 1.
     * 
     * New item is focused and caret is placed between at the border of the old items' texts.
     * 
     * Expands all parents of the new item.
     */
    static mergeItemWithPrev(toDoList: ToDoList, update: ToDoListUpdateParamsMergeItemWithPrev): ToDoList {
        const { itemID } = update;
        const sortedItemIDs = ToDoListSelectors.sortedItemIDs(toDoList);
        const sortedPosition = sortedItemIDs.indexOf(itemID);
        // Do nothing if first item is focused
        if (sortedPosition === 0) return toDoList;

        else {
            // Update itemOrder
            const prevID = sortedItemIDs[sortedPosition - 1];
            const newCurrID = ToDoListSelectors.newItemID(toDoList);
            const itemChildren = ToDoListSelectors.childrenIDs(toDoList, itemID);
            const newItemOrder = toDoList.itemOrder.filter(i => i !== prevID && i !== itemID && !itemChildren.includes(i));     // delete prev and current items + current item children
            const insertPosition = ToDoListSelectors.mergedItemInsertPosition(toDoList, prevID, itemID);
            newItemOrder.splice(insertPosition, 0, newCurrID, ...itemChildren);

            // Replace merged items with a new one
            const newItem = getToDoListItem({
                item_text: toDoList.items[prevID].item_text + toDoList.items[itemID].item_text,
                item_state: toDoList.items[prevID].item_state,
                commentary: toDoList.items[prevID].commentary,
                indent: toDoList.items[prevID].indent
            });
            const newItems = deepCopy(toDoList.items);
            newItems[newCurrID] = newItem;
            delete newItems[itemID];
            delete newItems[prevID];

            // Reduce indent of the item's children, if it indent was > previous item's indent
            if (toDoList.items[prevID].indent < toDoList.items[itemID].indent) {
                ToDoListSelectors.childrenIDs(toDoList, itemID).forEach(i => {
                    let indent = toDoList.items[i].indent - 1;
                    newItems[i] = {...toDoList.items[i], indent};
                });
            }

            // Update new item input's indent
            const result = {
                ...toDoList,
                setFocusOnID: newCurrID,
                caretPositionOnFocus: toDoList.items[prevID].item_text.length,
                itemOrder: newItemOrder,
                items: newItems
            };
            setNewItemInputIndent(result);

            // Expand parent of the new item
            expandParents(result, newCurrID);
            return result;
        }
    }

    /**
     * Replaces the item with provided `itemID` and the item after it with a new item.
     * Which item is after the item with `itemID` depends on the current sort_type.
     * 
     * New item text contains the merged texts of the replaced items.
     * New item state, commentary and indent are the same as the state of replaced item with the `itemID`.
     * 
     * Reduces the indent of second merged item's children by 1, if it was > the indent of item with the `itemID`.
     * Adjusts new item input's indent, so it can't be greater than new last item' indent + 1.
     * 
     * New item is focused and caret is placed between at the border of the old items' texts.
     */
    static mergeItemWithNext(toDoList: ToDoList, update: ToDoListUpdateParamsMergeItemWithNext): ToDoList {
        const { itemID } = update;
        const sortedItemIDs = ToDoListSelectors.sortedItemIDs(toDoList);
        const sortedPosition = sortedItemIDs.indexOf(itemID);
        // Do nothing if last item is focused
        if (sortedPosition === sortedItemIDs.length - 1) return toDoList;

        else {
            // Update itemOrder
            const nextID = sortedItemIDs[sortedPosition + 1];
            const newCurrID = ToDoListSelectors.newItemID(toDoList);
            const nextItemChildren = ToDoListSelectors.childrenIDs(toDoList, nextID);
            const newItemOrder = toDoList.itemOrder.filter(i => i !== itemID && i !== nextID && !nextItemChildren.includes(i));     // delete curr and next items + next item children
            const insertPosition = ToDoListSelectors.mergedItemInsertPosition(toDoList, itemID, nextID);
            newItemOrder.splice(insertPosition, 0, newCurrID, ...nextItemChildren);

            // Replace merged items with a new one
            const newItem = getToDoListItem({
                item_text: toDoList.items[itemID].item_text + toDoList.items[nextID].item_text,
                item_state: toDoList.items[itemID].item_state,
                commentary: toDoList.items[itemID].commentary,
                indent: toDoList.items[itemID].indent
            });
            const newItems = deepCopy(toDoList.items);
            newItems[newCurrID] = newItem;
            delete newItems[itemID];
            delete newItems[nextID];

            // Reduce indent of next item's children, if current item's indent was < next item's indent
            if (toDoList.items[itemID].indent < toDoList.items[nextID].indent) {
                ToDoListSelectors.childrenIDs(toDoList, nextID).forEach(i => {
                    let indent = toDoList.items[i].indent - 1;
                    newItems[i] = {...toDoList.items[i], indent};
                });
            }

            // Update new item input's indent
            const result = {
                ...toDoList,
                setFocusOnID: newCurrID,
                caretPositionOnFocus: toDoList.items[itemID].item_text.length,
                itemOrder: newItemOrder,
                items: newItems
            };
            setNewItemInputIndent(result);
            return result;
        }
    }

    /** Sets toDoList.draggedItems to `itemID` and `draggedChildren` to its children. */
    static startItemDrag(toDoList: ToDoList, update: ToDoListUpdateParamsStartItemDrag): ToDoList {
        const { itemID } = update;
        // const draggedItems = [itemID].concat(ToDoListSelectors.childrenIDs(toDoList, itemID));
        const draggedChildren = ToDoListSelectors.childrenIDs(toDoList, itemID);
        return { ...toDoList, draggedParent: itemID, draggedChildren };
    }

    /** Clears toDoList drag state. */
    static endItemDrag(toDoList: ToDoList, update: ToDoListUpdateParamsEndItemDrag): ToDoList {
        return { ...toDoList, draggedParent: -1, draggedChildren: [], draggedOver: -1 };
    }

    /**
     * Moves the item with id = `movedItemID` and its children before the item with id = `targetItemID`.
     * If `targetLastItem` == true, moves the item to the end of the item list (has a higher priority than `targetItemID`).
     * Expands new parents of the moved item (to avoid errors caused by React DnD trying to update state of an unmounted component).
     * 
     * Supports only the default sort_type of the list.
     */
    static moveItems(toDoList: ToDoList, update: ToDoListUpdateParamsMoveItems): ToDoList {
        const { movedItemID, targetItemID, targetLastItem } = update;

        // Move item and its children
        const movedChildren = ToDoListSelectors.childrenIDs(toDoList, movedItemID);
        const newItemOrder = [...toDoList.itemOrder];
        const movedPosition = newItemOrder.indexOf(movedItemID);
        newItemOrder.splice(movedPosition, 1 + movedChildren.length);
        const targetPosition = targetLastItem ? newItemOrder.length : newItemOrder.indexOf(targetItemID);
        newItemOrder.splice(targetPosition, 0, movedItemID, ...movedChildren);

        // Update indent of item and children
        const newItems = deepCopy(toDoList.items);
        newItems[movedItemID].indent = toDoList.dropIndent;
        const indentDifference = toDoList.dropIndent - toDoList.items[movedItemID].indent;
        movedChildren.forEach(i => {
            newItems[i].indent = Math.min(Math.max(newItems[i].indent + indentDifference, 0), 5);
        });
        
        // Update new item input's indent
        const result = { ...toDoList, itemOrder: newItemOrder, items: newItems };
        setNewItemInputIndent(result);

        // Expand parent of the new item
        expandParents(result, movedItemID);
        return result;
    }
    
    /**
     * Updates indent of the item with provided `id` and its children.
     * If `itemID` = "newItem", sets indent of new item input.
     * Accepts `increase`/`decrease` boolean arguments to increase/decrease indent by 1 or a new value passed in `indent` argument.
     * 
     * Supports only the default sort_type of the list.
     * 
     * Adjusts new item input's indent, so it can't be greater than new last item' indent + 1.
     */
    static setItemIndent(toDoList: ToDoList, update: ToDoListUpdateParamsSetItemIndent): ToDoList {
        if (toDoList.sort_type !== "default") return toDoList;
        else {
            let { itemID, increase, decrease, indent } = update;
            if (!increase && !decrease && indent === undefined) throw Error("`increase`, `decrease` or `indent` must be specified.");

            // Update new item indent
            if (itemID === "newItem") {
                if (increase) indent = toDoList.newItemInputIndent + 1;
                else if (decrease) indent = toDoList.newItemInputIndent - 1;
                indent = Math.min(Math.max(indent!, 0), 5);
                indent = Math.min(indent, ToDoListSelectors.previousItemIndent(toDoList, itemID) + 1);
                return { ...toDoList, newItemInputIndent: indent };
            } 
            else {
                // Update existing items
                const newItems = {...toDoList.items};   // item
                let item = toDoList.items[itemID];
                if (increase) indent = item.indent + 1;
                else if (decrease) indent = item.indent - 1;
                indent = Math.min(Math.max(indent!, 0), 5);
                indent = Math.min(indent, ToDoListSelectors.previousItemIndent(toDoList, itemID) + 1);
                newItems[itemID] = {...item, indent};

                const indentDifference = indent - item.indent;      // children
                ToDoListSelectors.childrenIDs(toDoList, itemID).forEach(i => {
                    let item = toDoList.items[i];
                    let indent = Math.min(Math.max(item.indent + indentDifference, 0), 5);
                    newItems[i] = {...item, indent};
                });

                // Update new item input's indent
                const result = { ...toDoList, items: newItems };
                setNewItemInputIndent(result);

                // Expand parents 
                // (if indent was increased, and a new parent is collapsed, 
                // this will cause current item to disappear, which is not convenient)
                expandParents(result, itemID);
                return result;
            }
        }
    }

    // TODO move methods here & keep `getUpdatedToDoList` as a dispatching function
    // TODO make all methods return a new to-do list?
    // TODO change command names: add -> addItem, update -> updateItem, delete -> deleteItem
}

type ToDoListUpdateParamsAddItem = { command: "addItem", previousItemID?: number, position?: number, newItemID?: number } & Partial<ToDoListItem>;
type ToDoListUpdateParamsUpdateItem = { command: "updateItem", itemID: number } & Partial<ToDoListItem>;
type ToDoListUpdateParamsDeleteItem = { command: "deleteItem", itemID: number, setFocus?: "prev" | "next", deleteChildren?: boolean };
type ToDoListUpdateParamsFocusPrevItem = { command: "focusPrevItem" } & ({ focusLastItem: true } | { itemID: number, caretPositionOnFocus: number });
type ToDoListUpdateParamsFocusNextItem = { command: "focusNextItem", itemID: number, caretPositionOnFocus: number };
type ToDoListUpdateParamsSplitItem = { command: "splitItem", itemID: number, before: string, after: string };
type ToDoListUpdateParamsMergeItemWithPrev = { command: "mergeItemWithPrev", itemID: number };
type ToDoListUpdateParamsMergeItemWithNext = { command: "mergeItemWithNext", itemID: number };
type ToDoListUpdateParamsStartItemDrag = { command: "startItemDrag", itemID: number };
type ToDoListUpdateParamsEndItemDrag = { command: "endItemDrag" };
type ToDoListUpdateParamsMoveItems = { command: "moveItems", movedItemID: number, targetItemID: number, targetLastItem: boolean };
type ToDoListUpdateParamsSetItemIndent = { command: "setItemIndent",
    itemID: ToDoListNewOrExistingItemNumber, increase?: boolean, decrease?: boolean, indent?: number
};

export type ToDoListUpdateParams = ToDoListUpdateParamsAddItem | ToDoListUpdateParamsUpdateItem | ToDoListUpdateParamsDeleteItem |
    ToDoListUpdateParamsFocusPrevItem | ToDoListUpdateParamsFocusNextItem | ToDoListUpdateParamsSplitItem | ToDoListUpdateParamsMergeItemWithPrev |
    ToDoListUpdateParamsMergeItemWithNext | ToDoListUpdateParamsStartItemDrag | ToDoListUpdateParamsEndItemDrag | ToDoListUpdateParamsMoveItems |
    ToDoListUpdateParamsSetItemIndent;

/**
 * Performs an update on items and other props of provided `toDoList` and returns a new to-do list object.
 * 
 * `update` is an object with `command` prop with the type of update to perform, as well as additional props specifying the update.
 */
export const getUpdatedToDoList = (toDoList: ToDoList, update: ToDoListUpdateParams): ToDoList => {
    const { command } = update;
    if (command === "addItem") return ToDoListUpdaters.addItem(toDoList, update);
    if (command === "updateItem") return ToDoListUpdaters.updateItem(toDoList, update);
    if (command === "deleteItem") return ToDoListUpdaters.deleteItem(toDoList, update);
    if (command === "focusPrevItem") return ToDoListUpdaters.focusPrevItem(toDoList, update);
    if (command === "focusNextItem") return ToDoListUpdaters.focusNextItem(toDoList, update);
    if (command === "splitItem") return ToDoListUpdaters.splitItem(toDoList, update);
    if (command === "mergeItemWithPrev") return ToDoListUpdaters.mergeItemWithPrev(toDoList, update);
    if (command === "mergeItemWithNext") return ToDoListUpdaters.mergeItemWithNext(toDoList, update);
    if (command === "startItemDrag") return ToDoListUpdaters.startItemDrag(toDoList, update);
    if (command === "endItemDrag") return ToDoListUpdaters.endItemDrag(toDoList, update);
    if (command === "moveItems") return ToDoListUpdaters.moveItems(toDoList, update);
    if (command === "setItemIndent") return ToDoListUpdaters.setItemIndent(toDoList, update);

    throw Error(`Command '${command}' handler not implemented.`);
    

    
    
    // // Returns a new to-do list with its items being numerated continiously
    // else if (command === "normalizeItemIDs") {
    //     result = getToDoListWithNormalizedItemIDs(toDoList);
    // }

    // // Throw, if invalid command was provided
    // else throw Error(`Received invalid update command '${command}'`)
    
    // // Return to-do list
    // return result;
};


/**
 * Updates the new item input's indent in the provided `toDoList`, based on the current indent of the last item in the list.
 * New item input's indent can't be > than last item's indent + 1.
 *
 * The update is performed in the original toDoList object.
 */
const setNewItemInputIndent = (toDoList: ToDoList) => {
    const sortedItemIDs = ToDoListSelectors.sortedItemIDs(toDoList);
    if (sortedItemIDs.length > 0) {
        const lastItemID = sortedItemIDs[sortedItemIDs.length - 1];
        toDoList.newItemInputIndent = Math.min(toDoList.newItemInputIndent, toDoList.items[lastItemID].indent + 1);
    } else
        toDoList.newItemInputIndent = 0;
};


/** 
 * Expands all parent items of the parent with the provided `itemID`.
 *
 * The update is performed in the original toDoList object.
 */
const expandParents = (toDoList: ToDoList, itemID: number) => {
    const parentIDs = ToDoListSelectors.parentIDs(toDoList, itemID);
    parentIDs.forEach(id => { toDoList.items[id].is_expanded = true; });
};


// /**
//  * Returns a copy of `toDoList` with continiously numerated item IDs, i.e.:
//  * 2, 3, 5, 6 => 1, 2, 3, 4
//  */
// const getToDoListWithNormalizedItemIDs = toDoList => {
//     const mapping = toDoList.itemOrder.reduce((result, itemID, itemPosition) => {
//         result[itemID] = itemPosition;
//         return result;
//     }, {});

//     const { setFocusOnID, draggedParent, draggedOver } = toDoList;

//     return {
//         ...toDoList,
//         itemOrder: toDoList.itemOrder.map(itemID => mapping[itemID]),
//         setFocusOnID: mapping[setFocusOnID] !== undefined ? mapping[setFocusOnID] : setFocusOnID,
//         draggedParent: mapping[draggedParent] !== undefined ? mapping[draggedParent] : draggedParent,
//         draggedChildren: toDoList.draggedChildren.map(itemID => mapping[itemID]),
//         draggedOver: mapping[draggedOver] !== undefined ? mapping[draggedOver] : draggedOver,
        
//         items: [...Object.keys(toDoList.items)].reduce((result, itemID) => {
//             const newItemID = mapping[itemID];
//             result[newItemID] = deepCopy(toDoList.items[itemID]);
//             return result;
//         }, {})
//     };
// };
