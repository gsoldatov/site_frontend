function handleAdd(body) {
    const tag = JSON.parse(body).tag;
    const status = tag["tag_name"] === "existing tag_name" ? 400 : 200;
    const createdAt = new Date();
    const modifiedAt = new Date((new Date(createdAt)).setDate(createdAt.getDate() + 1));
    console.log(modifiedAt);
    const responseObj = tag["tag_name"] === "existing tag_name"
        ? {"_error": "Submitted tag name already exists."}
        : {tag: { tag_id: 1000, tag_name: tag["tag_name"], tag_description: tag["tag_description"], created_at: createdAt.toDateString(), modified_at: modifiedAt.toDateString() }};
    
    return {status: status, json: () => Promise.resolve(responseObj)};
}

export const tagsHandlersList = new Map([
    ["/tags/add", {"POST": handleAdd}]
]);
