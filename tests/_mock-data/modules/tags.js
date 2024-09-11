/**
 * Tag generator class.
 */
export class TagGenerator {
    /**
     * Generates tag attributes. Custom values for any attribute can be passed in the `customValues` argument.
     */
    tag(customValues = {}) {
        let { tag_id, tag_name, tag_description, created_at, modified_at, is_published } = customValues;
        
        tag_id = tag_id === undefined ? 1 : tag_id;
        
        if (!created_at) {
            created_at = tag_id > 0 ? (new Date(Date.now() - 24*60*60*1000 - tag_id)).toISOString() : "";
        }

        if (!modified_at) {
            modified_at = tag_id > 0 ? (new Date(Date.now() - tag_id)).toISOString() : "";
        }

        return {
            tag_id,
            tag_name: tag_name || `tag ${tag_id} name`,
            tag_description: tag_description || `tag ${tag_description} description`,
            created_at,
            modified_at,
            is_published: is_published !== undefined ? is_published : true
        };
    }
}
