/**
 * Object generator class.
 */
export class ObjectGenerator {
    /**
     * Generates object attributes. Custom values for any attribute can be passed in the `customValues` argument.
     */
    attributes(customValues = {}) {
        let { object_id, object_type, object_name, object_description, created_at, modified_at, 
                is_published, display_in_feed, feed_timestamp, show_description, owner_id, current_tag_ids } = customValues;

        object_id = object_id === undefined ? 1 : object_id;

        if (!created_at) {
            created_at = object_id > 0 ? (new Date(Date.now() - 24*60*60*1000 - object_id)).toISOString() : "";
        }

        if (!modified_at) {
            modified_at = object_id > 0 ? (new Date(Date.now() - object_id)).toISOString() : "";
        }

        if (!feed_timestamp) {
            if (object_id < 0) feed_timestamp = "";
            else {
                const now = new Date();
                const date = new Date(now.getFullYear(), now.getMonth(), 1, /*0, Math.abs(object_id)*/);
                feed_timestamp = date.toISOString();
            }
        }
        
        return {
            object_id,
            object_type: object_type || "link",
            object_name: object_name || `object ${object_id}`,
            object_description: object_description || `object #${object_id} description`,
            
            created_at,
            modified_at,
            feed_timestamp,
            
            is_published: is_published || false,
            display_in_feed: display_in_feed || false,
            show_description: show_description || false,

            owner_id: owner_id || 1,

            current_tag_ids: current_tag_ids || [1, 2, 3, 4, 5]
        };
    }
    
    /**
     * Generates object data for the specified `object_id` and `object_type`.
     * 
     * Any overrides of default values can be passed in `object_data`
     * (including to-do list items & composite subobjects with partially defined values).
     */
    data(object_id, object_type, object_data) {
        if (object_type === "link") return this.linkData(object_id, object_data);
        else if (object_type === "markdown") return this.markdownData(object_id, object_data);
        else if (object_type === "to_do_list") return this.toDoListData(object_id, object_data);
        else if (object_type === "composite") return this.compositeData(object_data);
    }

    /**
     * Generates link object data for the object with the provided `object_id`.
     * 
     * Custom values for data attributes can be provided in the `customValues` argument.
     */
    linkData(object_id, customValues = {}) {
        let { link, show_description_as_link } = customValues;

        return {
            link: link || `https://website${object_id}.com`,
            show_description_as_link: show_description_as_link || false
        };
    }

    /**
     * Generates markdown object data for the object with the provided `object_id`.
     * 
     * Custom values for data attributes can be provided in the `customValues` argument.
     */
    markdownData(object_id, customValues = {}) {
        let { raw_text } = customValues;

        return {
            raw_text: raw_text || `# Markdown Object \\#${object_id}\n1. item 1;\n2. item 2;`
        };
    }

    /**
     * Generates to-do list object data for the object with the provided `object_id`.
     * 
     * Custom values for data attributes can be provided in the `customValues` argument.
     * 
     * If `items` is provided, each object from it will be passed to `toDoListDataItem` function as custom item values
     * (and the total number of items will be equal to the length of `items`).
     */
    toDoListData(object_id, customValues = {}) {
        let { sort_type, items } = customValues;

        if (items) items = items.map(item => this.toDoListDataItem(object_id, item));
        else {
            /* Default items:
            - 0
                - 1
                - 2
                    - 3
            - 4
            - 5
                - 6
                    - 7
            */
            items = [
                this.toDoListDataItem(object_id, { item_number: 0, item_state: "active",    indent: 0 }),
                this.toDoListDataItem(object_id, { item_number: 1, item_state: "optional",  indent: 1, commentary: "" }),
                this.toDoListDataItem(object_id, { item_number: 2, item_state: "completed", indent: 1, commentary: "" }),
                this.toDoListDataItem(object_id, { item_number: 3, item_state: "cancelled", indent: 2, commentary: "" }),
                this.toDoListDataItem(object_id, { item_number: 4, item_state: "active",    indent: 0 }),
                this.toDoListDataItem(object_id, { item_number: 5, item_state: "optional",  indent: 0, commentary: "" }),
                this.toDoListDataItem(object_id, { item_number: 6, item_state: "completed", indent: 1, commentary: "" }),
                this.toDoListDataItem(object_id, { item_number: 7, item_state: "cancelled", indent: 2, commentary: "" }),
            ];
        }

        return {
            sort_type: sort_type || "default",
            items
        };
    }

    /**
     * Generates a to-do list item for the object with the provided `object_id`.
     * 
     * Custom values for data attributes can be provided in the `customValues` argument.
     */
    toDoListDataItem(object_id, customValues = {}) {
        let { item_number, item_state, item_text, commentary, indent, is_expanded } = customValues;
        item_number = item_number === undefined ? 0 : item_number;

        return {
            item_number,
            item_state: item_state || "active",
            item_text: item_text || `object ${object_id} item ${item_number}`,
            commentary: commentary !== undefined ? commentary : `object ${object_id} comment ${item_number}`,
            indent: indent || 0,
            is_expanded: is_expanded !== undefined ? is_expanded : true
        };
    }

    /**
     * Generates composite object data.
     * 
     * Custom values for data attributes can be provided in the `customValues` argument.
     * 
     * If `subobjects` is provided, each object from it will be passed to `compositeDataSubobject` function as custom subobject values
     * (and the total number of subobjects will be equal to the length of `subobjects`).
     */
    compositeData({ subobjects, display_mode, numerate_chapters }) {
        if (subobjects) subobjects = subobjects.map(subobject => this.compositeDataSubobject(subobject));
        else subobjects = [this.compositeDataSubobject()];

        return {
            subobjects,
            display_mode: display_mode || "basic",
            numerate_chapters: numerate_chapters || false
        };
    }
    
    /**
     * Generates a composite subobject.
     * 
     * Custom values for data attributes can be provided in the `customValues` argument.
     * 
     * Note that `object_id` represents id of the subobject being generated.
     */
    compositeDataSubobject(customValues = {}) {
        let { object_id, column, row, selected_tab, is_expanded, show_description_composite, show_description_as_link_composite } = customValues;
        return {
            object_id: object_id || 101,
            column: column || 0,
            row: row || 0,
            selected_tab: selected_tab || 0,
            is_expanded: is_expanded !== undefined ? is_expanded : true,
            show_description_composite: show_description_composite || "inherit",
            show_description_as_link_composite: show_description_as_link_composite || "inherit"
        };
    }
}
