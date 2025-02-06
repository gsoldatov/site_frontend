import { z } from "zod";

import { type FetchResult } from "../../../../fetches/fetch-runner";

import { object, objectType } from "../../../store/data/objects";
import { link } from "../../../store/data/links";
import { markdown } from "../../../store/data/markdown";
import { toDoList, toDoListItem } from "../../../store/data/to-do-list";
import { composite, compositeSubobject } from "../../../store/data/composite";
import { nonNegativeInt, int, positiveIntArray, positiveInt } from "../../../common";


/**********************************************
 *                  Common
 *********************************************/


const backendLink = link;
const backendMarkdown = markdown.pick({ raw_text: true });
const backendToDoListItem = toDoListItem.extend({ item_number: nonNegativeInt });
const backendToDoList = toDoList.pick({ sort_type: true }).extend({ items: backendToDoListItem.array() });
const backendCompositeSubobject = compositeSubobject.omit({ deleteMode: true, fetchError: true }).extend({ subobject_id: int });
const backendComposite = composite.omit({ subobjects: true }).extend({ subobjects: backendCompositeSubobject.array() });


/** Backend link object data type. */
export type BackendLink = z.infer<typeof backendLink>;
/** Backend markdown object data type. */
export type BackendMarkdown = z.infer<typeof backendMarkdown>;
/** Backend to-do list object data type. */
export type BackendToDoList = z.infer<typeof backendToDoList>;
/** Backend composite object data type. */
export type BackendComposite = z.infer<typeof backendComposite>;
/** Backend object data type. */
export type BackendObjectData = BackendLink | BackendMarkdown | BackendToDoList | BackendComposite;

/** Backend to-do list item type. */
export type BackendToDoListItem = z.infer<typeof backendToDoListItem>;
/** Backend composite subobject type. */
export type BackendCompositeSubobject = z.infer<typeof backendCompositeSubobject>;


/**********************************************
 *              /objects/add
 *********************************************/




/**********************************************
 *              /objects/view
 *********************************************/


/** /objects/view backend response schema for "object" list items. */
const objectsViewResponseObject = object.extend({ current_tag_ids: int.array() });

/** /objects/view backend response schema for "object_data" list items. */
const objectsViewResponseObjectData = z.intersection(
    z.object({ object_id: int }),
    z.discriminatedUnion("object_type", [
        z.object({ object_type: z.literal("link"), object_data: backendLink }),
        z.object({ object_type: z.literal("markdown"), object_data: backendMarkdown }),
        z.object({ object_type: z.literal("to_do_list"), object_data: backendToDoList }),
        z.object({ object_type: z.literal("composite"), object_data: backendComposite })
    ])
);


/** /objects/view response body schema. */
export const objectsViewResponseSchema = z.object({
    objects_attributes_and_tags: objectsViewResponseObject.array(),
    objects_data: objectsViewResponseObjectData.array()
});

type ObjectsViewResponseSchema = z.infer<typeof objectsViewResponseSchema>;
export type ObjectsViewFetchResult = FetchResult | FetchResult & ObjectsViewResponseSchema;


/**********************************************
 *            /objects/search
 *********************************************/


/** /objects/search response body schema. */
export const objectsSearchResponseSchema = z.object({
    object_ids: positiveIntArray
});

type ObjectsSearchResponseSchema = z.infer<typeof objectsSearchResponseSchema>;
export type ObjectsSearchFetchResult = FetchResult & Partial<ObjectsSearchResponseSchema>;


/**********************************************
 *      /objects/get_page_object_ids
 *********************************************/


/** /objects/get_page_object_ids request pagination info schema. */
export const objectsPaginationInfo = z.object({
    page: positiveInt,
    items_per_page: positiveInt,
    order_by: z.enum(["object_name", "modified_at", "feed_timestamp"]),
    sort_order: z.enum(["asc", "desc"]),
    filter_text: z.string().max(255).optional(),
    object_types: objectType.array().optional(),
    tags_filter: positiveIntArray.optional(),
    show_only_displayed_in_feed: z.boolean().optional()
});


/** /objects/get_page_object_ids response body schema. */
export const objectsGetPageObjectIDsResponseSchema = z.object({
    pagination_info: objectsPaginationInfo.extend({
        object_ids: positiveIntArray,
        total_items: nonNegativeInt
    })
});


/** /objects/get_page_object_ids request pagination info schema. */
export type ObjectsPaginationInfo = z.infer<typeof objectsPaginationInfo>;
type ObjectsGetPageObjectIDsResponseSchema = z.infer<typeof objectsGetPageObjectIDsResponseSchema>;
export type ObjectsGetPageObjectIDsFetchResult = FetchResult | FetchResult & Pick<ObjectsGetPageObjectIDsResponseSchema["pagination_info"], "object_ids" | "total_items">;


/**********************************************
 *  /objects/view_composite_hierarchy_elements
 *********************************************/


/** /objects/view_composite_hierarchy_elements response body schema. */
export const objectsViewCompositeHierarchyElementsResponseSchema = z.object({
    composite: positiveIntArray, 
    non_composite: positiveIntArray 
});

type ObjectsViewCompositeHierarchyElementsResponseSchema = z.infer<typeof objectsViewCompositeHierarchyElementsResponseSchema>;
export type ObjectsViewCompositeHierarchyElementsFetchResult = FetchResult | (FetchResult & ObjectsViewCompositeHierarchyElementsResponseSchema);
