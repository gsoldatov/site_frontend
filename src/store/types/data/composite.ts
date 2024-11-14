import { z } from "zod";
import { int, nonNegativeInt, positiveIntIndex } from "../../../util/types/common";


export enum SubobjectDeleteMode {
    none,
    subobjectOnly,
    full
};

const compositeShowDescription = z.enum(["yes", "no", "inherit"]);
export const compositeShowDescriptionValues = compositeShowDescription.options;

export const compositeSubobject = z.object({
    row: int,
    column: int,
    selected_tab: nonNegativeInt,
    is_expanded: z.boolean(),
    deleteMode: z.nativeEnum(SubobjectDeleteMode),
    fetchError: z.string(),
    show_description_composite: compositeShowDescription,
    show_description_as_link_composite: compositeShowDescription
});

const compositeDisplayMode = z.enum(["basic", "grouped_links", "multicolumn", "chapters"]);
export const compositeDisplayModeValues = compositeDisplayMode.options;

/** Composite object's data schema for state.toDoLists & state.editedObjects. */
export const composite = z.object({
    subobjects: z.record(int, compositeSubobject),
    display_mode: z.enum(compositeDisplayModeValues),
    numerate_chapters: z.boolean()
});


/** Composite object's data type for state.toDoLists & state.editedObjects. */
export type Composite = z.infer<typeof composite>;
/** Composite object data or its part containing `subobjects` record. */
export type CompositeSubobjects = Pick<Composite, "subobjects">;


/** state.composite data store schema. */
export const compositeStore = z.record(positiveIntIndex, composite);


/** Returns default state of a composite subobject. */
export const getDefaultSubobject = () => compositeSubobject.parse({
    row: -1, 
    column: -1, 
    selected_tab: 0, 
    is_expanded: true,
    deleteMode: SubobjectDeleteMode.none, 
    fetchError: "",
    show_description_composite: "inherit",
    show_description_as_link_composite: "inherit"
});
