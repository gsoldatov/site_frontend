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
