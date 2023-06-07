/**
 * List of possible item states in the order of their update.
 */
export const TDLItemStates = ["active", "optional", "completed", "cancelled"];


/**
 * Returns next to-do list item's state, based on its current value
 */
export const getNewTDLItemState = state => {
    const pos = TDLItemStates.indexOf(state);
    if (pos === -1) return null;
    return TDLItemStates[(pos + 1) % TDLItemStates.length];
}

/**
 * Returns to-do list object data (without object id or type).
 * 
 * Accepts `object_id` and, optionally, other object attributes inside `overrideValues` object.
 * 
 * NOTE: this function must be updated when any changes to to-do list object data structure are made.
 */
 export const generateTDLObjectData = (object_id, overrideValues = {}) => {
    const defaultTDLAttributeValueGetters = {
        sort_type: () => "default",
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
        items: () => [
            generateTDLItem(0, { item_state: "active", item_text: "item 0", commentary: "comment 0", indent: 0, is_expanded: true }),
            generateTDLItem(1, { item_state: "optional", item_text: "item 1", commentary: "", indent: 1, is_expanded: true }),
            generateTDLItem(2, { item_state: "completed", item_text: "item 2", commentary: "", indent: 1, is_expanded: true }),
            generateTDLItem(3, { item_state: "cancelled", item_text: "item 3", commentary: "", indent: 2, is_expanded: true }),
            generateTDLItem(4, { item_state: "active", item_text: "item 4", commentary: "comment 4", indent: 0, is_expanded: true }),
            generateTDLItem(5, { item_state: "optional", item_text: "item 5", commentary: "", indent: 0, is_expanded: true }),
            generateTDLItem(6, { item_state: "completed", item_text: "item 6", commentary: "", indent: 1, is_expanded: true }),
            generateTDLItem(7, { item_state: "cancelled", item_text: "item 7", commentary: "", indent: 2, is_expanded: true })
        ]
    };

    for (let attr of Object.keys(overrideValues))
        if (!(attr in defaultTDLAttributeValueGetters)) throw Error(`getTDLObjectData received an incorrect attribute name in 'overrideValues' object: '${attr}'`);

    const result = {};
    for (let attr of Object.keys(defaultTDLAttributeValueGetters))
        result[attr] = attr in overrideValues ? overrideValues[attr] : defaultTDLAttributeValueGetters[attr](object_id);

    return result;
};


/**
 * Returns to-do list item object data (for the `items` array of to-do list items in object data).
 * 
 * Accepts `item_number` and, optionally, other object attributes inside `overrideValues` object.
 * 
 * NOTE: this function must be updated when any changes to to-do list item data structure are made.
 */
 export const generateTDLItem = (item_number, overrideValues = {}) => {
    const defaultItemValueGetters = {
        item_state: () => "active",
        item_text: item_number => `item ${item_number}`,
        commentary: item_number => `comment ${item_number}`,
        indent: () => 0,
        is_expanded: () => true
    };

    for (let attr of Object.keys(overrideValues))
        if (!(attr in defaultItemValueGetters)) throw Error(`generateTDLItem received an incorrect attribute name in 'overrideValues' object: '${attr}'`);

    const result = { item_number };
    for (let attr of Object.keys(defaultItemValueGetters))
        result[attr] = attr in overrideValues ? overrideValues[attr] : defaultItemValueGetters[attr](item_number);
    
    return result;
};



/**
 * Returns a mock to-do list object data based on the provided `objectID`.
 * If `overrideValues` is passed and default object data is returned, the returned attribute value are overriden with provided via this param.
*/
export const getTDLByObjectID = (objectID, overrideValues) => {
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
        default: return generateTDLObjectData(objectID, overrideValues);
    }
};

/**
 * Kept because of exports in previously existing tests. Otherwise, duplicates default to-do list values returned by `generateTDLObjectData` function.
 */
export const defaultTDL = generateTDLObjectData();


export const enterKeyDownDefaultSortTDL = generateTDLObjectData(undefined, {
    sort_type: "default",
    items: [
        { item_number: 0, item_state: "completed", item_text: "item 0", commentary: "", indent: 0, is_expanded: true },
        { item_number: 1, item_state: "active", item_text: "item 1", commentary: "comment 1", indent: 1, is_expanded: true },
        { item_number: 2, item_state: "active", item_text: "item 2", commentary: "", indent: 2, is_expanded: true },
        { item_number: 3, item_state: "active", item_text: "item 3", commentary: "", indent: 0, is_expanded: true },
        { item_number: 4, item_state: "active", item_text: "item 4", commentary: "comment 4", indent: 1, is_expanded: true },
        { item_number: 5, item_state: "active", item_text: "item 5", commentary: "", indent: 2, is_expanded: true }
    ]
});


const deleteKeyDownDefaultSortTDL = generateTDLObjectData(undefined, {
    sort_type: "default",
    items: [
        { item_number: 0, item_state: "active", item_text: "item 0", commentary: "commentary 0", indent: 0, is_expanded: true },
        { item_number: 1, item_state: "completed", item_text: "item 1", commentary: "commentary 1", indent: 1, is_expanded: true },
        { item_number: 2, item_state: "active", item_text: "item 2", commentary: "commentary 2", indent: 2, is_expanded: true },
        { item_number: 3, item_state: "active", item_text: "item 3", commentary: "commentary 3", indent: 3, is_expanded: true }
    ]
});


/*
    > 0
        - 1
    - 2
        - 3
            - 4
                - 5
    merge 3 & 4 => merge 1 & 2
*/
const backspaceKeyDownDefaultSortTDL = generateTDLObjectData(undefined, {
    sort_type: "default",
    items: [
        { item_number: 0, item_state: "active", item_text: "item 0", commentary: "commentary 0", indent: 0, is_expanded: false },
        { item_number: 1, item_state: "completed", item_text: "item 1", commentary: "commentary 1", indent: 1, is_expanded: true },
        { item_number: 2, item_state: "active", item_text: "item 2", commentary: "commentary 2", indent: 0, is_expanded: true },
        { item_number: 3, item_state: "completed", item_text: "item 3", commentary: "commentary 3", indent: 1, is_expanded: true },
        { item_number: 4, item_state: "active", item_text: "item 4", commentary: "commentary 4", indent: 2, is_expanded: true },
        { item_number: 5, item_state: "active", item_text: "item 5", commentary: "commentary 5", indent: 3, is_expanded: true }
    ]
});


const defaultTDLWithSortByState = generateTDLObjectData(undefined, { sort_type: "state" });


const enterKeyDownTDLWithSortByState = {...enterKeyDownDefaultSortTDL, sort_type: "state"};


/*
    ? 0             - 1
    - 1             - 2
    - 2      =>         - 3
        - 3         ? 0
*/
const deleteKeyDownTDLWithSortByState = generateTDLObjectData(undefined, {
    sort_type: "state",
    items: [
        { item_number: 0, item_state: "completed", item_text: "item 0", commentary: "commentary 0", indent: 0, is_expanded: true },
        { item_number: 1, item_state: "active", item_text: "item 1", commentary: "commentary 1", indent: 0, is_expanded: true },
        { item_number: 2, item_state: "active", item_text: "item 2", commentary: "commentary 2", indent: 0, is_expanded: true },
        { item_number: 3, item_state: "active", item_text: "item 3", commentary: "commentary 3", indent: 1, is_expanded: true }
    ]
});


const backspaceKeyDownTDLWithSortByState = generateTDLObjectData(undefined, {
    sort_type: "state",
    items: [
        { item_number: 0, item_state: "completed", item_text: "item 0", commentary: "commentary 0", indent: 0, is_expanded: true },
        { item_number: 1, item_state: "active", item_text: "item 1", commentary: "commentary 1", indent: 0, is_expanded: true },
        { item_number: 2, item_state: "active", item_text: "item 2", commentary: "commentary 2", indent: 0, is_expanded: true },
        { item_number: 3, item_state: "active", item_text: "item 3", commentary: "commentary 3", indent: 1, is_expanded: true }
    ]
});


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
const sortTestTDL = generateTDLObjectData(undefined, {
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
});


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
const upDownTDL = generateTDLObjectData(undefined, {
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
});


const upDownTDLSortedByState = { ...upDownTDL, sort_type: "state" };


const DNDFlatList = generateTDLObjectData(undefined, {
    sort_type: "default",
    items: [
        { item_number: 0, item_state: "active", item_text: "item 0", commentary: "commentary 0", indent: 0, is_expanded: true },
        { item_number: 1, item_state: "active", item_text: "item 1", commentary: "commentary 1", indent: 0, is_expanded: true },
        { item_number: 2, item_state: "active", item_text: "item 2", commentary: "commentary 2", indent: 0, is_expanded: true }
    ]
});


const DNDIndentedList = generateTDLObjectData(undefined, {
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
});


const DNDListWithChildren = generateTDLObjectData(undefined, {
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
});


const DNDListWithCollapsedItem = generateTDLObjectData(undefined, {
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
});


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
const itemIndentationTDL = generateTDLObjectData(undefined, {
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
});
