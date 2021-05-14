import { deepCopy } from "../../util/copy";


/*
    Returns a deep copy of default edited object state.
    Sets `object_id` in the returned object if it's provided.
*/
export const getDefaultEditedObjectState = object_id => {
    const defaultState = deepCopy(defaultEditedObjectState);
    if (object_id !== undefined) defaultState.object_id = object_id;
    return defaultState;
}

// Default state of edited object
const defaultEditedObjectState = {
    // attributes
    object_id: -1,
    object_type: "link",
    object_name: "",
    object_description: "",
    created_at: "",
    modified_at: "",

    // object's tags
    currentTagIDs: [],   
    addedTags: [],
    removedTagIDs: [],

    // data
    link: "",
    markdown: { 
        raw_text: "", 
        parsed: "" 
    },
    toDoList: {
        itemOrder: [],
        setFocusOnID: -1,
        caretPositionOnFocus: -1,
        newItemInputIndent: 0,
        draggedParent: -1,
        draggedChildren: [],
        draggedOver: -1,
        dropIndent: 0,

        sort_type: "default",
        items: {}
    }
};
