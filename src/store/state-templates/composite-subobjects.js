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
 * Possible options for display of composite subobject's description & and link object data.
 */
export const enumShowDescriptionComposite = {
    yes: { name: "Yes", value: "yes" },
    no: { name: "No", value: "no" },
    inherit: { name: "Inherit", value: "inherit" }
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
    fetchError: "",
    show_description_composite: enumShowDescriptionComposite.inherit.value,
    show_description_as_link_composite: enumShowDescriptionComposite.inherit.value
};


/**
 * Returns a deep copy of a composite subobject's default state.
 */
export const getSubobjectDefaults = () => deepCopy(subobjectDefaults);


/**
 * Composite object's data props, which are serialized when running add or update fetch to the backend.
 */
export const serializedCompositeObjectDataProps = Object.keys(subobjectDefaults).filter(prop => ["fetchError", "deleteMode"].indexOf(prop) === -1);
