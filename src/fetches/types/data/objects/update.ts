import { z } from "zod";
import { int, positiveInt, positiveIntArray, nonNegativeInt, timestampOrEmptyString } from "../../../../util/types/common";


export const objectsUpdateAttributes = z.object({
    object_id: positiveInt,
    object_name: z.string().min(1).max(255),
    object_description: z.string(),
    is_published: z.boolean(),
    display_in_feed: z.boolean(),
    feed_timestamp: timestampOrEmptyString,
    show_description: z.boolean(),
    owner_id: positiveInt.optional(),
    added_tags: positiveInt.or(z.string().min(1)).array().optional(),
    removed_tag_ids: positiveIntArray
});


const linkData = z.object({
    link: z.string().url(),
    show_description_as_link: z.boolean()
});

const markdownData = z.object({
    raw_text: z.string().min(1)
});

const toDoListData = z.object({
    sort_type: z.enum(["default", "state"]),
    items: z.object({
        item_number: nonNegativeInt,
        item_state: z.enum(["active", "completed", "optional", "cancelled"]),
        item_text: z.string(),
        commentary: z.string(),
        indent: int.min(0).max(5),
        is_expanded: z.boolean()
    }).array().min(1)
});

/** Subobject props without props passed for update */
const compositeSubobjectBase = z.object({
    object_id: int,
    row: nonNegativeInt,
    column: nonNegativeInt,
    selected_tab: nonNegativeInt,
    is_expanded: z.boolean(),
    show_description_composite: z.enum(["yes", "no", "inherit"]),
    show_description_as_link_composite: z.enum(["yes", "no", "inherit"])
});

/** Subobject attributes can be passed along with basic props */
const compositeSubobjectWithAttributesBase = objectsUpdateAttributes
    .omit({ object_id: true, added_tags: true, removed_tag_ids: true })
    .merge(z.object({ object_id: int }))
    .merge(compositeSubobjectBase)
;

/** Full schema of composite subobjects with attributes & data provided */
const compositeSubobjectWithAttributesAndData = 
    compositeSubobjectWithAttributesBase
    .merge(z.object({ 
        object_type: z.literal("link"), 
        object_data: linkData
    }))
    // subobject with markdown data & object attributes
    .or(compositeSubobjectWithAttributesBase
        .merge(z.object({ 
            object_type: z.literal("markdown"), 
            object_data: markdownData
    })))    
    // subobject with to-do list data & object attributes
    .or(compositeSubobjectWithAttributesBase
        .merge(z.object({ 
            object_type: z.literal("to_do_list"), 
            object_data: toDoListData
    })))
;

/** Full schema of a composite subobject (with & without attributes and data) */
export const objectsUpdateCompositeSubobject = compositeSubobjectWithAttributesAndData.or(compositeSubobjectBase.strict());

/** Full composite data schema */
const compositeData = z.object({
    display_mode: z.enum(["basic", "grouped_links", "multicolumn", "chapters"]),
    numerate_chapters: z.boolean(),    
    subobjects: objectsUpdateCompositeSubobject.array().min(1),
    deleted_subobjects: z.object({
        object_id: positiveInt, is_full_delete: z.boolean()
    }).array()
});

export const objectsUpdateData = 
    linkData
    .or(markdownData)
    .or(toDoListData)
    .or(compositeData)
;


/** /objects/update schema for `object` attribute of request body. */
export const objectsUpdateRequestBodyObject = objectsUpdateAttributes.merge(z.object({ object_data: objectsUpdateData }));

// export const objectsUpdateRequestBody = z.object({
//     object: 
//         objectsUpdateAttributes
//         .merge(z.object({ object_data: objectsUpdateData }))
// });

export type ObjectsUpdateObjectData = z.infer<typeof linkData> | z.infer<typeof markdownData> | z.infer<typeof toDoListData>
    | z.infer<typeof compositeData>;
export type ObjectsUpdateCompositeSubobject = z.infer<typeof objectsUpdateCompositeSubobject>;
export type ObjectsUpdateCompositeSubobjects = z.infer<typeof compositeData.shape.subobjects>;
export type ObjectsUpdateCompositeDeletedSubobjects = z.infer<typeof compositeData.shape.deleted_subobjects>;
