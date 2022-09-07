import { getIntegerList } from "../_util/data-generation";

let _cachedTags = {};     // tag cache, which used to pass tag data to the handleView function; passed data is removed from the cache once it's been used by handleView
let _cachedTagID = -1;
export const resetTagsCache = () => { _cachedTags = {}; _cachedTagID = -1 };


// Generates a tag object with provided name and description and stores in _cachedTags; returns the id of the autogenerated tag
export const autoGenerateTag = ({ tag_name, tag_description }) => {
    if (!tag_name) throw new Exception("autoGenerateTag received an empty tag name");
    const tagID = _cachedTagID--;
    const createdAt = new Date();
    const modifiedAt = new Date((new Date(createdAt)).setDate(createdAt.getDate() + 1));
    const tag = {
        tag_id: tagID,
        created_at: createdAt,
        modified_at: modifiedAt,
        tag_name: tag_name,
        tag_description: tag_description || ""
    };

    _cachedTags[tagID] = tag;
    return tagID;
};


function handleAdd(body) {
    const tag = JSON.parse(body).tag;
    const status = tag["tag_name"] === "existing tag_name" ? 400 : 200;
    const createdAt = new Date();
    const modifiedAt = new Date((new Date(createdAt)).setDate(createdAt.getDate() + 1));
    const responseObj = tag["tag_name"] === "existing tag_name"
        ? {_error: "Submitted tag name already exists."}
        : {tag: { tag_id: 1000, tag_name: tag["tag_name"], tag_description: tag["tag_description"], created_at: createdAt.toISOString(), modified_at: modifiedAt.toISOString() }};
    
    return { status: status, body: responseObj };
}


function handleView(body) {
    const tag_ids = JSON.parse(body).tag_ids.filter(id => (id >= 0 && id <= 1000) || _cachedTags.hasOwnProperty(id));
    const status = tag_ids.length > 0 ? 200 : 404;
    const responseObj = tag_ids.length > 0
        ? {
            tags: tag_ids.map(id => {
                if (_cachedTags.hasOwnProperty(id)) {
                    let tag = _cachedTags[id];
                    delete _cachedTags[id];
                    return tag;
                }

                return {
                    tag_id: id,
                    tag_name: `tag #${id}`,
                    tag_description: `tag #${id} description`,
                    created_at: (new Date(Date.now() - 24*60*60*1000)).toUTCString(),
                    modified_at: (new Date()).toUTCString()
                };
            })
        }
        : { _error: "Tags not found." };
    
    return { status: status, body: responseObj };
}


function handleDelete(body) {
    const tag_ids = JSON.parse(body).tag_ids.filter(id => id >= 0 && id <= 1000);
    const status = tag_ids.length > 0 ? 200 : 404;    
    const responseObj = tag_ids.length > 0
        ? { tag_ids: tag_ids }
        : {_error: "Tags not found."};
    
    return { status: status, body: responseObj };
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
    return { status: status, body: responseObj };
}


function handleGetPageTagIDs(body) {
    const pI = JSON.parse(body).pagination_info;
    const tagIDs = getMockedPageTagIDs(pI);
    if (tagIDs.length === 0) {
        return { status: 404, body: { _error: "No tags found." }};
    }

    const responseObj = {
        page: pI.page,
        items_per_page: pI.items_per_page,
        total_items: 100, //?
        order_by: pI.order_by,
        sort_order: pI.sort_order,
        filter_text: pI.filter_text,
        tag_ids: tagIDs
    };
    return { status: 200, body: responseObj };
}


export function getMockedPageTagIDs(pI) {
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
    // {"page":1,"items_per_page":10,"order_by":"tag_name","sort_order":"desc","filter_text":""}
    // Sort by tag_name desc
    if (pI.order_by === "tag_name" && pI.sort_order === "desc") {
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
};


function handleTagsSearch(body) {
    // Handle not found case
    const query = JSON.parse(body).query;
    if (query.query_text === "not found") return { status: 404, body: { _error: "Tags not found." }};

    // Handle success case
    const maximumValues = query.maximum_values || 10;
    const existingIds = query.existing_ids || [];
    const tagIDs = [];
    let id = 1;
    while (tagIDs.length < maximumValues) {
        if (!existingIds.includes(id)) tagIDs.push(id);
        id++;
    }
    return { status: 200, body: { "tag_ids": tagIDs }};
}

export const tagsHandlersList = new Map([
    ["/tags/add", {"POST": handleAdd}],
    ["/tags/view", {"POST": handleView}],
    ["/tags/delete", {"DELETE": handleDelete}],
    ["/tags/update", {"PUT": handleUpdate}],
    ["/tags/get_page_tag_ids", {"POST": handleGetPageTagIDs}],
    ["/tags/search", {"POST": handleTagsSearch}]
]);
