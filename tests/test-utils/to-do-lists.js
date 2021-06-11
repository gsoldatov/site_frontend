import { queryByPlaceholderText } from "@testing-library/dom";


/**
 * Returns true if data in provided items is equal.
 */
export const compareItemData = (firstItemData, secondItemData) => {
    const attrs = ["item_data", "item_state", "commentary", "indent", "is_expanded"];
    for (let attr of attrs)
        if (firstItemData[attr] !== secondItemData[attr]) return false;
    return true;
};


/**
 * Returns the to-do list default item order.
 */
export const getDefaultSortOrder = toDoList => Object.keys(toDoList.items).map(id => parseInt(id)).sort((a, b) => a - b);


/**
 * Returns the numeric indent based on the CSS class of the indent <div> in the `item`.
 */
const indentClassNames = ["", "one", "two", "three", "four", "five"];
export const getRenderedItemIndent = item => {
    const indentDiv = item.querySelector(".to-do-list-item-indent");
    if (indentDiv === null) throw Error("Indent <div> not found.");
    const classNames = indentDiv.className;
    let indent = 0;
    for (let i = 1; i < indentClassNames.length; i++)
        if (classNames.indexOf(indentClassNames[i]) > -1) indent = i;
    return indent;
};


/**
 * Check if items in `TDLContainer` have the IDs corresponding to `itemOrder`
 */
export const checkRenderedItemsOrder = (TDLContainer, itemOrder) => {
    const items = TDLContainer.querySelectorAll(".to-do-list-item-container");
    items.forEach((item, index) => {
        if (!queryByPlaceholderText(item, "New item")) {  // skip new item input
            expect(item.querySelector(".to-do-list-item-id").textContent).toEqual(itemOrder[index].toString());
        }
    });
};
