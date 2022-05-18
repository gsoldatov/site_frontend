function handleSearch(body) {
    const query = JSON.parse(body).query;

    // 404 case
    if (query.query_text  === "non-existing") 
        return { status: 404, body: { _error: "Nothing was found." } };
    
    // 200 case
    const responseBody = {
        ...query,
        items: [
            { item_id: 1, item_type: "tag" }, 
            { item_id: 2, item_type: "tag" },
            { item_id: 10, item_type: "object" },
            { item_id: 20, item_type: "object" }
        ],
        total_items: 4
    }
    return { status: 200, body: responseBody };
}


export const searchHandlersList = new Map([
    ["/search", {"POST": handleSearch}]
]);
