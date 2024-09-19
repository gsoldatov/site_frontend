/**
 * Stores custom values for tags generated by backend.
 */
export class TagsCache {
    constructor() {
        this.cache = {};
    }

    /**
     * Returns custom values stored for the specified `tag_id` or an empty object
     */
    get(tag_id) {
        return this.cache[tag_id] || {};
    }

    /**
     * Adds or updates tag custom values for the specified `tag_id`.
     * 
     * `tag_id` is always added to the attributes of the tag.
     */
    update(tag_id, tag) {
        if (tag_id === undefined) throw Error("tag_id is required.");
        
        if (!(tag_id in this.cache)) this.cache[tag_id] = {};
        this.cache[tag_id] = { ...this.cache[tag_id], ...tag, tag_id };
    }

    /**
     * Replaces tag custom value for the specified `tag_id`.
     * 
     * `tag_id` is always added to the attributes of the tag.
     */
    replace(tag_id, tag) {
        if (tag_id === undefined) throw Error("tag_id is required.");
        this.cache[tag_id] = { ...tag, tag_id };
    }
}