import { z } from "zod";

import { object } from "./objects";
import { nameString, positiveInt, positiveIntArray, int, timestampOrEmptyString, nonNegativeInt, intIndex } from "../../../util/types/common";
import { link, getLink } from "./links";
import { markdown, getMarkdown } from "./markdown";
import { toDoList, getToDoList } from "./to-do-list";
import { composite, getComposite } from "./composite";


/** A single edited object's schema. */
export const editedObject = object.extend({
    // Defined attributes with other types
    object_id: int,
    created_at: timestampOrEmptyString,
    modified_at: timestampOrEmptyString,
    object_name: z.string(),
    owner_id: nonNegativeInt,

    // Additional attributes
    currentTagIDs: positiveIntArray,
    addedTags: positiveInt.or(nameString).array(),
    removedTagIDs: positiveIntArray,

    // Object data
    link,
    markdown,
    toDoList,
    composite
});


/** Edited objects' store schema. */
export const editedObjects = z.record(intIndex, editedObject);

/** 
 * Returns an edited object with optional `customValues` replacing the defaults.
 * @param {customValues: Partial<EditedObject>} - custom values for attributes, tags & data of the returned object.
 */
export const getEditedObjectState = (customValues: Partial<EditedObject> = {}) => editedObject.parse({
    // Attributes
    object_id: -1,
    object_type: "link",
    object_name: "",
    object_description: "",
    created_at: "",
    modified_at: "",
    is_published: false,
    display_in_feed: true,
    feed_timestamp: "",
    show_description: true,
    owner_id: 0,

    // Object's tags
    currentTagIDs: [],   
    addedTags: [],
    removedTagIDs: [],

    // Data
    link: getLink(),
    markdown: getMarkdown(),
    toDoList: getToDoList(),
    composite: getComposite(),

    // Overriden values
    ...customValues
});


/** A single edited object's type. */
export type EditedObject = z.infer<typeof editedObject>;
/** Edited objects' store type. */
export type EditedObjects = z.infer<typeof editedObjects>;

/** Edited objects' type part containing link data. */
type EditedObjectLinkPart = Pick<EditedObject, "link">;
/** Edited objects' type part containing markdown data. */
type EditedObjectMarkdownPart = Pick<EditedObject, "markdown">;
/** Edited objects' type part containing to-do list data. */
type EditedObjectToDoListPart = Pick<EditedObject, "toDoList">;
/** Edited objects' type part containing composite data. */
type EditedObjectCompositePart = Pick<EditedObject, "composite">;
/** Type for one of data parts of an edited object. */
export type EditedObjectDataPart = EditedObjectLinkPart | EditedObjectMarkdownPart | EditedObjectToDoListPart | EditedObjectCompositePart;
