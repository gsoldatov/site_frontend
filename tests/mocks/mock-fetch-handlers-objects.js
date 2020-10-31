function handleAdd(body) {
    const object = JSON.parse(body).object;
    // const status = object["object_name"] === "existing object_name" ? 400 : 200;
    const createdAt = new Date();
    const modifiedAt = new Date((new Date(createdAt)).setDate(createdAt.getDate() + 1));

    // existing object_name
    if (object["object_name"] === "existing object_name") {
        return {status: 400, json: () => Promise.resolve({_error: "Submitted object name already exists."})};
    }

    switch (object["object_type"]) {
        case "link":
            return {
                    status: 200, 
                    json: () => Promise.resolve({
                        object: { object_id: 1000, object_type: object["object_type"], object_name: object["object_name"], object_description: object["object_description"], 
                        created_at: createdAt.toDateString(), modified_at: modifiedAt.toDateString() 
                }})
            };
        default:
            throw new Exception("Received unexpected object_type in handleAdd");
    }
}

function handleView(body) {
    // Parse request and get object_ids and object_data_ids (filter)
    let object_ids = [];
    let object_data_ids = [];
    const bodyJSON = JSON.parse(body);

    if ("object_ids" in bodyJSON) {
        object_ids = bodyJSON["object_ids"].filter(id => id >= 0 && id <= 1000);
    }

    if ("object_data_ids" in bodyJSON) {
        object_data_ids = bodyJSON["object_data_ids"].filter(id => id >= 0 && id <= 1000);
    }
    
    // Return 404 response if both object_ids and object_data_ids do not "exist"
    if (object_ids.length === 0 && object_data_ids.length === 0) {
        return {status: 404, json: () => Promise.resolve({_error: "Objects not found."})};
    }

    // Set objects list
    let objects = object_ids.map(id => ({
        object_id: id,
        object_type: id <= 1000 ? "link" : "unknown",
        object_name: `object #${id}`,
        object_description: `object #${id} description`,
        created_at: (new Date(Date.now() - 24*60*60*1000)).toUTCString(),
        modified_at: (new Date()).toUTCString()
    }));
    
    // Set object_data list
    let object_data = object_data_ids.map(id => {
        // links
        if ((id) <= 1000) {
            return {object_id: id, object_type: "link", object_data: {"link": `https://website${id}.com`}};
        // default
        } else {
            return {object_id: id, object_type: "unknown", object_data: {}};
        }
    });

    // Return response
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
    if (object.object_name === "existing object name") {
        return {status: 400, json: () => Promise.resolve({_error: "Object name already exists."})}
    }

    // Assign object type
    const object_type = object.object_id <= 1000 ? "link" : "unknown";

    // Return response
    const responseObj = {object: {
        ...object,
        object_type: object_type,
        created_at: (new Date(Date.now() - 24*60*60*1000)).toUTCString(),
            modified_at: (new Date()).toUTCString()
    }};
    return {status: 200, json: () => Promise.resolve(responseObj)};
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
};

export const objectsHandlersList = new Map([
    ["/objects/add", {"POST": handleAdd}],
    ["/objects/view", {"POST": handleView}],
    ["/objects/delete", {"DELETE": handleDelete}],
    ["/objects/update", {"PUT": handleUpdate}],
    ["/objects/get_page_object_ids", {"POST": handleGetPageObjectIDs}]
]);
