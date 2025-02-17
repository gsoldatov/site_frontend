import { z } from "zod";

import { RouteHandler } from "../route-handler";

import { deepCopy } from "../../../../src/util/copy";

import { int, nonEmptyPositiveIntArray, nonNegativeInt, positiveInt, positiveIntArray, timestampOrNull } from "../../../../src/types/common";
import type { MockBackend } from "../../mock-backend";


export class ObjectsRouteHandlers {
    [index: string]: RouteHandler | MockBackend
    private backend: MockBackend
    bulkUpsert: RouteHandler
    update: RouteHandler
    view: RouteHandler
    getPageObjectIDs: RouteHandler

    constructor(backend: MockBackend) {
        this.backend = backend;

        this.bulkUpsert = new RouteHandler(backend, {
            route: "/objects/bulk_upsert", method: "POST",
            getResponseParams: {
                currentObjectID: 1000,  // current "existing" object_id (incremented, when a new composite subobject is added) 
                currentTagID: 1000      // current "existing" tag_id (incremented, when a new tag is added)
            },
            getResponse: function(this: RouteHandler, requestContext) {
                const { objects } = objectsBulkUpsertRequestBody.parse(requestContext.body);
                // Get object ID map
                const new_object_ids_map = objects.reduce((result, curr) => {
                    if (curr.object_id <= 0) {
                        result[curr.object_id] = (this.getResponseParams as any).currentObjectID++;
                    }
                    return result;
                }, {} as Record<number, number>);
            
                // Get objects' attributes and tags
                const objects_attributes_and_tags = objects.map(object => {
                    const addedTagIDs = object.added_tags.map(t => {
                        if (typeof(t) === "number") return t;
                        
                        // Add string tags to cache & map them to cached tag ID
                        const tagID = (this.getResponseParams as any).currentTagID++;
                        this.backend.cache.tags.update(tagID, { tag_name: t });
                        return tagID;
                    });
                    const current_tag_ids = object.object_id <= 0
                        // New objects get tags from added
                        ? addedTagIDs
                        // Existing objects get generated tag IDs + added - removed
                        : [ ...new Set(
                            this.backend.data.object(object.object_id).attributes.current_tag_ids
                            .concat(addedTagIDs)
                            .filter(tagID => !object.removed_tag_ids.includes(tagID))
                        )]
            
                    const result = {
                        ...object,
                        object_id: new_object_ids_map[object.object_id] || object.object_id,
                        created_at: (new Date(Date.now() + 24*60*60*1000 + object.object_id)).toISOString(),
                        modified_at: (new Date(Date.now() + 2*24*60*60*1000 + object.object_id)).toISOString(),
                        current_tag_ids
                    }
            
                    for (let attr of ["added_tags", "removed_tag_ids", "object_data"]) delete (result as any)[attr];

                    // Add object attributes to cache before returning them
                    this.backend.cache.objects.update(result.object_id, result);
                    return result;
                });
            
                // Get objects' data
                const objects_data = objects.map(o => {
                    const object_id = new_object_ids_map[o.object_id] || o.object_id;
                    // Map new subobject IDs
                    const object_data = deepCopy(o.object_data);
                    if (o.object_type === "composite") {
                        for (let subobject of object_data.subobjects)
                            subobject.subobject_id = subobject.subobject_id <= 0 ? new_object_ids_map[subobject.subobject_id] : subobject.subobject_id;
                    }

                    // Add object data to cache
                    this.backend.cache.objects.update(object_id, undefined, object_data);
            
                    return {
                        object_id,
                        object_type: o.object_type,
                        object_data
                    };
                });
            
                // Send response
                return { status: 200, body: { objects_attributes_and_tags, objects_data, new_object_ids_map }};
            }
        })

        this.update = new RouteHandler(backend, {
            route: "/objects/update", method: "PUT",
            getResponseParams: {
                currentObjectID: 1000,  // current "existing" object_id (incremented, when a new composite subobject is added) 
                currentTagID: 1000      // current "existing" tag_id (incremented, when a new tag is added)
            },
            getResponse: function (this: RouteHandler, requestContext) {
                const { object } = objectsUpdate.parse(requestContext.body);
                const timestamp = (new Date()).toISOString();
                
                // Bind processing function to this handler, so it can use its state
                const fn = processObjectUpdate.bind(this);

                // Prepare and return response
                const object_ = fn(object, timestamp);
                return { status: 200, body: { object: object_ } };
            }
        });

        this.view = new RouteHandler(backend, {
            route: "/objects/view", method: "POST",
            getResponse: requestContext => {
                const { object_ids = [], object_data_ids = [] } = objectsViewBody.parse(requestContext.body);

                const objects_attributes_and_tags = object_ids.map(object_id => this.backend.data.object(object_id).attributes);
                const objects_data = object_data_ids.map(object_id => {
                    const object = this.backend.data.object(object_id);
                    return {
                        object_id,
                        object_type: object.attributes.object_type,
                        object_data: object.data
                    }
                });

                return {status: 200, body: { objects_attributes_and_tags, objects_data }};
            }
        });

        this.getPageObjectIDs = new RouteHandler(backend, {
            route: "/objects/get_page_object_ids", method: "POST",
            getResponse: requestContext => {
                // NOTE: this is a stub, not full implementation
                const { pagination_info } = getPageObjectIDs.parse(requestContext.body);
                const responseObj = { 
                    pagination_info: {
                        ...pagination_info,
                        total_items: 1,
                        object_ids: [1]
                    }
                };
            
                return { status: 200, body: responseObj };  
            }
        });
    }
}


/**
 * Accepts `object` with object add/update data and `timestamp` to be set in `modified_at` & `created_at` props, and:
 * - if object is new, maps it to an existing `object_id`;
 * - if new tags are added, maps them to existing tag ids and sets them in backend cache;
 * - sets object attributes & tags in backend cache;
 * - if composite subobjects include new/existing object updates:
 *      - recursively adds added/updated subobjects to cache;
 *      - maps added objects' ids to existing values;
 *      - prepares id_mapping, which is returned in object data;
 *      - maps subobject ids in main object's data;
 * - sets object data in cache;
 * 
 * Returns `object` object from response body of /objects/add & /objects/update route handlers.
 */
const processObjectUpdate = function(this: RouteHandler, object: ObjectsAddUpdateObject, timestamp: string): Record<string, any> {
    type GetResponseParams = { currentObjectID: number, currentTagID: number };

    const inner = (function(this: RouteHandler, object: ObjectsAddUpdateObject | CompositeSubobjectWithAttributesAndData): Record<string, any> {
        const hasTags = "added_tags" in object || "removed_tag_ids" in object;
        const objectID = "subobject_id" in object ? object.subobject_id : object.object_id; // composite subobjects have `subobject_id` instead of `object_id`
        const isNewObject = objectID < 0;
        const object_id = isNewObject ? ++(this.getResponseParams as GetResponseParams).currentObjectID : objectID;
        const object_type = isNewObject ? object.object_type : this.backend.data.object(object_id).attributes.object_type;

        // Get current `current_tag_ids` for the object
        let current_tag_ids = [...this.backend.data.object(object_id).attributes.current_tag_ids];

        // Process tag updates (main object only)
        let tagUpdates: { added_tag_ids: number[], removed_tag_ids: number[] };
        if (hasTags) {
            tagUpdates = { added_tag_ids: [], removed_tag_ids: object?.removed_tag_ids || [] };
            (object["added_tags"] || []).forEach(tagIDOrName => {
                // Added existing tags
                if (typeof(tagIDOrName) === "number") tagUpdates.added_tag_ids.push(tagIDOrName);
                // Get tag ID for new tags & add them to cache
                else {
                    const tagID = ++(this.getResponseParams as GetResponseParams).currentTagID;
                    this.backend.cache.tags.update(tagID, { tag_name: tagIDOrName, created_at: timestamp, modified_at: timestamp });
                    tagUpdates.added_tag_ids.push(tagID);
                }
            });

            // Get new `current_tag_ids`
            current_tag_ids = current_tag_ids.concat(tagUpdates.added_tag_ids.filter(tagID => !current_tag_ids.includes(tagID)));
            current_tag_ids = current_tag_ids.filter(tagID => !tagUpdates.removed_tag_ids.includes(tagID));
        } else {
            tagUpdates = { added_tag_ids: [], removed_tag_ids: [] };
        }

        // Update attributes in cache
        let attributes: Record<string, any> = { ...object, modified_at: timestamp, current_tag_ids };
        if (isNewObject) attributes = { ...attributes, object_id, created_at: timestamp };
        for (let attr of ["added_tags", "removed_tag_ids", "object_data"]) delete attributes[attr];
        this.backend.cache.objects.update(object_id, attributes);

        // Add composite subobjects with updated data to cache & create mapping for their ids
        // NOTE: resursive `inner` calls will skip this block, since composite subobjects can't contain updates
        let data = object["object_data"], id_mapping: Record<number, number> = {};
        if (object_type === "composite") {
            (data as ObjectsUpdateComposite).subobjects.forEach(subobject => {
                // Process only subobjects, which contain data that needs to be updated
                // (add it to cache and get object mapping)
                if ("object_type" in subobject) {
                    const response = inner(subobject);
                    if (subobject.subobject_id !== response.object_id) id_mapping[subobject.subobject_id] = response.object_id;
                }
            })
        }

        // Update data in cache
        if (object_type === "composite") {
            // map subobject IDs to new values & remove non-composite props
            data = data as ObjectsUpdateComposite;
            data = { ...data, subobjects: data.subobjects.map(subobject => {
                    const object_id = id_mapping[subobject.subobject_id] || subobject.subobject_id;
                    return { ...compositeSubobject.parse(subobject), object_id };
                })
            };
        }
        this.backend.cache.objects.update(object_id, undefined, data);

        // Prepare & return response body
        const responseBody: Record<string, any> = { ...object, 
            object_id,
            object_type,
            created_at: timestamp,
            modified_at: timestamp,
            owner_id: object["owner_id"] || 1,
            tag_updates: tagUpdates
        };
        for (let attr of ["added_tags", "removed_tag_ids", "object_data"]) delete responseBody[attr];
        // Composite objects return object data with subobject id mapping, other types don't
        if (object_type === "composite") responseBody["object_data"] = { id_mapping };

        return responseBody;
    }).bind(this);
    
    return inner(object);
};


/*******************************
 * /objects/bulk_upsert schemas
*******************************/
/** Attributes & tags without `object_type` */
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

// Object data
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

const compositeSubobject = z.object({
    subobject_id: int,
    row: nonNegativeInt,
    column: nonNegativeInt,
    selected_tab: nonNegativeInt,
    is_expanded: z.boolean(),
    show_description_composite: z.enum(["yes", "no", "inherit"]),
    show_description_as_link_composite: z.enum(["yes", "no", "inherit"])
});

const objectsBulkUpsertComposite = z.object({
    display_mode: z.enum(["basic", "grouped_links", "multicolumn", "chapters"]),
    numerate_chapters: z.boolean(),    
    subobjects: compositeSubobject.array()
});

const objectsBulkUpsertObject = 
    objectsBulkUpsertAttributes.merge(z.object({ object_type: z.literal("link"), object_data: linkData }))
    .or(
        objectsBulkUpsertAttributes.merge(z.object({ object_type: z.literal("markdown"), object_data: markdownData }))
    )
    .or(
        objectsBulkUpsertAttributes.merge(z.object({ object_type: z.literal("to_do_list"), object_data: toDoListData }))
    )
    .or(
        objectsBulkUpsertAttributes.merge(z.object({ object_type: z.literal("composite"), object_data: objectsBulkUpsertComposite }))
    )
;

const objectsBulkUpsertRequestBody = z.object({
    objects: objectsBulkUpsertObject.array(),
    deleted_object_ids: positiveInt.array()
});


/***************************
 * /objects/update schemas
***************************/
const objectsUpdateAttributes = z.object({
    object_id: positiveInt,
    object_name: z.string().min(1).max(255),
    object_description: z.string(),
    is_published: z.boolean(),
    display_in_feed: z.boolean(),
    feed_timestamp: timestampOrNull,
    show_description: z.boolean(),
    owner_id: positiveInt.optional(),
    added_tags: positiveInt.or(z.string().min(1)).array().optional(),
    removed_tag_ids: positiveIntArray.optional()
});

/** Subobject attributes can be passed along with basic props */
const compositeSubobjectWithAttributesBase = objectsUpdateAttributes
    .omit({ object_id: true, added_tags: true, removed_tag_ids: true })
    // .merge(z.object({ object_id: int }))
    .merge(compositeSubobject)
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
const objectsUpdateCompositeSubobject = compositeSubobjectWithAttributesAndData.or(compositeSubobject.strict());

/** Full composite data schema */
const objectsUpdateComposite = z.object({
    display_mode: z.enum(["basic", "grouped_links", "multicolumn", "chapters"]),
    numerate_chapters: z.boolean(),    
    subobjects: objectsUpdateCompositeSubobject.array().min(1),
    deleted_subobjects: z.object({
        object_id: positiveInt, is_full_delete: z.boolean()
    }).array()
});

type ObjectsUpdateComposite = z.infer<typeof objectsUpdateComposite>;
type CompositeSubobjectWithAttributesAndData = z.infer<typeof compositeSubobjectWithAttributesAndData>;

const objectsUpdateObjectData = 
    linkData
    .or(markdownData)
    .or(toDoListData)
    .or(objectsUpdateComposite)
;

const objectsUpdate = z.object({
    object: 
        objectsUpdateAttributes
        .merge(z.object({ object_data: objectsUpdateObjectData }))
});

type ObjectsUpdateObject = z.infer<typeof objectsUpdate.shape.object>;
type ObjectsAddUpdateObject = ObjectsUpdateObject & { object_type?: string };    // NOTE: implement fully if/when required


/***************************
 * /objects/view schema
***************************/
export const objectsViewBody = z.object({
    object_ids: nonEmptyPositiveIntArray.optional(),
    object_data_ids: nonEmptyPositiveIntArray.optional()
}).refine(({ object_ids, object_data_ids}) => (object_ids || []).length > 0 || (object_data_ids || []).length > 0);


/***********************************
 * /objects/getPageObjectIDs schema
***********************************/
const getPageObjectIDs = z.object({
    pagination_info: z.object({
        page: positiveInt,
        items_per_page: positiveInt,
        order_by: z.enum(["object_name", "modified_at", "feed_timestamp"]),
        sort_order: z.enum(["asc", "desc"]),
        filter_text: z.string().max(255).optional(),
        object_types: z.enum(["link", "markdown", "to_do_list", "composite"]).optional(),
        tags_filter: positiveIntArray.optional(),
        show_only_displayed_in_feed: z.boolean().optional()
    })
});