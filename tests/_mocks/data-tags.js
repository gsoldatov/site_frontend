/**
 * Returns an object with default or provided tag attributes.
 */
export const getTag = ({ tag_id, tag_name, tag_description, is_published = true, created_at, modified_at }) => {
    if (tag_id === undefined) throw new Exception("`tag_id` is required.");

    if (tag_name === undefined) tag_name = `tag #${tag_id}`;
    if (tag_description === undefined) tag_description = `tag #${tag_id} description`;
    if (created_at === undefined) created_at = (new Date(Date.now() - 24*60*60*1000)).toISOString();
    if (modified_at === undefined) modified_at = (new Date()).toISOString();

    return { tag_id, tag_name, tag_description, is_published, created_at, modified_at };
};
