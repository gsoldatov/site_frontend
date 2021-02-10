export const getTDLByObjectID = objectID => {
    if (objectID.toString() === "2901") return enterKeyDownDefaultSortTDL;
    if (objectID.toString() === "2902") return deleteKeyDownDefaultSortTDL;

    return defaultTDL;
}


export const defaultTDL = {
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


export const enterKeyDownDefaultSortTDL = {
    sort_type: "default",
    items: [
        { item_number: 0, item_state: "completed", item_text: "item 0", commentary: "commentary 0", indent: 0, is_expanded: true },
        { item_number: 1, item_state: "active", item_text: "item 1", commentary: "", indent: 0, is_expanded: true },
    ]
};

export const deleteKeyDownDefaultSortTDL = {
    sort_type: "default",
    items: [
        { item_number: 0, item_state: "completed", item_text: "f", commentary: "commentary 0", indent: 0, is_expanded: true },
        { item_number: 1, item_state: "active", item_text: "item 1", commentary: "", indent: 0, is_expanded: true },
    ]
};

// export const upDownDefaultSortTDL = {
//     sort_type: "default",
//     items: [
//         { item_number: 0, item_state: "active", item_text: "00", commentary: "", indent: 0, is_expanded: true },
//         { item_number: 1, item_state: "active", item_text: "1111", commentary: "", indent: 0, is_expanded: true },
//         { item_number: 2, item_state: "active", item_text: "222222", commentary: "", indent: 0, is_expanded: true },
//         { item_number: 3, item_state: "active", item_text: "3333", commentary: "", indent: 0, is_expanded: true },
//         { item_number: 4, item_state: "active", item_text: "44", commentary: "", indent: 0, is_expanded: true },
//     ]
// }

// export const TDLWithSortByState = {...defaultTDL, sort_type: "state"};
