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
