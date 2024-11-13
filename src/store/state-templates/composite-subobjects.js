/**
 * Composite object's subobject default state.
 * 
 * NOTE: when subobject attributes are modified, list(-s) below should be updated as well.
 * NOTE: when subobject attributes are modified, mock data generating functions should be updated as well (see _mocks/data-composite)
 */
const subobjectDefaults = {
    row: -1, 
    column: -1, 
    selected_tab: 0, 
    is_expanded: true,
    deleteMode: 0,  // NOTE: change to using enum, if not deleted
    fetchError: "",
    show_description_composite: "inherit",      // NOTE: change to using enum, if not deleted
    show_description_as_link_composite: "inherit"   // NOTE: change to using enum, if not deleted
};



/**
 * Composite object's data props, which are serialized when running add or update fetch to the backend.
 */
export const serializedCompositeObjectDataProps = Object.keys(subobjectDefaults).filter(prop => ["fetchError", "deleteMode"].indexOf(prop) === -1);
