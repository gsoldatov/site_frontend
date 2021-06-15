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
 * Accepts `object_id` and, optionally, other object attributes.
 * 
 * Attribute values are defined based on the provided `objectID` value.
 */
export const generateObjectAttributes = ({ object_id, object_type, object_name, object_description, created_at, modified_at, current_tag_ids }) => {
    return {
        object_id,
        object_type: object_type !== undefined ? object_type : getObjectTypeFromID(object_id),
        object_name: object_name !== undefined ? object_name : `object #${object_id}`,
        object_description: object_description !== undefined ? object_description : `object #${object_id} description`,
        created_at: created_at !== undefined ? created_at : (new Date(Date.now() - 24*60*60*1000 - object_id)).toUTCString(),
        modified_at: modified_at !== undefined ? modified_at : (new Date(Date.now() - object_id)).toUTCString(),
        current_tag_ids: current_tag_ids !== undefined ? current_tag_ids : [1, 2, 3, 4, 5]
    };
};


/**
 * Returns an object with `object_id`, `object_type` and `object_data` (object data format, which is returned by /objects/view route)
 * 
 * If `objectType` is provided, returns corresponding `object_type` and `object_data` values.
 * 
 * Otherwise, object type and data contents are based on the provided `objectID` value.
 */
export const generateObjectData = (objectID, objectType) => {
    // Set object_type
    let object_type = objectType;
    if (!objectType) {
        if (objectID >= 1001 && objectID <= 2000) object_type = "markdown";
        else if (objectID >= 2001 && objectID <= 3000) object_type = "to_do_list";
        else if (objectID >= 3001 && objectID <= 4000) object_type = "composite";
        else object_type = "link";
    }

    // Set object_data
    let object_data = object_type === "link" ? { link: `https://website${objectID}.com` }
        : object_type === "markdown" ? { raw_text: `# Markdown Object \\#${objectID}\n1. item 1;\n2. item 2;` }
        : object_type === "to_do_list" ? getTDLByObjectID(objectID)
        : object_type === "composite" ? getCompositeByObjectID(objectID)
        : {};
    
    return { object_id: objectID, object_type, object_data };

    // // markdown
    // if (objectID >= 1001 && objectID <= 2000) return {object_id: objectID, object_type: "markdown", object_data: {raw_text: `# Markdown Object \\#${objectID}\n1. item 1;\n2. item 2;`}};
    // // to-do lists
    // else if (objectID >= 2001 && objectID <= 3000) return {object_id: objectID, object_type: "to_do_list", object_data: getTDLByObjectID(objectID) };
    // // composite
    // else if (objectID >= 3001 && objectID <= 4000) return {object_id: objectID, object_type: "composite", object_data: getCompositeByObjectID(objectID) };
    // // links (default)
    // else return {object_id: objectID, object_type: "link", object_data: {link: `https://website${objectID}.com`}};
};
