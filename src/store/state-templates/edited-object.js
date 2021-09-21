/**
 * List of object attributes (excluding tags, data & UI settings).
 */
export const objectAttributes = ["object_id", "object_type", "created_at", "modified_at", "object_name", "object_description", "is_published", "owner_id"];

/**
 * Default state of an edited object.
 * TODO: place all lists here
 * NOTE: update `objectAttributes` and add/update object data fetches when updating object attributes.
 */
export const defaultEditedObjectState = {       // `getDefaultEditedObjectState` function from reducers/helpers/object should be used to get default state
    // attributes
    object_id: -1,
    object_type: "link",
    object_name: "",
    object_description: "",
    created_at: "",
    modified_at: "",
    is_published: false,
    owner_id: 0,

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
    },
    composite: {
        subobjects: {}
    },

    // object UI
    markdownDisplayMode: "both"
};