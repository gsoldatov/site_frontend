import { toDoListItemState, type ToDoListItemState, type ToDoList } from "../../../../types/store/data/to-do-list";


/** Contains selectors for to-do list object data. */
export class ToDoListSelectors {
    /** Returns an `item_id` for a new item in `toDoList`. */
    static newItemID(toDoList: ToDoList) {
        return toDoList.itemOrder.length > 0 ? Math.max(...toDoList.itemOrder) + 1 : 0;
    }

    /** Returns item IDs of a `toDoList` sorted according its current `sort_type`. */
    static sortedItemIDs(toDoList: ToDoList) {
        if (toDoList.sort_type === "default") return [...toDoList.itemOrder];
        if (toDoList.sort_type === "state") return sortByState(toDoList, toDoList.itemOrder);
        throw Error(`Incorrect sort_type: ${toDoList.sort_type}`);
    }
    
    /** Returns sorted item IDs of visible items (parents of which are not collapsed) of the `toDoList`. */
    static visibleItemIDs(toDoList: ToDoList) {
        const sortedItemIDs = ToDoListSelectors.sortedItemIDs(toDoList);
        return getVisibleItemIDs(toDoList, sortedItemIDs);
    }

    /** Returns a next item `state` based on its current (used for state toggling). */
    static nextItemState(state: ToDoListItemState): ToDoListItemState {
        return toDoListItemState[(toDoListItemState.indexOf(state) + 1) % 4];
    }
    
    /** Returns an array of parent item IDs in the `toDoList` for a provided `id`. */
    static parentIDs(toDoList: ToDoList, id: number) {
        let parentIDs = [];
        let currentIndent = toDoList.items[id].indent;
        let i = toDoList.itemOrder.indexOf(id);
        while (currentIndent > 0 && i >= 0) {
            let itemID = toDoList.itemOrder[i];
            let itemIndent = toDoList.items[itemID].indent;
            if (itemIndent < currentIndent) {
                parentIDs.push(itemID);
                currentIndent = itemIndent;
            }
            i--;
        }

        return parentIDs;
    };

    /** Returns an array of children item IDs in the `toDoList` for a provided `id`. */
    static childrenIDs(toDoList: ToDoList, id: number) {
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
     * Returns the indent of the `toDoList` item, previous to the item with provided `id`.
     * 
     * If `id` = "newItem", returns the indent of the last item in the list.
     * 
     * If item is first in the list, returns -1.
     */
    static previousItemIndent(toDoList: ToDoList, id: number | string) {
        const itemOrder = ToDoListSelectors.sortedItemIDs(toDoList);

        if (id === "newItem"){
            const prevID = itemOrder[itemOrder.length - 1];
            if (prevID === undefined) return -1;
            return toDoList.items[prevID].indent;
        }
        
        if (typeof id === "string") throw Error(`Incorrect id value: '${id}'`);
        const index = itemOrder.indexOf(id);
        if (index === 0) return -1;
        else {
            const prevID = itemOrder[index - 1];
            return toDoList.items[prevID].indent;
        }
    };

    /** Returns an insert position in `toDoList.itemOrder` list for an item, resulting in merge of items with ids `first` and `second`. */
    static mergedItemInsertPosition(toDoList: ToDoList, first: number, second: number) {
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

        throw Error(`Incorrect sort_type: '${toDoList.sort_type}'`);
    };
}

/**
 * Returns a recursively sorted by state `items` of the `toDoList`. Child items are also sorted, but are kept after the same parent.
 */
const sortByState = (toDoList: ToDoList, items: number[]): number[] => {
    // Exit function if an empty item list is passed as an argument
    if (items.length === 0) return [];

    // Get top-level items and their children
    const topLevelIndent = toDoList.items[items[0]].indent;
    let topLevelItems = [], children: Record<number, number[]> = {}, currentTopLevelItem = -1;
    for (let i = 0; i < items.length; i++) {
        if (toDoList.items[items[i]].indent === topLevelIndent) {
            currentTopLevelItem = items[i];
            topLevelItems.push(currentTopLevelItem);
            children[currentTopLevelItem] = [];
        } else
            children[currentTopLevelItem].push(items[i]);
    }

    // Sort all children
    let sortedChildren: Record<number, number[]> = {};
    for (let i = 0; i < topLevelItems.length; i++) {
        let item = topLevelItems[i];
        sortedChildren[item] = sortByState(toDoList, children[item]);
    }

    // Sort top-level items by state
    let sortedItems: number[] = [];
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
};


/**
 * Returns a list of visible item IDs of the `toDoList`, which are present in `itemIDs` list.
 */
const getVisibleItemIDs = (toDoList: ToDoList, itemIDs: number[]) => {
    let visibleItems = [];
    let collapsedParentIndent = NaN;
    for (let i = 0; i < itemIDs.length; i++) {
        const id = itemIDs[i];
        const item = toDoList.items[id];
        if (isNaN(collapsedParentIndent)) {     // add visible items and check if they are collapsed
            visibleItems.push(id);
            if (!item.is_expanded) collapsedParentIndent = item.indent;
        } else {    // filter children of collapsed parent item
            if (item.indent <= collapsedParentIndent) {    // if filtered all children of a collapsed item
                visibleItems.push(id);                                            // add item
                collapsedParentIndent = item.is_expanded ? NaN : item.indent;     // stop filtering if item is expanded
            }
        }
    }

    return visibleItems;
}
