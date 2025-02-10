export type ObjectType = "link" | "markdown" | "to_do_list" | "composite";

export interface ObjectAttributes {
    object_id: number,
    object_type: ObjectType,
    object_name: string,
    object_description: string,
    created_at: string,
    modified_at: string,
    is_published: boolean,
    display_in_feed: boolean,
    feed_timestamp: string | null,
    show_description: boolean,
    owner_id: number,
    current_tag_ids: number[]
};

export interface ObjectAttributesWithType<T extends ObjectType> extends Omit<ObjectAttributes, "object_type"> {
    object_type: T
}

export interface LinkData { link: string,  show_description_as_link: boolean };
interface PartialLinkData extends Partial<LinkData> {};

interface MarkdownData { raw_text: string };
interface PartialMarkdownData extends Partial<MarkdownData> {};

interface ToDoListItemData {
    item_number: number,
    item_state: "active" | "optional" | "completed" | "cancelled",
    item_text: string,
    commentary: string, 
    indent: number,
    is_expanded: boolean
};
interface PartialToDoListItemData extends Partial<ToDoListItemData> {};

interface ToDoListData {
    sort_type: "default" | "state",
    items: ToDoListItemData[]
};

/**
 * To-do list data with `items` allowed to contain some, but not all of theirs properties.
 */
interface PartialToDoListData extends Omit<Partial<ToDoListData>, "items"> { items?: PartialToDoListItemData[] };

export interface CompositeSubobjectData {
    subobject_id: number,
    column: number,
    row: number,
    selected_tab: number,
    is_expanded: boolean,
    show_description_composite: "yes" | "no" | "inherit",
    show_description_as_link_composite: "yes" | "no" | "inherit"
}
export interface PartialCompositeSubobjectData extends Partial<CompositeSubobjectData> {};

interface CompositeData {
    subobjects: CompositeSubobjectData[],
    display_mode: "basic" | "grouped_links" | "multicolumn" | "chapters",
    numerate_chapters: boolean
}

/**
 * Composite data with `subobjects` allowed to contain some, but not all of theirs properties.
 */
interface PartialCompositeData extends Omit<Partial<CompositeData>, "subobjects"> { subobjects?: PartialCompositeSubobjectData[] };

/**
 * Type, which maps object types to their partial object data interfaces.
 */
export type PartialObjectData<T> =
    T extends "link"? PartialLinkData:
    T extends "markdown"? PartialMarkdownData:
    T extends "to_do_list"? PartialToDoListData:
    T extends "composite"? PartialCompositeData:
    never
;

export type PartialObjectDataUnion = PartialLinkData | PartialMarkdownData | PartialToDoListData | PartialCompositeData;

/**
 * Type, which maps object types to their object data interfaces.
 */
export type ObjectData<T> =
    T extends "link"? LinkData:
    T extends "markdown"? MarkdownData:
    T extends "to_do_list"? ToDoListData:
    T extends "composite"? CompositeData:
    never
;

export type ObjectDataUnion = LinkData | MarkdownData | ToDoListData | CompositeData;


/**
 * Object generator class.
 */
export class ObjectGenerator {
    /**
     * Generates object attributes. Custom values for any attribute can be passed in the `customValues` argument.
     */
    attributes(customValues?: Partial<ObjectAttributes>): ObjectAttributes {
        let { object_id, object_type, object_name, object_description, created_at, modified_at, 
                is_published, display_in_feed, feed_timestamp, show_description, owner_id, current_tag_ids } = customValues || {};

        object_id = object_id === undefined ? 1 : object_id;

        if (created_at === undefined) {
            created_at = object_id > 0 ? (new Date(Date.now() - 24*60*60*1000 - object_id)).toISOString() : "";
        }

        if (modified_at === undefined) {
            modified_at = object_id > 0 ? (new Date(Date.now() - object_id)).toISOString() : "";
        }

        if (feed_timestamp  === undefined) {
            if (object_id < 0) feed_timestamp = null;
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
    data<T extends ObjectType>(object_id: number, object_type: T, object_data?: PartialObjectData<T>): ObjectData<T> {
        // NOTE: `object_data` props are correctly narrowed by `object_type` value outside of function, when using currently implemented typing with generics;
        // however, additional type assertions are required:
        // 1) for `object_data` is required when calling object type specific data generation function;
        // 2) when returns data generation function's results.
        if (object_type === "link") return this.linkData(object_id, object_data as PartialLinkData) as ObjectData<T>;
        else if (object_type === "markdown") return this.markdownData(object_id, object_data as PartialMarkdownData) as ObjectData<T>;
        else if (object_type === "to_do_list") return this.toDoListData(object_id, object_data as PartialToDoListData) as ObjectData<T>;
        else if (object_type === "composite") return this.compositeData(object_data as PartialCompositeData) as ObjectData<T>;
        else throw Error(`Incorrect object type: '${object_type}'`);
    }

    /**
     * Generates link object data for the object with the provided `object_id`.
     * 
     * Custom values for data attributes can be provided in the `customValues` argument.
     */
    linkData(object_id: number, customValues?: PartialLinkData): LinkData {
        let { link, show_description_as_link } = customValues || {};

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
    markdownData(object_id: number, customValues?: PartialMarkdownData): MarkdownData {
        let { raw_text } = customValues || {};

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
    toDoListData(object_id: number, customValues?: PartialToDoListData): ToDoListData {
        let { sort_type, items } = customValues || {};
        let _items: ToDoListItemData[];

        if (items) _items = items.map(item => this.toDoListDataItem(object_id, item));
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
            _items = [
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
            items: _items
        };
    }

    /**
     * Generates a to-do list item for the object with the provided `object_id`.
     * 
     * Custom values for data attributes can be provided in the `customValues` argument.
     */
    toDoListDataItem(object_id: number, customValues?: PartialToDoListItemData): ToDoListItemData {
        let { item_number, item_state, item_text, commentary, indent, is_expanded } = customValues || {};
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
    compositeData(customValues?: PartialCompositeData): CompositeData {
        const { subobjects, display_mode, numerate_chapters } = customValues || {};
        let _subobjects: CompositeSubobjectData[];
        if (subobjects) _subobjects = subobjects.map(subobject => this.compositeDataSubobject(subobject));
        else _subobjects = [this.compositeDataSubobject()];

        return {
            subobjects: _subobjects,
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
    compositeDataSubobject(customValues?: PartialCompositeSubobjectData): CompositeSubobjectData {
        let { subobject_id, column, row, selected_tab, is_expanded, show_description_composite, show_description_as_link_composite } = customValues || {};
        return {
            subobject_id: subobject_id || 101,
            column: column || 0,
            row: row || 0,
            selected_tab: selected_tab || 0,
            is_expanded: is_expanded !== undefined ? is_expanded : true,
            show_description_composite: show_description_composite || "inherit",
            show_description_as_link_composite: show_description_as_link_composite || "inherit"
        };
    }
}
