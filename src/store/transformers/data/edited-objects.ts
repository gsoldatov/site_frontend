import { type ZodError } from "zod";

import type { EditedObject } from "../../../types/store/data/edited-objects";

import { SubobjectDeleteMode } from "../../../types/store/data/composite";
import { type ObjectsBulkUpsertObjectData } from "../../../types/fetches/data/objects/bulk_upsert";


export class EditedObjectsTransformers {
    /**
     * Adds attributes to the `editedObject`, which are required in the /objects/bulk_upsert route format.
     * 
     * Does not perform validation & remove excess attributes.
     */
    static toObjectsBulkUpsertBody(editedObject: EditedObject) {
        return {
            ...editedObject,
            added_tags: editedObject.addedTags,
            removed_tag_ids: editedObject.removedTagIDs,
            object_data: editedObjectDataToBulkUpsertRequest(editedObject)
        };
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


/**
 * Processes validation errors during /objects/bulk_upsert request body serialization
 * into a string error message.
 * 
 * Current implementation tries to map the first occured error to a corresponding error message,
 * or returns the first error as is.
 */
export const parseObjectsBulkUpsertZodValidationErrors = (error: ZodError, editedObjects: EditedObject[], currentObjectID: number): string => {
    const firstIssue = error.issues[0];

    if (firstIssue.path[0] === "objects") {
        const editedObject = editedObjects[firstIssue.path[1] as number];
        const objectInfo = editedObject.object_id === currentObjectID ? ""
            : ` (object "${editedObject.object_name}" (${editedObject.object_id}))`;     // info about object, where error occured, if it's not current
        let message;

        // object_name
        if (firstIssue.path[2] === "object_name" && firstIssue.code === "too_small") 
            message = "Object name is required.";
        else if (firstIssue.path[2] === "object_name" && firstIssue.code === "too_big") 
            message = "Object name can't be longer than 255 chars.";

        // link data
        else if (firstIssue.path[2] === "object_data" && firstIssue.path[3] === "link" && firstIssue.message === "Invalid url")
             message = "Valid URL is required.";

        // markdown data
        else if (firstIssue.path[2] === "object_data" && firstIssue.path[3] === "raw_text" && firstIssue.code === "too_small") 
            message = "Markdown text is required.";

        // to-do list data
        else if (firstIssue.path[2] === "object_data" && firstIssue.path[3] === "items" && firstIssue.code === "too_small") 
            message = "At least one item is required in the to-do list.";

        else message = JSON.stringify(firstIssue);

        return `${message}${objectInfo}`;
    }
    
    return error.toString();
};
