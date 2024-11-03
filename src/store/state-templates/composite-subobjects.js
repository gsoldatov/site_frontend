import { deepCopy } from "../../util/copy";


/**
 * Possible options for display of composite subobject's description & and link object data.
 */
export const enumShowDescriptionComposite = {
    yes: { name: "Yes", value: "yes" },
    no: { name: "No", value: "no" },
    inherit: { name: "Inherit", value: "inherit" }
};


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
    show_description_composite: enumShowDescriptionComposite.inherit.value,
    show_description_as_link_composite: enumShowDescriptionComposite.inherit.value
};


/**
 * Composite subobject state, which is checked for modification.
 */
export const subobjectAttributesCheckedForModification = ["row", "column", "selected_tab", "is_expanded", "show_description_composite", "show_description_as_link_composite"];


/**
 * Composite object's data props, which are serialized when running add or update fetch to the backend.
 */
export const serializedCompositeObjectDataProps = Object.keys(subobjectDefaults).filter(prop => ["fetchError", "deleteMode"].indexOf(prop) === -1);
