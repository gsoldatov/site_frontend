import { getTDLByObjectID } from "./data-to-do-lists";
import { getCompositeByObjectID } from "./data-composite";


/**
 * Return mocked object type base on its `objectID`.
 */
export const getObjectTypeFromID = objectID => {
    if (objectID >= 1001 && objectID <= 2000) {
        return "markdown";
    } else if (objectID >= 2001 && objectID <= 3000) {
        return "to_do_list";
    } else if (objectID >= 3001 && objectID <= 4000) {
        return "composite";
    } else {
        return "link";
    }
};


/**
 * Returns object attributes if the format returned by /objects/view handler.
 * 
 * Accepts `object_id` and, optionally, other object attributes inside `overrideValues` object.
 * 
 * Attribute values are defined based on the provided `objectID` value.
 */
export const generateObjectAttributes = (object_id, overrideValues = {}) => {
    const result = { object_id };

    for (let attr of Object.keys(defaultObjectAttributeValueGetters))
        result[attr] = attr in overrideValues ? overrideValues[attr] : defaultObjectAttributeValueGetters[attr](object_id);
    
    for (let attr of Object.keys(overrideValues))
        if (!(attr in defaultObjectAttributeValueGetters)) throw Error(`generateObjectAttributes received an incorrect attribute name in 'overrideValues' object: '${attr}'`);
    
    return result;
};


/**
 * Default object attribute value getter functions.
 * NOTE: update when object attributes are modified.
 */
export const defaultObjectAttributeValueGetters = {
    object_type: object_id => getObjectTypeFromID(object_id),
    object_name: object_id => `object #${object_id}`,
    object_description: object_id => `object #${object_id} description`,
    created_at: object_id => (new Date(Date.now() - 24*60*60*1000 - object_id)).toISOString(),
    modified_at: object_id => (new Date(Date.now() - object_id)).toISOString(),
    is_published: () => false,
    display_in_feed: () => false,
    feed_timestamp: object_id => {
        if (object_id < 0) return "";

        const now = new Date();
        const date = new Date(now.getFullYear(), now.getMonth(), 1, /*0, Math.abs(object_id)*/);
        return date.toISOString();
    },
    show_description: () => false,
    owner_id: () => 1,
    current_tag_ids: () => [1, 2, 3, 4, 5]
};


/**
 * Returns an object with `object_id`, `object_type` and `object_data` (object data format, which is returned by /objects/view route)
 * 
 * If `objectType` is provided, returns corresponding `object_type` and `object_data` values. 
 * Otherwise, object type and data contents are based on the provided `objectID` value.
 * 
 * If `overrideValues` is provided, it's passed into the function, which generates object data of the specified (or auto-set) object type.
 */
 export const generateObjectData = (objectID, objectType, overrideValues) => {
    // Set object_type
    let object_type = objectType;
    if (!objectType) {
        if (objectID >= 1001 && objectID <= 2000) object_type = "markdown";
        else if (objectID >= 2001 && objectID <= 3000) object_type = "to_do_list";
        else if (objectID >= 3001 && objectID <= 4000) object_type = "composite";
        else object_type = "link";
    }

    // Set object_data
    let object_data = object_type === "link" ? generateLinkObjectData(objectID, overrideValues)
        : object_type === "markdown" ? generateMarkdownObjectData(objectID, overrideValues)
        : object_type === "to_do_list" ? getTDLByObjectID(objectID, overrideValues)
        : object_type === "composite" ? getCompositeByObjectID(objectID, overrideValues)
        : {};
    
    return { object_id: objectID, object_type, object_data };
};


/**
 * Returns link object data (without object id or type).
 * 
 * Accepts `object_id` and, optionally, other object attributes inside `overrideValues` object.
 * 
 * NOTE: this function must be updated when any changes to link object data structure are made.
 */
export const generateLinkObjectData = (object_id, overrideValues = {}) => {
    const defaultLinkAttributeValueGetters = {
        link: object_id => `https://website${object_id}.com`,
        show_description_as_link: () => false
    };

    for (let attr of Object.keys(overrideValues))
        if (!(attr in defaultLinkAttributeValueGetters)) throw Error(`generateLinkObjectData received an incorrect attribute name in 'overrideValues' object: '${attr}'`);

    const result = {};
    for (let attr of Object.keys(defaultLinkAttributeValueGetters))
        result[attr] = attr in overrideValues ? overrideValues[attr] : defaultLinkAttributeValueGetters[attr](object_id);

    return result;
};


/**
 * Returns markdown object data (without object id or type).
 * 
 * Accepts `object_id` and, optionally, other object attributes inside `overrideValues` object.
 * 
 * NOTE: this function must be updated when any changes to markdown object data structure are made.
 */
 export const generateMarkdownObjectData = (object_id, overrideValues = {}) => {
    const defaultMarkdownAttributeValueGetters = {
        raw_text: object_id => `# Markdown Object \\#${object_id}\n1. item 1;\n2. item 2;`
    };

    for (let attr of Object.keys(overrideValues))
        if (!(attr in defaultMarkdownAttributeValueGetters)) throw Error(`generateMarkdownObjectData received an incorrect attribute name in 'overrideValues' object: '${attr}'`);

    const result = {};
    for (let attr of Object.keys(defaultMarkdownAttributeValueGetters))
        result[attr] = attr in overrideValues ? overrideValues[attr] : defaultMarkdownAttributeValueGetters[attr](object_id);

    return result;
};