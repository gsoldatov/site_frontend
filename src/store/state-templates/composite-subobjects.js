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
export const subobjectDefaults = {
    row: -1, 
    column: -1, 
    deleteMode: enumDeleteModes.none, 
    showResetDialog: false, 
    selected_tab: 0, 
    fetchError: ""
};
