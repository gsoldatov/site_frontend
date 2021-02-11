// Returns true if data in provided items is equal.
export const compareItemData = (firstItemData, secondItemData) => {
    const attrs = ["item_data", "item_state", "commentary"];
    for (let attr of attrs)
        if (firstItemData[attr] !== secondItemData[attr]) return false;
    return true;
};


// Returns the to-do list default item order.
export const getDefaultSortOrder = toDoList => Object.keys(toDoList.items).map(id => parseInt(id)).sort();


// Returns the to-do list item order when items are sorted by state.
export const getSortByStateOrder = toDoList => {
    const items = Object.keys(toDoList.items).map(id => parseInt(id)).sort();
    let result = [];
    ["active", "optional", "completed", "cancelled"].forEach(state => {
        result = result.concat(...items.filter(id => toDoList.items[id].item_state === state));
    });
    return result;
};
