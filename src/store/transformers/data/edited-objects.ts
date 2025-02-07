import { type ZodError } from "zod";

import { deepCopy } from "../../../util/copy";

import { EditedObjectsSelectors } from "../../selectors/data/objects/edited-objects";
import { CompositeSelectors } from "../../selectors/data/objects/composite";

import type { State } from "../../../types/store/state";
import type { EditedObject } from "../../../types/store/data/edited-objects";

import { type Composite, SubobjectDeleteMode } from "../../../types/store/data/composite";
import { objectsAddRequestBodyObject } from "../../../types/fetches/data/objects/add";
import { 
    objectsUpdateCompositeSubobject, type ObjectsUpdateObjectData,
    type ObjectsUpdateCompositeSubobjects, type ObjectsUpdateCompositeDeletedSubobjects,    
    objectsUpdateRequestBodyObject
} from "../../../types/fetches/data/objects/update";


export class EditedObjectsTransformers {
    /**
     * Validates and converts `editedObject` into /objects/add backed request body.
     * 
     * Throws if zod validation fails.
     */
    static toObjectsAddBody(state: State, editedObject: EditedObject) {
        return objectsAddRequestBodyObject.parse({
            ...editedObject,

            added_tags: editedObject.addedTags,

            object_data: editedObjectDataToBackend(state, editedObject)
        });
    }

    /**
     * Validates and converts `editedObject` into /objects/add backed request body.
     * 
     * Throws if zod validation fails.
     */
    static toObjectsUpdateBody(state: State, editedObject: EditedObject) {
        return objectsUpdateRequestBodyObject.parse({
            ...editedObject,

            added_tags: editedObject.addedTags,
            removed_tag_ids: editedObject.removedTagIDs,

            object_data: editedObjectDataToBackend(state, editedObject)
        });
    }
}


/**
 * Returns `obj` object data serialized into a format required by backed API.
 * 
 * Serializes object data from `editedObject` into /objects/add & /objects/update backend fetch format
 * (`object_data` request body prop).
 */
const editedObjectDataToBackend = (state: State, editedObject: EditedObject): ObjectsUpdateObjectData => {
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
            // Get non-deleted subobjects
            let nonDeletedSubobjects: Composite["subobjects"] = {};
            for (let subobjectID of Object.keys(editedObject.composite.subobjects).map(id => parseInt(id))) {
                if (editedObject.composite.subobjects[subobjectID].deleteMode === SubobjectDeleteMode.none) {
                    // Make a subobject copy, which will be modified below
                    nonDeletedSubobjects[subobjectID] = deepCopy(editedObject.composite.subobjects[subobjectID]);
                }
            }
            
            // Adjust non-deleted objects' positions
            const nonDeletedSubobjectsOrder = CompositeSelectors.getSubobjectDisplayOrder({ subobjects: nonDeletedSubobjects }, true);
            for (let column of nonDeletedSubobjectsOrder) {
                for (let i = 0; i < column.length; i++) {
                    const subobjectID = column[i];
                    nonDeletedSubobjects[subobjectID].row = i;
                }
            }

            // Prepare "subobjects" array
            let subobjects: ObjectsUpdateCompositeSubobjects = [];
            for (let subobjectID of Object.keys(nonDeletedSubobjects).map(id => parseInt(id))) {
                // Add state of subobject in the composite object
                const so = nonDeletedSubobjects[subobjectID];
                let subobject: any = { ...so, subobject_id: subobjectID };
                for (let key of ["fetchError", "deleteMode"]) delete subobject[key];    // delete frontend-only subobject props

                // Add subobjects' attributes & data changes
                const eso = state.editedObjects[subobjectID];

                if (eso !== undefined) {
                    if (
                        eso.object_type !== "composite"
                        && (
                            subobjectID < 0
                            || (subobjectID > 0 && EditedObjectsSelectors.isModifiedExisting(state, subobjectID))
                        )
                    ) {
                        // Attributes
                        subobject = { ...subobject, ...eso };
                        delete subobject["object_id"];
                        
                        // Data
                        subobject.object_data = editedObjectDataToBackend(state, eso);
                    }
                }

                subobjects.push(objectsUpdateCompositeSubobject.parse(subobject));
            }
            
            // Prepare "deleted_subobjects" array (set full delete prop)
            let deleted_subobjects: ObjectsUpdateCompositeDeletedSubobjects = [];

            for (let subobjectID of Object.keys(editedObject.composite.subobjects).map(id => parseInt(id))) {
                const deleteMode = editedObject.composite.subobjects[subobjectID].deleteMode;
                if (subobjectID > 0 && deleteMode !== SubobjectDeleteMode.none)
                    deleted_subobjects.push({ object_id: subobjectID, is_full_delete: deleteMode === SubobjectDeleteMode.full });
            }

            // Return serialized composite object data
            return { 
                subobjects,
                deleted_subobjects,
                display_mode: editedObject.composite.display_mode,
                numerate_chapters: editedObject.composite.numerate_chapters
            };
        default:
            throw Error(`Incorrect object_type '${editedObject.object_type}'`);
    }
};


/** 
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
