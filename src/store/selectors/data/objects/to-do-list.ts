import type { ToDoList } from "../../../types/data/to-do-list";


/** Contains selectors for to-do list object data. */
export class ToDoListSelectors {
    /**
     * Returns item IDs of a `toDoList` sorted according its current `sort_type`.
     */
    static sortedItemIDs(toDoList: ToDoList) {
        if (toDoList.sort_type === "default") return [...toDoList.itemOrder];
        if (toDoList.sort_type === "state") return sortByState(toDoList, toDoList.itemOrder);
        throw Error(`Incorrect sort_type: ${toDoList.sort_type}`);
    };
    
    /**
     * Returns sorted item IDs of visible items (parents of which are not collapsed) of the `toDoList`.
     */
    static visibleItemIDs(toDoList: ToDoList) {
        const sortedItemIDs = ToDoListSelectors.sortedItemIDs(toDoList);
        return getVisibleItemIDs(toDoList, sortedItemIDs);
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
