import { type ZodError } from "zod";

import type { EditedObject } from "../../../types/store/data/edited-objects";

import { SubobjectDeleteMode } from "../../../types/store/data/composite";
import { objectsBulkUpsertObject, type ObjectsBulkUpsertObjectData } from "../../../types/fetches/data/objects/bulk_upsert";


export class EditedObjectsTransformers {
    /**
     * Validates and converts `editedObject` into a /objects/bulk_upsert route format.
     * 
     * Throws if zod validation fails. 
     */
    static toObjectsBulkUpsertBody(editedObject: EditedObject) {
        return objectsBulkUpsertObject.parse({
            ...editedObject,
            added_tags: editedObject.addedTags,
            removed_tag_ids: editedObject.removedTagIDs,
            object_data: editedObjectDataToBulkUpsertRequest(editedObject)
        });
    }
}


const editedObjectDataToBulkUpsertRequest = (editedObject: EditedObject): ObjectsBulkUpsertObjectData => {
    switch (editedObject.object_type) {
        case "link":
            return editedObject.link;
        case "markdown":
            return { raw_text: editedObject.markdown.raw_text };
        case "to_do_list":
            return {
                sort_type: editedObject.toDoList.sort_type,
                items: editedObject.toDoList.itemOrder.map((id, index) => ({ item_number: index, ...editedObject.toDoList.items[id] }))
            };
        case "composite":
            const subobjects = [];
            for (let subobject_id of Object.keys(editedObject.composite.subobjects).map(id => parseInt(id))) {
                const so = editedObject.composite.subobjects[subobject_id];
                if (so.deleteMode === SubobjectDeleteMode.none) {
                    const serializedSubobject = { subobject_id, ...so };
                    for (let key of ["fetchError", "deleteMode"]) delete (serializedSubobject as Record<any, any>)[key];    // delete frontend-only subobject props
                    subobjects.push(serializedSubobject);
                }
            }
            return {
                subobjects,
                display_mode: editedObject.composite.display_mode,
                numerate_chapters: editedObject.composite.numerate_chapters,
            };
        default:
            throw Error(`Incorrect object_type '${editedObject.object_type}'`);
    }
};


/**  TODO remove when bulk upsert validation is implemented
 * Processes zod validation errors during the transformation of an edited object
 * into a /objects/add or /objects/update request body into a string error message.
 */
export const parseObjectsUpdateRequestValidationErrors = (error: ZodError): string => {
    // Parse the first issue & display it
    // NOTE: subobject validation errors have the same paths, as those which occur in main object
    const msg = error.issues[0];

    // object_name
    if (msg.path[0] === "object_name" && msg.code === "too_small") return "Object name is required.";
    if (msg.path[0] === "object_name" && msg.code === "too_big") return "Object name can't be longer than 255 chars.";

    // link data
    if (msg.path[0] === "object_data" && msg.path[1] === "link" && msg.message === "Invalid url") return "Valid URL is required.";

    // markdown data
    if (msg.path[0] === "object_data" && msg.path[1] === "raw_text" && msg.code === "too_small") return "Markdown text is required.";

    // to-do list data
    if (msg.path[0] === "object_data" && msg.path[1] === "items" && msg.code === "too_small") return "At least one item is required in the to-do list.";

    // composite data (subobjects with attributes are handled by the checks above)
    if (msg.path[0] === "object_data" && msg.path[1] === "subobjects" && msg.code === "too_small") return "Composite object must have at least one non-deleted subobject.";
    
    return error.toString();
};
