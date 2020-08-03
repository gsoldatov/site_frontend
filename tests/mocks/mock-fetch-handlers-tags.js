function handleAdd(body) {
    const tag = JSON.parse(body).tag;
    const status = tag["tag_name"] === "existing tag_name" ? 400 : 200;
    const createdAt = new Date();
    const modifiedAt = new Date((new Date(createdAt)).setDate(createdAt.getDate() + 1));
    const responseObj = tag["tag_name"] === "existing tag_name"
        ? {_error: "Submitted tag name already exists."}
        : {tag: { tag_id: 1000, tag_name: tag["tag_name"], tag_description: tag["tag_description"], created_at: createdAt.toDateString(), modified_at: modifiedAt.toDateString() }};
    
    return {status: status, json: () => Promise.resolve(responseObj)};
}

function handleView(body) {
    const tag_ids = JSON.parse(body).tag_ids.filter(id => id >= 0 && id <= 1000);
    const status = tag_ids.length > 0 ? 200 : 404;    
    const responseObj = tag_ids.length > 0
        ? {
            tags: tag_ids.map(id => ({ 
            tag_id: id,
            tag_name: `tag #${id}`,
            tag_description: `tag #${id} description`,
            created_at: (new Date(Date.now() - 24*60*60*1000)).toUTCString(),
            modified_at: (new Date()).toUTCString()
            }))
        }
        : {_error: "Tags not found."};
    
    return {status: status, json: () => Promise.resolve(responseObj)};
}

function handleDelete(body) {
    const tag_ids = JSON.parse(body).tag_ids.filter(id => id >= 0 && id <= 1000);
    const status = tag_ids.length > 0 ? 200 : 404;    
    const responseObj = tag_ids.length > 0
        ? { tag_ids: tag_ids }
        : {_error: "Tags not found."};
    
    return {status: status, json: () => Promise.resolve(responseObj)};
}

function handleUpdate(body) {
    const tag = JSON.parse(body).tag;
    const status = tag.tag_name !== "existing tag name" ? 200 : 400;
    const responseObj = tag.tag_name !== "existing tag name"
        ? { tag: {
            ...tag,
            created_at: (new Date(Date.now() - 24*60*60*1000)).toUTCString(), // created_at is not passed via fetch, so a random value is returned instead
            modified_at: (new Date()).toUTCString()
        }}
        : {_error: "Tag name already exists."};
    return {status: status, json: () => Promise.resolve(responseObj)};
}

export const tagsHandlersList = new Map([
    ["/tags/add", {"POST": handleAdd}],
    ["/tags/view", {"POST": handleView}],
    ["/tags/delete", {"DELETE": handleDelete}],
    ["/tags/update", {"PUT": handleUpdate}]
]);
