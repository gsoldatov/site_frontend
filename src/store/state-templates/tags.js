import { deepCopy } from "../../util/copy";


/**
 * Complete list of tag attributes.
 */
export const tagAttributes = ["tag_id", "created_at", "modified_at", "tag_name", "tag_description", "is_published"];

/**
 * List of new tag attributes which is sent to backend during add tag fetch.
 */
export const addedTagAttributes = ["tag_name", "tag_description", "is_published"];


/**
 * List of existing tag attributes, which is sent to backend during update tag fetch.
 */
export const updatedTagAttributes = ["tag_id", "tag_name", "tag_description", "is_published"];


/**
 * Default current tag state.
 * NOTE: edit all arrays in the file when updating tag attributes.
 */
const _defaultCurrentTagState = {
    tag_id: 0,
    tag_name: "",
    tag_description: "",
    is_published: true,
    created_at: "",
    modified_at: ""
};

export const getDefaultCurrentTagState = () => deepCopy(_defaultCurrentTagState);
