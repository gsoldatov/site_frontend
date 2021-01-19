import { autoGenerateTag } from "./mock-fetch-handlers-tags";
import { getObjectTypeFromID } from "../test-utils";

let _cachedObjects = {};      // object & object data caches, which are used to pass object data from add/update to view handler
let _cachedObjectData = {};
export const resetObjectsCaches = () => { _cachedObjects = {}; _cachedObjectData = {} };


function handleAdd(body) {
    const object = JSON.parse(body).object;

    // Check object type
    if (!["link", "markdown"].includes(object["object_type"]))
        throw new Exception("Received unexpected object_type in handleAdd");

    // Handle existing object_name case
    if (object["object_name"] === "existing object_name")
        return {status: 400, json: () => Promise.resolve({_error: "Submitted object name already exists."})};

    // Set attributes of the new object
    const objectID = 1000;
    const createdAt = new Date();
    const modifiedAt = new Date((new Date(createdAt)).setDate(createdAt.getDate() + 1));
    const response = { object_id: objectID, object_type: object["object_type"], object_name: object["object_name"], object_description: object["object_description"], 
                        created_at: createdAt.toDateString(), modified_at: modifiedAt.toDateString() };

    // Set object's tags (autogenerate & cache tag_ids for provided tag names => add all tag_ids to the object)
    const tagUpdates = { added_tag_ids: [] };
    (object["added_tags"] || []).forEach(tagID => {
        if (typeof(tagID) === "number") tagUpdates.added_tag_ids.push(tagID);           // numeric tagIDs are considered existing and returned as is
        else tagUpdates.added_tag_ids.push(autoGenerateTag({ tag_name: tagID }));      // string tagIDs "autogenerate" & cache new tags which can later be obtained by tag view handler
    });
    response.tag_updates = tagUpdates;

    // Cache object attributes & data
    _cachedObjects[objectID] = response;
    _cachedObjectData[objectID] = object["object_data"];    

    // Send response
    return { status: 200, json: () => Promise.resolve({ object: response })};
}


function handleView(body) {
    // Parse request and get object_ids and object_data_ids (filter)
    let object_ids = [];
    let object_data_ids = [];
    const bodyJSON = JSON.parse(body);

    if ("object_ids" in bodyJSON)
        object_ids = bodyJSON["object_ids"].filter(id => (id >= 0 && id <= 2000) || _cachedObjects.hasOwnProperty(id));
    
    if ("object_data_ids" in bodyJSON)
        object_data_ids = bodyJSON["object_data_ids"].filter(id => (id >= 0 && id <= 2000) || _cachedObjectData.hasOwnProperty(id));
    
    // Return 404 response if both object_ids and object_data_ids do not "exist"
    if (object_ids.length === 0 && object_data_ids.length === 0)
        return {status: 404, json: () => Promise.resolve({_error: "Objects not found."})};

    // Set objects list
    let objects = object_ids.map(id => {
        if (_cachedObjects.hasOwnProperty(id)) {
            let object = _cachedObjects[id];
            object.current_tag_ids = object.tag_updates.added_tag_ids;      // fetching the object after it is updated requires a different logic for getting current_tag_ids
            delete object.tag_updates;                                      // (pre_tag_ids + added_tag_ids - removed_tag_ids)
            delete _cachedObjects[id];
            return object;
        }

        return {
            object_id: id,
            object_type: getObjectTypeFromID(id),
            object_name: `object #${id}`,
            object_description: `object #${id} description`,
            created_at: (new Date(Date.now() - 24*60*60*1000)).toUTCString(),
            modified_at: (new Date()).toUTCString(),
            current_tag_ids: [1, 2, 3, 4, 5]
        };
    });

    // Set object_data list
    let object_data = object_data_ids.map(id => {
        if (_cachedObjectData.hasOwnProperty(id)) {
            let data = _cachedObjectData[id];
            delete _cachedObjectData[id];
            return data;
        }

        // links
        if (id >= 0 && id <= 1000) return {object_id: id, object_type: "link", object_data: {link: `https://website${id}.com`}};
        // markdown
        else if (id >= 1001 && id <= 2000) return {object_id: id, object_type: "markdown", object_data: {raw_text: `# Markdown Object \\#${id}\n1. item 1;\n2. item 2;`}};
        // default
        else return {object_id: id, object_type: "unknown", object_data: {}};
    });

    // Send response
    return {status: 200, json: () => Promise.resolve({objects: objects, object_data: object_data})};
}


function handleDelete(body) {
    const object_ids = JSON.parse(body).object_ids.filter(id => id >= 0 && id <= 1000);
    const status = object_ids.length > 0 ? 200 : 404;    
    const responseObj = object_ids.length > 0
        ? { object_ids: object_ids }
        : {_error: "Objects not found."};
    
    return {status: status, json: () => Promise.resolve(responseObj)};
}


function handleUpdate(body) {
    const object = JSON.parse(body).object;

    // Handle existing name case
    if (object.object_name === "existing object name")
        return { status: 400, json: () => Promise.resolve({_error: "Object name already exists."}) };
    
    // Set object's tags (autogenerate & cache tag_ids for provided tag names => add all tag_ids to the object)
    const tagUpdates = { added_tag_ids: [], removed_tag_ids: object.removed_tag_ids };
    (object["added_tags"] || []).forEach(tagID => {
        if (typeof(tagID) === "number") tagUpdates.added_tag_ids.push(tagID);     // numeric tagIDs are considered existing and returned as is
        else tagUpdates.added_tag_ids.push(autoGenerateTag({ tag_name: tagID }));      // string tagIDs "autogenerate" & cache new tags which can later be obtained by tag view handler
    });
    
    // Set and send response
    const responseObj = { object: {
        ...object,
        object_type: getObjectTypeFromID(object.object_id),
        created_at: (new Date(Date.now() - 24*60*60*1000)).toUTCString(),
        modified_at: (new Date()).toUTCString(),
        tag_updates: tagUpdates
    }};
    return { status: 200, json: () => Promise.resolve(responseObj) };
}


function handleGetPageObjectIDs(body) {
    const pI = JSON.parse(body).pagination_info;
    const objectIDs = getMockedPageObjectIDs(pI);
    if (objectIDs.length === 0) {
        return {status: 404, json: () => Promise.resolve({_error: "No objects found."})};
    }

    const responseObj = {
        page: pI.page,
        items_per_page: pI.items_per_page,
        total_items: 100, //?
        order_by: pI.order_by,
        sort_order: pI.sort_order,
        filter_text: pI.filter_text,
        object_ids: objectIDs
    };
    return {status: 200, json: () => Promise.resolve(responseObj)};  
}


export function getMockedPageObjectIDs(pI) {
    function getList(f, t, s = 1){
        let a = [];
        if (f < t) {
            for (let i = f; i <= t; i += s) {
                a.push(i);
            }   
        } else {
            for (let i = f; i >= t; i += s) {
                a.push(i);
            }
        }
        return a;
    }
    
    // Tags filter is not empty
    if (pI.tags_filter.length > 0) {
        if (pI.tags_filter.length === 1) return getList(5, 55, 5);
        if (pI.tags_filter.length === 2) return getList(15, 35, 5);
        return [];
    }

    // Not all object types are displayed
    if (pI.object_types.length == 1) {
        // Link object type
        if (pI.object_types.includes("link")) {
            return getList(6, 46, 2);
        }

        // Markdown object type
        if (pI.object_types.includes("markdown")) {
            return getList(1006, 1046, 2);
        }
    }
    // All object types are displayed
    else if (pI.object_types.length == 0 || pI.object_types.length == 2) {
        // Single page
        if (pI.items_per_page === 100) {
            return getList(1, 100);
        }

        // Sort by modified_at asc
        if (pI.order_by === "modified_at" && pI.sort_order === "asc") {
            return getList(41, 50);
        }

        // Sort by modified_at desc
        if (pI.order_by === "modified_at" && pI.sort_order === "desc") {
            return getList(50, 41, -1);
        }
        // {"page":1,"items_per_page":10,"order_by":"object_name","sort_order":"desc","filter_text":""}
        // Sort by object_name desc
        if (pI.order_by === "object_name" && pI.sort_order === "desc") {
            return getList(99, 9, -10);
        }

        // Filtered text without match
        if (pI.filter_text === "no match") {
            return [];
        }

        // Filtered text
        if (pI.filter_text !== "" && pI.filter_text !== "no match") {
            return getList(2, 92, 10);
        }

        // Multiple pages
        return getList(pI.items_per_page * (pI.page - 1) + 1, pI.items_per_page * pI.page);
    }
};


function handleUpdateTags(body) {
    const parsedBody = JSON.parse(body);
    const objectIDs = parsedBody.object_ids;
    const addedTagIDs = (parsedBody.added_tags || []).map(tagID => typeof(tagID) === "number" ? tagID : autoGenerateTag({ tag_name: tagID }));  // autogenerate new tags for strings

    let responseObj = {
        tag_updates: {
            added_tag_ids: addedTagIDs,
            removed_tag_ids: parsedBody.removed_tag_ids || []
        },
        modified_at: (new Date(2001, 0, 1, 12, 30, 0)).toISOString()
    };
    return { status: 200, json: () => Promise.resolve(responseObj) };
}


export const objectsHandlersList = new Map([
    ["/objects/add", {"POST": handleAdd}],
    ["/objects/view", {"POST": handleView}],
    ["/objects/delete", {"DELETE": handleDelete}],
    ["/objects/update", {"PUT": handleUpdate}],
    ["/objects/get_page_object_ids", {"POST": handleGetPageObjectIDs}],
    ["/objects/update_tags", {"PUT": handleUpdateTags}]
]);
