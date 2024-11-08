export const DELETE_TAGS = "DELETE_TAGS";


/** [Reducer file](../reducers/data-tags.js) */
export const deleteTags = tag_ids => ({ type: DELETE_TAGS, tag_ids: tag_ids });
