/*
    Mock to-do lists.
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
        default: return defaultTDL;
    }
};


const defaultTDL = {
    sort_type: "default",
    items: [
        { item_number: 0, item_state: "active", item_text: "item 0", commentary: "comment 0", indent: 0, is_expanded: true },
        { item_number: 1, item_state: "optional", item_text: "item 1", commentary: "", indent: 0, is_expanded: true },
        { item_number: 2, item_state: "completed", item_text: "item 2", commentary: "", indent: 0, is_expanded: true },
        { item_number: 3, item_state: "cancelled", item_text: "item 3", commentary: "", indent: 0, is_expanded: true },
        { item_number: 4, item_state: "active", item_text: "item 4", commentary: "comment 4", indent: 0, is_expanded: true },
        { item_number: 5, item_state: "optional", item_text: "item 5", commentary: "", indent: 0, is_expanded: true },
        { item_number: 6, item_state: "completed", item_text: "item 6", commentary: "", indent: 0, is_expanded: true },
        { item_number: 7, item_state: "cancelled", item_text: "item 7", commentary: "", indent: 0, is_expanded: true }
    ]
};


const enterKeyDownDefaultSortTDL = {
    sort_type: "default",
    items: [
        { item_number: 0, item_state: "completed", item_text: "item 0", commentary: "commentary 0", indent: 0, is_expanded: true },
        { item_number: 1, item_state: "active", item_text: "item 1", commentary: "", indent: 0, is_expanded: true }
    ]
};


const deleteKeyDownDefaultSortTDL = {
    sort_type: "default",
    items: [
        { item_number: 0, item_state: "completed", item_text: "f", commentary: "commentary 0", indent: 0, is_expanded: true },
        { item_number: 1, item_state: "active", item_text: "item 1", commentary: "commentary 1", indent: 0, is_expanded: true }
    ]
};


const backspaceKeyDownDefaultSortTDL = {
    sort_type: "default",
    items: [
        { item_number: 0, item_state: "completed", item_text: "item 0", commentary: "commentary 0", indent: 0, is_expanded: true },
        { item_number: 1, item_state: "active", item_text: "item 1", commentary: "commentary 1", indent: 0, is_expanded: true }
    ]
};


const defaultTDLWithSortByState = {...defaultTDL, sort_type: "state"};


const enterKeyDownTDLWithSortByState = {...enterKeyDownDefaultSortTDL, sort_type: "state"};


const deleteKeyDownTDLWithSortByState = {
    sort_type: "state",
    items: [
        { item_number: 0, item_state: "completed", item_text: "", commentary: "commentary 0", indent: 0, is_expanded: true },
        { item_number: 1, item_state: "active", item_text: "item 1", commentary: "commentary 1", indent: 0, is_expanded: true },
        { item_number: 2, item_state: "completed", item_text: "item 2", commentary: "commentary 2", indent: 0, is_expanded: true }
    ]
};


const backspaceKeyDownTDLWithSortByState = {
    sort_type: "state",
    items: [
        { item_number: 0, item_state: "completed", item_text: "item 0", commentary: "commentary 0", indent: 0, is_expanded: true },
        { item_number: 1, item_state: "active", item_text: "item 1", commentary: "commentary 1", indent: 0, is_expanded: true },
        { item_number: 2, item_state: "completed", item_text: "item 2", commentary: "commentary 2", indent: 0, is_expanded: true }
    ]
};
