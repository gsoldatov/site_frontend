import { z } from "zod";

import { RouteHandler } from "../route-handler";

import { int, nonEmptyPositiveIntArray, nonNegativeInt, positiveInt, positiveIntArray, timestampOrEmptyString } from "../../../../src/util/types/common";
import type { MockBackend } from "../../mock-backend";


export class ObjectsRouteHandlers {
    [index: string]: RouteHandler | MockBackend
    private backend: MockBackend
    update: RouteHandler
    view: RouteHandler
    getPageObjectIDs: RouteHandler

    constructor(backend: MockBackend) {
        this.backend = backend;

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

                const objects = object_ids.map(object_id => this.backend.data.object(object_id).attributes);
                const object_data = object_data_ids.map(object_id => {
                    const object = this.backend.data.object(object_id);
                    return {
                        object_id,
                        object_type: object.attributes.object_type,
                        object_data: object.data
                    }
                });

                return {status: 200, body: { objects, object_data }};
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
        const isNewObject = object.object_id < 0;
        const object_id = isNewObject ? ++(this.getResponseParams as GetResponseParams).currentObjectID : object.object_id;
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
            (data as CompositeData).subobjects.forEach(subobject => {
                // Process only subobjects, which contain data that needs to be updated
                // (add it to cache and get object mapping)
                if ("object_type" in subobject) {
                    const response = inner(subobject);
                    if (subobject.object_id !== response.object_id) id_mapping[subobject.object_id] = response.object_id;
                }
            })
        }

        // Update data in cache
        if (object_type === "composite") {
            // map subobject IDs to new values & remove non-composite props
            data = data as CompositeData;
            data = { ...data, subobjects: data.subobjects.map(subobject => {
                    const object_id = id_mapping[subobject.object_id] || subobject.object_id;
                    return { ...compositeSubobjectBase.parse(subobject), object_id };
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


/***************************
 * /objects/update schemas
***************************/
const objectsUpdateAttributes = z.object({
    object_id: positiveInt,
    object_name: z.string().min(1).max(255),
    object_description: z.string(),
    is_published: z.boolean(),
    display_in_feed: z.boolean(),
    feed_timestamp: timestampOrEmptyString,
    show_description: z.boolean(),
    owner_id: positiveInt.optional(),
    added_tags: positiveInt.or(z.string().min(1)).array().optional(),
    removed_tag_ids: positiveIntArray.optional()
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
const compositeSubobject = compositeSubobjectWithAttributesAndData.or(compositeSubobjectBase.strict());

/** Full composite data schema */
const compositeData = z.object({
    display_mode: z.enum(["basic", "grouped_links", "multicolumn", "chapters"]),
    numerate_chapters: z.boolean(),    
    subobjects: compositeSubobject.array().min(1),
    deleted_subobjects: z.object({
        object_id: positiveInt, is_full_delete: z.boolean()
    }).array()
});

type CompositeData = z.infer<typeof compositeData>;
type CompositeSubobjectWithAttributesAndData = z.infer<typeof compositeSubobjectWithAttributesAndData>;


const objectData = 
    linkData
    .or(markdownData)
    .or(toDoListData)
    .or(compositeData)
;

const objectsUpdate = z.object({
    object: 
        objectsUpdateAttributes
        .merge(z.object({ object_data: objectData }))
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