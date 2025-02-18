import { z } from "zod"

import { type FetchResult } from "../../../../fetches/fetch-runner";
import { int, intIndex, positiveInt, nonNegativeInt, positiveIntArray, timestampOrNull } from "../../../common"
import { objectsViewResponseSchema } from "./general";


/** Object attributes in the /objects/bulk_upsert request format. */
const objectsBulkUpsertAttributes = z.object({
    object_id: int,
    object_name: z.string().min(1).max(255),
    object_description: z.string(),
    is_published: z.boolean(),
    display_in_feed: z.boolean(),
    feed_timestamp: timestampOrNull,
    show_description: z.boolean(),
    owner_id: positiveInt,
    added_tags: positiveInt.or(z.string().min(1)).array(),
        removed_tag_ids: positiveIntArray
});


/** `object_data` schema of a link object in the /objects/bulk_upsert request format. */
const linkData = z.object({
    link: z.string().url(),
    show_description_as_link: z.boolean()
});

/** `object_data` schema of a markdown object in the /objects/bulk_upsert request format. */
const markdownData = z.object({
    raw_text: z.string().min(1)
});

/** `object_data` schema of a to-do list object in the /objects/bulk_upsert request format. */
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

/** Composite subobject schema in the /objects/bulk_upsert request format. */
const compositeSubobject = z.object({
    subobject_id: int,
    row: nonNegativeInt,
    column: nonNegativeInt,
    selected_tab: nonNegativeInt,
    is_expanded: z.boolean(),
    show_description_composite: z.enum(["yes", "no", "inherit"]),
    show_description_as_link_composite: z.enum(["yes", "no", "inherit"])
});

/** `object_data` schema of a composite object in the /objects/bulk_upser request format. */
const compositeData = z.object({
    display_mode: z.enum(["basic", "grouped_links", "multicolumn", "chapters"]),
    numerate_chapters: z.boolean(),    
    subobjects: compositeSubobject.array()
});

/** `object_data` of any possible type in the /objects/bulk_upsert request format. */
export type ObjectsBulkUpsertObjectData = z.infer<typeof linkData>
    | z.infer<typeof markdownData>
    | z.infer<typeof toDoListData>
    | z.infer<typeof compositeData>
;


// Object type + data options
const linkObjectTypeAndData = z.object({ object_type: z.literal("link"), object_data: linkData });
const markdownObjectTypeAndData = z.object({ object_type: z.literal("markdown"), object_data: markdownData });
const toDoListObjectTypeAndData = z.object({ object_type: z.literal("to_do_list"), object_data: toDoListData });
const compositeObjectTypeAndData = z.object({ object_type: z.literal("composite"), object_data: compositeData });


/** Object's attributes, tags & data in the /objects/bulk_upsert format. */
export const objectsBulkUpsertObject = objectsBulkUpsertAttributes.merge(linkObjectTypeAndData)
    .or(objectsBulkUpsertAttributes.merge(markdownObjectTypeAndData))
    .or(objectsBulkUpsertAttributes.merge(toDoListObjectTypeAndData))
    .or(objectsBulkUpsertAttributes.merge(compositeObjectTypeAndData));


/** /objects/bulk_upsert request body schema. */
export const objectsBulkUpsertRequestBody = z.object({
    objects: objectsBulkUpsertObject.array().min(1).max(100),
    deleted_object_ids: positiveInt.array().max(1000)
})


/** /objects/bulk_upser response body schema. */
export const objectsBulkUpsertResponseSchema = objectsViewResponseSchema
    .merge(z.object({
        new_object_ids_map: z.record(intIndex, positiveInt)
    }));


export type ObjectsBulkUpsertFetchResult = FetchResult
    | FetchResult & { response: z.infer<typeof objectsBulkUpsertResponseSchema> };
