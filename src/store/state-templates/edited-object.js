/**
 * List of object attributes (excluding tags, data & UI settings).
 */
export const objectAttributes = ["object_id", "object_type", "created_at", "modified_at", "object_name", "object_description", "is_published", 
    "display_in_feed", "feed_timestamp", "show_description", "owner_id"];


/**
 * List of new object attributes (excluding tags & data), which is sent to backend during add object fetch.
 */
export const addedObjectAttributes = ["object_type" ,"object_name", "object_description", "is_published", "show_description", "display_in_feed", "feed_timestamp", "owner_id"];


/**
 * List of existing object attributes (excluding tags & data), which is sent to backend during update object fetch.
 */
export const updatedObjectAttributes = ["object_id" ,"object_name", "object_description", "is_published","display_in_feed", "feed_timestamp", "show_description", "owner_id"];


/**
 * List of object attributes of a subobject, which is sent to backend when adding/updating it.
 * 
 * Object id, tags & data, as well as composite properties (column & row positions, selected_tab, etc.), are added separately (see `serializeObjectData` function).
 */
export const compositeSubobjectObjectAttributes = ["object_name", "object_description", "object_type", "is_published", "display_in_feed", "feed_timestamp", "show_description", "owner_id"];


/**
 * Default state of an edited object.
 * NOTE: update other lists in the file when updating object attributes.
 * NOTE: when object attributes and data are modified, mock data generating functions should be updated as well (see _mocks/data-objects and attribute/data-generating functions declared/used there).
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
    display_in_feed: false, 
    feed_timestamp: "",
    show_description: false,
    owner_id: 0,

    // object's tags
    currentTagIDs: [],   
    addedTags: [],
    removedTagIDs: [],

    // data
    link: {
        link: "",
        show_description_as_link: false,
    },
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
        subobjects: {},
        display_mode: "basic",
        numerate_chapters: false
    },

    // object UI
    markdownDisplayMode: "both"
};
