/**
 * Mock to-do lists.
*/
export const getTDLByObjectID = objectID => {
    const strID = objectID.toString();
    switch (strID) {
        case "2901": return enterKeyDownDefaultSortTDL;
        case "2902": return deleteKeyDownDefaultSortTDL;
        case "2903": return backspaceKeyDownDefaultSortTDL;
        case "2904": return defaultTDLWithSortByState;
        case "2905": return enterKeyDownTDLWithSortByState;
        case "2906": return deleteKeyDownTDLWithSortByState;
        case "2907": return backspaceKeyDownTDLWithSortByState;
        case "2908": return sortTestTDL;
        case "2909": return upDownTDL;
        case "2910": return upDownTDLSortedByState;
        case "2911": return DNDFlatList;
        case "2912": return DNDIndentedList;
        case "2913": return DNDListWithChildren;
        case "2914": return DNDListWithCollapsedItem;
        case "2915": return itemIndentationTDL;
        default: return defaultTDL;
    }
};


/*
- 0
    - 1
    - 2
        - 3
- 4
- 5
    - 6
        - 7
*/
export const defaultTDL = {
    sort_type: "default",
    items: [
        { item_number: 0, item_state: "active", item_text: "item 0", commentary: "comment 0", indent: 0, is_expanded: true },
        { item_number: 1, item_state: "optional", item_text: "item 1", commentary: "", indent: 1, is_expanded: true },
        { item_number: 2, item_state: "completed", item_text: "item 2", commentary: "", indent: 1, is_expanded: true },
        { item_number: 3, item_state: "cancelled", item_text: "item 3", commentary: "", indent: 2, is_expanded: true },
        { item_number: 4, item_state: "active", item_text: "item 4", commentary: "comment 4", indent: 0, is_expanded: true },
        { item_number: 5, item_state: "optional", item_text: "item 5", commentary: "", indent: 0, is_expanded: true },
        { item_number: 6, item_state: "completed", item_text: "item 6", commentary: "", indent: 1, is_expanded: true },
        { item_number: 7, item_state: "cancelled", item_text: "item 7", commentary: "", indent: 2, is_expanded: true }
    ]
};


export const enterKeyDownDefaultSortTDL = {
    sort_type: "default",
    items: [
        { item_number: 0, item_state: "completed", item_text: "item 0", commentary: "", indent: 0, is_expanded: true },
        { item_number: 1, item_state: "active", item_text: "item 1", commentary: "comment 1", indent: 1, is_expanded: true },
        { item_number: 2, item_state: "active", item_text: "item 2", commentary: "", indent: 2, is_expanded: true },
        { item_number: 3, item_state: "active", item_text: "item 3", commentary: "", indent: 0, is_expanded: true },
        { item_number: 4, item_state: "active", item_text: "item 4", commentary: "comment 4", indent: 1, is_expanded: true },
        { item_number: 5, item_state: "active", item_text: "item 5", commentary: "", indent: 2, is_expanded: true }
    ]
};


// const deleteKeyDownDefaultSortTDL = {
//     sort_type: "default",
//     items: [
//         { item_number: 0, item_state: "completed", item_text: "f", commentary: "commentary 0", indent: 0, is_expanded: true },
//         { item_number: 1, item_state: "active", item_text: "item 1", commentary: "commentary 1", indent: 0, is_expanded: true }
//     ]
// };
const deleteKeyDownDefaultSortTDL = {
    sort_type: "default",
    items: [
        { item_number: 0, item_state: "active", item_text: "item 0", commentary: "commentary 0", indent: 0, is_expanded: true },
        { item_number: 1, item_state: "completed", item_text: "item 1", commentary: "commentary 1", indent: 1, is_expanded: true },
        { item_number: 2, item_state: "active", item_text: "item 2", commentary: "commentary 2", indent: 2, is_expanded: true },
        { item_number: 3, item_state: "active", item_text: "item 3", commentary: "commentary 3", indent: 3, is_expanded: true }
    ]
};


/*
    > 0
        - 1
    - 2
        - 3
            - 4
                - 5
    merge 3 & 4 => merge 1 & 2
*/
const backspaceKeyDownDefaultSortTDL = {
    sort_type: "default",
    items: [
        { item_number: 0, item_state: "active", item_text: "item 0", commentary: "commentary 0", indent: 0, is_expanded: false },
        { item_number: 1, item_state: "completed", item_text: "item 1", commentary: "commentary 1", indent: 1, is_expanded: true },
        { item_number: 2, item_state: "active", item_text: "item 2", commentary: "commentary 2", indent: 0, is_expanded: true },
        { item_number: 3, item_state: "completed", item_text: "item 3", commentary: "commentary 3", indent: 1, is_expanded: true },
        { item_number: 4, item_state: "active", item_text: "item 4", commentary: "commentary 4", indent: 2, is_expanded: true },
        { item_number: 5, item_state: "active", item_text: "item 5", commentary: "commentary 5", indent: 3, is_expanded: true }
    ]
};


const defaultTDLWithSortByState = {...defaultTDL, sort_type: "state"};


const enterKeyDownTDLWithSortByState = {...enterKeyDownDefaultSortTDL, sort_type: "state"};


/*
    ? 0             - 1
    - 1             - 2
    - 2      =>         - 3
        - 3         ? 0
*/
const deleteKeyDownTDLWithSortByState = {
    sort_type: "state",
    items: [
        { item_number: 0, item_state: "completed", item_text: "item 0", commentary: "commentary 0", indent: 0, is_expanded: true },
        { item_number: 1, item_state: "active", item_text: "item 1", commentary: "commentary 1", indent: 0, is_expanded: true },
        { item_number: 2, item_state: "active", item_text: "item 2", commentary: "commentary 2", indent: 0, is_expanded: true },
        { item_number: 3, item_state: "active", item_text: "item 3", commentary: "commentary 3", indent: 1, is_expanded: true }
    ]
};


const backspaceKeyDownTDLWithSortByState = {
    sort_type: "state",
    items: [
        { item_number: 0, item_state: "completed", item_text: "item 0", commentary: "commentary 0", indent: 0, is_expanded: true },
        { item_number: 1, item_state: "active", item_text: "item 1", commentary: "commentary 1", indent: 0, is_expanded: true },
        { item_number: 2, item_state: "active", item_text: "item 2", commentary: "commentary 2", indent: 0, is_expanded: true },
        { item_number: 3, item_state: "active", item_text: "item 3", commentary: "commentary 3", indent: 1, is_expanded: true }
    ]
};


/*
    x 0                             - 3
    + 1                                 - 8
    ? 2                                     - 9
    - 3                                     - 10
        x 4                             - 11
        + 5                             ? 12
            + 6                         + 5
            - 7             =>              - 7
        - 8                                 + 6
            - 9                         x 4
            ? 10                    - 13
        - 11                            - 16
        ? 12                                x 17
    - 13                                ? 14
        ? 14                                + 15
            + 15                    ? 2
        - 16                        + 1
            x 17                    x 0
*/
export const expectedSortTestTDLStateSortOrder = [3, 8, 9, 10, 11, 12, 5, 7, 6, 4, 13, 16, 17, 14, 15, 2, 1, 0];
const sortTestTDL = {
    sort_type: "default",
    items: [
        { item_number: 0, item_state: "cancelled", item_text: "item 0", commentary: "commentary 0", indent: 0, is_expanded: true },
        { item_number: 1, item_state: "completed", item_text: "item 1", commentary: "commentary 1", indent: 0, is_expanded: true },
        { item_number: 2, item_state: "optional", item_text: "item 2", commentary: "commentary 2", indent: 0, is_expanded: true },
        { item_number: 3, item_state: "active", item_text: "item 3", commentary: "commentary 3", indent: 0, is_expanded: true },
        { item_number: 4, item_state: "cancelled", item_text: "item 4", commentary: "commentary 4", indent: 1, is_expanded: true },
        { item_number: 5, item_state: "completed", item_text: "item 5", commentary: "commentary 5", indent: 1, is_expanded: true },
        { item_number: 6, item_state: "completed", item_text: "item 6", commentary: "commentary 6", indent: 2, is_expanded: true },
        { item_number: 7, item_state: "active", item_text: "item 7", commentary: "commentary 7", indent: 2, is_expanded: true },
        { item_number: 8, item_state: "active", item_text: "item 8", commentary: "commentary 8", indent: 1, is_expanded: true },
        { item_number: 9, item_state: "active", item_text: "item 9", commentary: "commentary 9", indent: 2, is_expanded: true },
        { item_number: 10, item_state: "optional", item_text: "item 10", commentary: "commentary 10", indent: 2, is_expanded: true },
        { item_number: 11, item_state: "active", item_text: "item 11", commentary: "commentary 11", indent: 1, is_expanded: true },
        { item_number: 12, item_state: "optional", item_text: "item 12", commentary: "commentary 12", indent: 1, is_expanded: true },
        { item_number: 13, item_state: "active", item_text: "item 13", commentary: "commentary 13", indent: 0, is_expanded: true },
        { item_number: 14, item_state: "optional", item_text: "item 14", commentary: "commentary 14", indent: 1, is_expanded: true },
        { item_number: 15, item_state: "completed", item_text: "item 15", commentary: "commentary 15", indent: 2, is_expanded: true },
        { item_number: 16, item_state: "active", item_text: "item 16", commentary: "commentary 16", indent: 1, is_expanded: true },
        { item_number: 17, item_state: "cancelled", item_text: "item 17", commentary: "commentary 17", indent: 2, is_expanded: true }
    ]
};


/*
    > 0
        - 1
        - 2
    - 3
        > 4
            - 5
        - 6
    - 7
    - 8
        - 9
*/
export const expectedUpDownTDLItemOrder = [0, 3, 4, 6, 7, 8, 9];
const upDownTDL = {
    sort_type: "default",
    items: [
        { item_number: 0, item_state: "active", item_text: "item 0", commentary: "commentary 0", indent: 0, is_expanded: false },
        { item_number: 1, item_state: "active", item_text: "item 1", commentary: "commentary 1", indent: 1, is_expanded: true },
        { item_number: 2, item_state: "active", item_text: "item 2", commentary: "commentary 2", indent: 1, is_expanded: true },
        { item_number: 3, item_state: "active", item_text: "item 3", commentary: "commentary 3", indent: 0, is_expanded: true },
        { item_number: 4, item_state: "active", item_text: "item 4", commentary: "commentary 4", indent: 1, is_expanded: false },
        { item_number: 5, item_state: "active", item_text: "item 5", commentary: "commentary 5", indent: 2, is_expanded: true },
        { item_number: 6, item_state: "active", item_text: "item 6", commentary: "commentary 6", indent: 1, is_expanded: true },
        { item_number: 7, item_state: "active", item_text: "item 7", commentary: "commentary 7", indent: 0, is_expanded: true },
        { item_number: 8, item_state: "active", item_text: "item 8", commentary: "commentary 8", indent: 0, is_expanded: true },
        { item_number: 9, item_state: "active", item_text: "item 9", commentary: "commentary 9", indent: 1, is_expanded: true }
    ]
};


const upDownTDLSortedByState = { ...upDownTDL, sort_type: "state" };


const DNDFlatList = {
    sort_type: "default",
    items: [
        { item_number: 0, item_state: "active", item_text: "item 0", commentary: "commentary 0", indent: 0, is_expanded: true },
        { item_number: 1, item_state: "active", item_text: "item 1", commentary: "commentary 1", indent: 0, is_expanded: true },
        { item_number: 2, item_state: "active", item_text: "item 2", commentary: "commentary 2", indent: 0, is_expanded: true }
    ]
};


const DNDIndentedList = {
    sort_type: "default",
    items: [
        { item_number: 0, item_state: "active", item_text: "item 0", commentary: "commentary 0", indent: 0, is_expanded: true },
        { item_number: 1, item_state: "active", item_text: "item 1", commentary: "commentary 1", indent: 0, is_expanded: true },
        { item_number: 2, item_state: "active", item_text: "item 2", commentary: "commentary 2", indent: 0, is_expanded: true },
        { item_number: 3, item_state: "active", item_text: "item 3", commentary: "commentary 3", indent: 1, is_expanded: true },
        { item_number: 4, item_state: "active", item_text: "item 4", commentary: "commentary 4", indent: 2, is_expanded: true },
        { item_number: 5, item_state: "active", item_text: "item 5", commentary: "commentary 5", indent: 3, is_expanded: true },
        { item_number: 6, item_state: "active", item_text: "item 6", commentary: "commentary 6", indent: 4, is_expanded: true },
        { item_number: 7, item_state: "active", item_text: "item 7", commentary: "commentary 7", indent: 5, is_expanded: true }
    ]
};


const DNDListWithChildren = {
    sort_type: "default",
    items: [
        { item_number: 0, item_state: "active", item_text: "item 0", commentary: "commentary 0", indent: 0, is_expanded: true },
        { item_number: 1, item_state: "active", item_text: "item 1", commentary: "commentary 1", indent: 1, is_expanded: true },
        { item_number: 2, item_state: "active", item_text: "item 2", commentary: "commentary 2", indent: 2, is_expanded: true },
        { item_number: 3, item_state: "active", item_text: "item 3", commentary: "commentary 3", indent: 3, is_expanded: true },
        { item_number: 4, item_state: "active", item_text: "item 4", commentary: "commentary 4", indent: 0, is_expanded: true },
        { item_number: 5, item_state: "active", item_text: "item 5", commentary: "commentary 5", indent: 1, is_expanded: true },
        { item_number: 6, item_state: "active", item_text: "item 6", commentary: "commentary 6", indent: 2, is_expanded: true },
        { item_number: 7, item_state: "active", item_text: "item 7", commentary: "commentary 7", indent: 3, is_expanded: true }
    ]
};


const DNDListWithCollapsedItem = {
    sort_type: "default",
    items: [
        { item_number: 0, item_state: "active", item_text: "item 0", commentary: "commentary 0", indent: 0, is_expanded: false },
        { item_number: 1, item_state: "active", item_text: "item 1", commentary: "commentary 1", indent: 1, is_expanded: false },
        { item_number: 2, item_state: "active", item_text: "item 2", commentary: "commentary 2", indent: 2, is_expanded: false },
        { item_number: 3, item_state: "active", item_text: "item 3", commentary: "commentary 3", indent: 3, is_expanded: true },
        { item_number: 4, item_state: "active", item_text: "item 4", commentary: "commentary 4", indent: 0, is_expanded: true },
        { item_number: 5, item_state: "active", item_text: "item 5", commentary: "commentary 5", indent: 1, is_expanded: true },
        { item_number: 6, item_state: "active", item_text: "item 6", commentary: "commentary 6", indent: 2, is_expanded: true },
        { item_number: 7, item_state: "active", item_text: "item 7", commentary: "commentary 7", indent: 3, is_expanded: true }
    ]
};


/*
    - 0
    - 1
        - 2
            - 3
                - 4
                    - 5
                        - 6
    - 7
*/
const itemIndentationTDL = {
    sort_type: "default",
    items: [
        { item_number: 0, item_state: "active", item_text: "item 0", commentary: "commentary 0", indent: 0, is_expanded: true },
        { item_number: 1, item_state: "active", item_text: "item 1", commentary: "commentary 1", indent: 0, is_expanded: true },
        { item_number: 2, item_state: "active", item_text: "item 2", commentary: "commentary 2", indent: 1, is_expanded: true },
        { item_number: 3, item_state: "active", item_text: "item 3", commentary: "commentary 3", indent: 2, is_expanded: true },
        { item_number: 4, item_state: "active", item_text: "item 4", commentary: "commentary 4", indent: 3, is_expanded: true },
        { item_number: 5, item_state: "active", item_text: "item 5", commentary: "commentary 5", indent: 4, is_expanded: true },
        { item_number: 6, item_state: "active", item_text: "item 6", commentary: "commentary 6", indent: 5, is_expanded: true },
        { item_number: 7, item_state: "active", item_text: "item 7", commentary: "commentary 7", indent: 0, is_expanded: true }
    ]
};
