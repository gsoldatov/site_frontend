/**
 * Validates a single non-composite edited object `obj` and returns true if its valid.
 * 
 * 
 * // TODO move to edited objects selectors?
 * // TODO replace with zod validation? throw the first zod validation error upstream
 */
export const validateNonCompositeObject = obj => {
    // Object name
    if (obj.object_name.length === 0) throw Error("Object name is required.");

    // Feed timestamp
    if (obj.feed_timestamp.length > 0) {
        let feedTimestampAsDate = new Date(obj.feed_timestamp);
        if (isNaN(feedTimestampAsDate.getTime())) throw Error("Incorrect feed timestamp format.");
    }

    // Object data
    switch (obj.object_type) {
        case "link":
            if (obj.link.link.length === 0) throw Error("Link value is required.");
            break;
        case "markdown":
            if (obj.markdown.raw_text.length === 0) throw Error("Markdown text is required.");
            break;
        case "to_do_list":
            if (Object.keys(obj.toDoList.items).length === 0) throw Error("At least one item is required in the to-do list.");
            break;
        default:
            throw Error(`validateNonCompositeObject received an unexpected object type "${obj.object_type}" when validating object ${obj.object_id}`);
    }

    return true;
};
