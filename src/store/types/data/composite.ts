import { z } from "zod";
import { int, nonNegativeInt, positiveIntIndex } from "../../../util/types/common";


export enum SubobjectDeleteModes {
    none,
    subobjectOnly,
    full
};

export const compositeSubobject = z.object({
    row: int,
    column: int,
    selected_tab: nonNegativeInt,
    is_expanded: z.boolean(),
    deleteMode: z.nativeEnum(SubobjectDeleteModes),
    fetchError: z.string(),
    show_description_composite: z.enum(["yes", "no", "inherit"]),
    show_description_as_link_composite: z.enum(["yes", "no", "inherit"]),
});

/** Composite object's data schema for state.toDoLists & state.editedObjects. */
export const composite = z.object({
    subobjects: z.record(int, compositeSubobject),
    display_mode: z.enum(["basic", "grouped_links", "multicolumn", "chapters"]),
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
    deleteMode: SubobjectDeleteModes.none, 
    fetchError: "",
    show_description_composite: "inherit",
    show_description_as_link_composite: "inherit"
});
