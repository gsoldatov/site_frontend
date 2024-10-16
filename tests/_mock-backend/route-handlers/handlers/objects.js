import { RouteHandler } from "../route-handler";


export class ObjectsRouteHandlers {
    constructor(backend) {
        this.backend = backend;

        this.update = new RouteHandler(backend, {
            route: "/objects/update", method: "PUT",
            getResponseParams: {
                currentObjectID: 1000,  // current "existing" object_id (incremented, when a new composite subobject is added) 
                currentTagID: 1000      // current "existing" tag_id (incremented, when a new tag is added)
            },
            getResponse: requestContext => {
                const { object } = requestContext.body;
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
                const { object_ids = [], object_data_ids = [] } = requestContext.body;
                if (object_ids.length === 0 && object_data_ids.length === 0)
                    return { status: 400, body: { _error: "Non-empty object_ids or object_data_ids required." }};

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
                const { pagination_info } = requestContext.body;
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
const processObjectUpdate = function (object, timestamp) {
    const inner = function(object) {
        const isNewObject = object.object_id < 0;
        const object_id = isNewObject ? ++this.getResponseParams.currentObjectID : object.object_id;
        const object_type = isNewObject ? object.object_type : this.backend.data.object(object_id).attributes.object_type;

        // Process tag updates
        const tagUpdates = { added_tag_ids: [], removed_tag_ids: object.removed_tag_ids };
        (object["added_tags"] || []).forEach(tagIDOrName => {
            // Added existing tags
            if (typeof(tagIDOrName) === "number") tagUpdates.added_tag_ids.push(tagIDOrName);
            // Get tag ID for new tags & add them to cache
            else {
                const tagID = ++this.getResponseParams.currentTagID;
                this.backend.cache.tag.update(tagID, { tag_name: tagIDOrName, created_at: timestamp, modified_at: timestamp });
                tagUpdates.added_tag_ids.push(tagID);
            }
        });

        // Get new `current_tag_ids`
        let current_tag_ids = [...this.backend.data.object(object_id).attributes.current_tag_ids];
        current_tag_ids = current_tag_ids.concat(tagUpdates.added_tag_ids.filter(tagID => !current_tag_ids.includes(tagID)));
        current_tag_ids = current_tag_ids.filter(tagID => !tagUpdates.removed_tag_ids.includes(tagID));

        // Update attributes in cache
        let attributes = { ...object, modified_at: timestamp, current_tag_ids };
        if (isNewObject) attributes = { ...attributes, object_id, created_at: timestamp };
        for (let attr of ["added_tags", "removed_tag_ids", "object_data"]) delete attributes[attr];
        this.backend.cache.objects.update(object_id, attributes);

        // Add composite subobjects with updated data to cache & create mapping for their ids
        // NOTE: resursive `inner` calls will skip this block, since composite subobjects can't contain updates
        let data = object["object_data"], id_mapping = {};
        if (object_type === "composite") {
            object["object_data"].subobjects.forEach(subobject => {
                // Process only subobjects, which contain data that needs to be updated
                // (add it to cache and get object mapping)
                if (Object.keys(subobject).includes("object_type")) {
                    const response = inner(subobject);
                    if (subobject.object_id !== response.object_id) id_mapping[subobject.object_id] = response.object_id;
                }
            })
        }

        // Update data in cache
        if (object_type === "composite") {
            // map subobject IDs to new values & remove non-composite props
            data = { ...data, subobjects: data.subobjects.map(subobject => {
                    const object_id = id_mapping[subobject.object_id] || subobject.object_id;
                    const result = {};
                    ["row", "column", "selected_tab", "is_expanded", "show_description_composite", 
                        "show_description_as_link_composite"].forEach(attr => result[attr] = subobject[attr]);
                    result["object_id"] = object_id;
                    return result;
                })
            };
        }
        this.backend.cache.objects.update(object_id, undefined, data);

        // Prepare & return response body
        const responseBody = { ...object, 
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
    }
    
    const boundInner = inner.bind(this);    // bind RouteHandler instance to inner function to access its props
    return boundInner(object);
};
