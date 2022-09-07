import { autoGenerateTag } from "./mock-fetch-handlers-tags";
import { getObjectTypeFromID, generateObjectData, generateObjectAttributes } from "./data-objects";
import { getMockCompositeHierarchyElements, mapAndCacheNewSubobjects } from "./data-composite";
import { getIntegerList } from "../_util/data-generation";

export let _cachedObjects = {};      // object & object data caches, which are used to pass object data from add/update to view handler
export let _cachedObjectData = {};
export const resetObjectsCaches = () => { _cachedObjects = {}; _cachedObjectData = {} };
export const setCachedObject = (object) => {
    _cachedObjects[object.object_id] = object;
};


function handleAdd(body) {
    const object = JSON.parse(body).object;

    // Check object type
    if (!["link", "markdown", "to_do_list", "composite"].includes(object["object_type"]))
        throw new Exception("Received unexpected object_type in handleAdd");

    // Set attributes of the new object
    const objectID = 1000;
    const createdAt =  new Date();
    const modifiedAt = new Date((new Date(createdAt)).setDate(createdAt.getDate() + 1));

    const response = { ...object, 
        object_id: objectID, 
        created_at: createdAt.toISOString(),
        modified_at: modifiedAt.toISOString(),
        owner_id: object["owner_id"] || 1 
    };
    for (let attr of ["added_tags", "removed_tag_ids", "object_data"])
        delete response[attr];

    // Set object's tags (autogenerate & cache tag_ids for provided tag names => add all tag_ids to the object)
    const tagUpdates = { added_tag_ids: [] };
    (object["added_tags"] || []).forEach(tagID => {
        if (typeof(tagID) === "number") tagUpdates.added_tag_ids.push(tagID);           // numeric tagIDs are considered existing and returned as is
        else tagUpdates.added_tag_ids.push(autoGenerateTag({ tag_name: tagID }));      // string tagIDs "autogenerate" & cache new tags which can later be obtained by tag view handler
    });
    response.tag_updates = tagUpdates;

    // Map composite object's new subobjects
    if (object["object_type"] === "composite") response["object_data"] = mapAndCacheNewSubobjects(object["object_data"], createdAt, modifiedAt);

    // Cache object attributes & data
    _cachedObjects[objectID] = response;
    _cachedObjectData[objectID] = object["object_data"];

    // Send response
    return { status: 200, body: { object: response }};
}


export function handleView(body) {
    // Parse request and get object_ids and object_data_ids (filter)
    let object_ids = [];
    let object_data_ids = [];
    const bodyJSON = JSON.parse(body);

    if ("object_ids" in bodyJSON)
        object_ids = bodyJSON["object_ids"].filter(id => (id >= 0 && id <= 4000) || _cachedObjects.hasOwnProperty(id));
    
    if ("object_data_ids" in bodyJSON)
        object_data_ids = bodyJSON["object_data_ids"].filter(id => (id >= 0 && id <= 4000) || _cachedObjectData.hasOwnProperty(id));
    
    // Return 404 response if both object_ids and object_data_ids do not "exist"
    if (object_ids.length === 0 && object_data_ids.length === 0)
        return { status: 404, body: { _error: "Objects not found." }};

    // Set objects list
    let objects = object_ids.map(id => {
        if (_cachedObjects.hasOwnProperty(id)) {
            let object = _cachedObjects[id];
            if (object.hasOwnProperty("tag_updates")) {
                object.current_tag_ids = object.tag_updates.added_tag_ids;      // fetching the object after it is updated requires a different logic for getting current_tag_ids
                delete object.tag_updates;                                      // (pre_tag_ids + added_tag_ids - removed_tag_ids)
            }
            delete _cachedObjects[id];
            return object;
        }

        return generateObjectAttributes(id);
    });

    // Set object_data list
    let object_data = object_data_ids.map(id => {
        if (_cachedObjectData.hasOwnProperty(id)) {
            let data = _cachedObjectData[id];
            delete _cachedObjectData[id];
            return data;
        }
        
        return generateObjectData(id);
    });

    // Send response
    return { status: 200, body: { objects: objects, object_data: object_data }};
}


function handleDelete(body) {
    const object_ids = JSON.parse(body).object_ids.filter(id => id >= 0 && id <= 1000);
    const status = object_ids.length > 0 ? 200 : 404;    
    const responseObj = object_ids.length > 0
        ? { object_ids: object_ids }
        : {_error: "Objects not found."};
    
    return { status: status, body: responseObj };
}


function handleUpdate(body) {
    const object = JSON.parse(body).object;
    
    // Set object's tags (autogenerate & cache tag_ids for provided tag names => add all tag_ids to the object)
    const tagUpdates = { added_tag_ids: [], removed_tag_ids: object.removed_tag_ids };
    (object["added_tags"] || []).forEach(tagID => {
        if (typeof(tagID) === "number") tagUpdates.added_tag_ids.push(tagID);     // numeric tagIDs are considered existing and returned as is
        else tagUpdates.added_tag_ids.push(autoGenerateTag({ tag_name: tagID }));      // string tagIDs "autogenerate" & cache new tags which can later be obtained by tag view handler
    });
    
    // Set and send response
    const createdAt = new Date(Date.now() + 24*60*60*1000 + object.object_id);
    const modifiedAt = new Date(Date.now() + 2*24*60*60*1000 + object.object_id);
    const objectType = getObjectTypeFromID(object.object_id);

    const response = { object: {
        ...object,
        object_type: objectType,
        created_at: createdAt.toISOString(),
        modified_at: modifiedAt.toISOString(),
        tag_updates: tagUpdates
    }};
    for (let attr of ["added_tags", "removed_tag_ids", "object_data"])
        delete response[attr];

    if (objectType === "composite") response.object["object_data"] = mapAndCacheNewSubobjects(object["object_data"], createdAt, modifiedAt);

    return { status: 200, body: response };
}


function handleGetPageObjectIDs(body) {
    const pI = JSON.parse(body).pagination_info;
    const objectIDs = getMockedPageObjectIDs(pI);
    
    if (objectIDs.length === 0) {
        return { status: 404, body: { _error: "No objects found." }};
    }

    // const responseObj = {
    //     page: pI.page,
    //     items_per_page: pI.items_per_page,
    //     total_items: 100, //?
    //     order_by: pI.order_by,
    //     sort_order: pI.sort_order,
    //     filter_text: pI.filter_text,
    //     object_ids: objectIDs
    // };
    const responseObj = { 
        pagination_info: {
            ...pI,
            total_items: 100, //?
            object_ids: objectIDs
        }
    };

    return { status: 200, body: responseObj };  
}


export function getMockedPageObjectIDs(pI) {
    // Sort by `feed_timestamp` (feed page)
    if (pI.order_by === "feed_timestamp") {
        if (pI.sort_order === "asc") throw Error("Sort by feed_timestamp asc not implemented")

        // Desc
        if (!pI.show_only_displayed_in_feed) throw Error("Sort by feed_timestamp desc without `show_only_displayed_in_feed` not implemented");

        // // Single page
        // if (pI.items_per_page === 100) return [100, 1100, 2100, 3100, 101, 1101, 2101, 3101];

        // No objects found
        if (pI.page > 10) return [];

        // Random multiple page
        return getIntegerList(100 + pI.items_per_page * (pI.page - 1), 100 + pI.items_per_page * pI.page - 1);
    }
    
    // Tags filter is not empty
    if (pI.tags_filter.length > 0) {
        if (pI.tags_filter.length === 1) return getIntegerList(5, 55, 5);
        if (pI.tags_filter.length === 2) return getIntegerList(15, 35, 5);
        return [];
    }

    // One or more object type is selected
    if (pI.object_types.length > 0) {
        let objectIDs = [];
        if (pI.object_types.includes("link")) objectIDs = objectIDs.concat(getIntegerList(11, 20));
        if (pI.object_types.includes("markdown")) objectIDs = objectIDs.concat(getIntegerList(1011, 1020));
        if (pI.object_types.includes("to_do_list")) objectIDs = objectIDs.concat(getIntegerList(2011, 2020));
        if (pI.object_types.includes("composite")) objectIDs = objectIDs.concat(getIntegerList(3011, 3020));
        return objectIDs;
    }
    // All object types are displayed
    else if (pI.object_types.length !== 1) {
        // Single page
        if (pI.items_per_page === 100) {
            return getIntegerList(1, 100);
        }

        // Sort by modified_at asc
        if (pI.order_by === "modified_at" && pI.sort_order === "asc") {
            return getIntegerList(41, 50);
        }

        // Sort by modified_at desc
        if (pI.order_by === "modified_at" && pI.sort_order === "desc") {
            return getIntegerList(50, 41);
        }
        // {"page":1,"items_per_page":10,"order_by":"object_name","sort_order":"desc","filter_text":""}
        // Sort by object_name desc
        if (pI.order_by === "object_name" && pI.sort_order === "desc") {
            return getIntegerList(99, 9, 10);
        }

        // Filtered text without match
        if (pI.filter_text === "no match") {
            return [];
        }

        // Filtered text
        if (pI.filter_text !== "" && pI.filter_text !== "no match") {
            return getIntegerList(2, 92, 10);
        }

        // Multiple pages
        return getIntegerList(pI.items_per_page * (pI.page - 1) + 1, pI.items_per_page * pI.page);
    }
};


function handleUpdateTags(body) {
    const parsedBody = JSON.parse(body);
    const addedTagIDs = (parsedBody.added_tags || []).map(tagID => typeof(tagID) === "number" ? tagID : autoGenerateTag({ tag_name: tagID }));  // autogenerate new tags for strings

    let responseObj = {
        tag_updates: {
            added_tag_ids: addedTagIDs,
            removed_tag_ids: parsedBody.removed_tag_ids || []
        },
        modified_at: (new Date(2001, 0, 1, 12, 30, 0)).toISOString()
    };
    return { status: 200, body: responseObj };
}


function handleObjectsSearch(body) {
    const { query_text, maximum_values, existing_ids } = JSON.parse(body).query;

    // Get id of the found object
    let objectID = 10000;
    while (existing_ids.indexOf(objectID) !== -1) objectID++;

    // Get object_type from object name
    let object_type = "link";
    for (let ot of ["markdown", "to_do_list", "composite"]) 
        if (query_text.toLowerCase().indexOf(ot) > -1) {
            object_type = ot;
            break;
        }

    // Generate object attributes & data and cache them
    const object = generateObjectAttributes(objectID, { object_name: query_text, object_type });
    const objectData = generateObjectData(objectID, object_type);

    // Cache object attributes & data
    _cachedObjects[objectID] = object;
    _cachedObjectData[objectID] = objectData;


    // Return object_id of the generated object
    const responseObj = { object_ids: [objectID] };
    return { status: 200, body: responseObj };
}


function handlerViewCompositeHierarchyElements(body) {
    const { object_id } = JSON.parse(body);
    return { status: 200, body: getMockCompositeHierarchyElements(object_id) };
}


export const objectsHandlersList = new Map([
    ["/objects/add", {"POST": handleAdd}],
    ["/objects/view", {"POST": handleView}],
    ["/objects/delete", {"DELETE": handleDelete}],
    ["/objects/update", {"PUT": handleUpdate}],
    ["/objects/get_page_object_ids", {"POST": handleGetPageObjectIDs}],
    ["/objects/update_tags", {"PUT": handleUpdateTags}],
    ["/objects/search", {"POST": handleObjectsSearch}],
    ["/objects/view_composite_hierarchy_elements", {"POST": handlerViewCompositeHierarchyElements}]
]);
