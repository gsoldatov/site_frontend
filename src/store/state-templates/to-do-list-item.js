import { deepCopy } from "../../util/copy";

/**
 * To-do list item's default state.
 * NOTE: when object attributes and data are modified, mock data generating functions should be updated as well (see _mocks/data-to-do-lists).
 */
const itemDefaults = {
    item_state: "active", 
    item_text: "", 
    commentary: "", 
    indent: 0, 
    is_expanded: true
};


/**
 * Returns a deep copy of to-do list item default values.
 */
export const getItemDefaults = () => deepCopy(itemDefaults);
