import { deepCopy } from "../../util/copy";


/**
 * Subobject's `deleteMode` values.
 */
export const enumDeleteModes = {
    none: 0,
    subobjectOnly: 1,
    full: 2
};

/**
 * Composite object's subobject default state.
 */
const subobjectDefaults = {
    row: -1, 
    column: -1, 
    selected_tab: 0, 
    is_expanded: true,
    deleteMode: enumDeleteModes.none, 
    fetchError: ""
};


/**
 * Returns a deep copy of a composite subobject's default state.
 */
export const getSubobjectDefaults = () => deepCopy(subobjectDefaults);