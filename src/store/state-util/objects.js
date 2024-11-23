import { deepCopy } from "../../util/copy";
import { EditedObjectsSelectors } from "../selectors/data/objects/edited-objects";
import { CompositeSelectors } from "../selectors/data/objects/composite";

import { SubobjectDeleteMode } from "../types/data/composite";
import { serializedCompositeObjectDataProps } from "../state-templates/composite-subobjects";
import { compositeSubobjectObjectAttributes, addedObjectAttributes, updatedObjectAttributes } from "../state-templates/edited-object";

/*
    Functions for checking/getting objects state.
*/


/**
 * Returns true is state of an edited object `obj` is valid or throws an error if not.
 * 
 * TODO replace with zod validation & return first validation error occured
 */
export const validateObject = (state, obj) => {
    switch (obj.object_type) {
        case "composite":
            if (obj.object_name.length === 0) throw Error("Object name is required.");

            // Check if at least one non-deleted subobject exists
            let hasNonDeletedSubobjects = false;
            for (let subobjectID of Object.keys(obj.composite.subobjects))
                if (obj.composite.subobjects[subobjectID].deleteMode === SubobjectDeleteMode.none) {
                    hasNonDeletedSubobjects = true;
                    break;
                }
            
            if (!hasNonDeletedSubobjects) throw Error("Composite object must have at least one non-deleted subobject.");
            
            // Recursively check non-composite non-deleted subobjects
            for (let subobjectID of Object.keys(obj.composite.subobjects)) {
                const subobject = state.editedObjects[subobjectID];
                if (subobject !== undefined && subobject.object_type !== "composite" && obj.composite.subobjects[subobjectID].deleteMode === SubobjectDeleteMode.none) 
                    validateNonCompositeObject(subobject);
            }

            break;
        default:
            validateNonCompositeObject(obj);
            break;
    }

    return true;
};


/**
 * Validates a single non-composite edited object `obj` and returns true if its valid.
 * 
 * 
 * // TODO move to edited objects selectors?
 * // TODO replace with zod validation? throw the first zod validation error upstream
 */
export const validateNonCompositeObject = obj => {
    // Object name
    if (obj.object_name.length === 0) throw Error("Object name is required.");

    // Feed timestamp
    if (obj.feed_timestamp.length > 0) {
        let feedTimestampAsDate = new Date(obj.feed_timestamp);
        if (isNaN(feedTimestampAsDate.getTime())) throw Error("Incorrect feed timestamp format.");
    }

    // Object data
    switch (obj.object_type) {
        case "link":
            if (obj.link.link.length === 0) throw Error("Link value is required.");
            break;
        case "markdown":
            if (obj.markdown.raw_text.length === 0) throw Error("Markdown text is required.");
            break;
        case "to_do_list":
            if (Object.keys(obj.toDoList.items).length === 0) throw Error("At least one item is required in the to-do list.");
            break;
        default:
            throw Error(`validateNonCompositeObject received an unexpected object type "${obj.object_type}" when validating object ${obj.object_id}`);
    }

    return true;
};


/**
 * Accepts an edited object `obj` and returns an object with its attributes and tags serialized for /objects/add fetch.
 * 
 * TODO replace with zod validation
 */
export const serializeObjectAttributesAndTagsForAddFetch = obj => {
    let result = { added_tags: obj.addedTags };
    for (let attr of addedObjectAttributes) {
        if (attr === "feed_timestamp") 
            result[attr] = obj[attr].length > 0 ? (new Date(obj[attr])).toISOString() : obj[attr];
        else result[attr] = obj[attr];
    }

    return result;
};


/**
 * Accepts an edited object `obj` and returns an object with its attributes and tags serialized for /objects/update fetch.
 * 
 * TODO replace with zod validation
 */
 export const serializeObjectAttributesAndTagsForUpdateFetch = obj => {
    let result = { added_tags: obj.addedTags, removed_tag_ids: obj.removedTagIDs };
    for (let attr of updatedObjectAttributes) {
        if (attr === "feed_timestamp")
            result[attr] = obj[attr].length > 0 ? (new Date(obj[attr])).toISOString() : obj[attr];
        else result[attr] = obj[attr];
    }

    return result;
};


/**
 * Returns `obj` object data serialized into a format required by backed API.
 * 
 * TODO replace with zod validation
 */
export const serializeObjectData = (state, obj) => {
    // Function must return a copy of the object if its data is mutable;
    // This will prevent potential inconsistency in local storage due to user inputs during the add fetch.
    switch (obj.object_type) {
        case "link":
            return deepCopy(obj.link);
        case "markdown":
            return { raw_text: obj.markdown.raw_text };
        case "to_do_list":
            return {
                sort_type: obj.toDoList.sort_type,
                items: obj.toDoList.itemOrder.map((id, index) => ({ item_number: index, ...obj.toDoList.items[id] }))
            };
        case "composite":
            // Get non-deleted subobjects
            let nonDeletedSubobjects = {};
            for (let subobjectID of Object.keys(obj.composite.subobjects)) {
                if (obj.composite.subobjects[subobjectID].deleteMode === SubobjectDeleteMode.none) {
                    nonDeletedSubobjects[subobjectID] = deepCopy(obj.composite.subobjects[subobjectID]);
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
            let subobjects = [];
            for (let subobjectID of Object.keys(nonDeletedSubobjects)) {
                // Add state of subobject in the composite object
                const so = nonDeletedSubobjects[subobjectID];
                const object_id = parseInt(subobjectID);
                const subobject = { object_id };
                for (let attr of serializedCompositeObjectDataProps)
                    subobject[attr] = so[attr];

                // Add subobjects' attributes & data changes
                const eso = state.editedObjects[subobjectID];

                if (eso !== undefined) {
                    if (
                        eso.object_type !== "composite"
                        && (
                            object_id < 0
                            || (object_id > 0 && EditedObjectsSelectors.isModifiedExisting(state, object_id))
                        )
                    ) {
                        // Attributes
                        for (let attr of compositeSubobjectObjectAttributes)
                            subobject[attr] = eso[attr];
                        
                        // Data
                        subobject["object_data"] = serializeObjectData(state, eso);
                    }
                }

                subobjects.push(subobject);
            }
            
            // Prepare "deleted_subobjects" array (set full delete prop)
            let deleted_subobjects = [];

            for (let subobjectID of Object.keys(obj.composite.subobjects)) {
                const object_id = parseInt(subobjectID);
                const deleteMode = obj.composite.subobjects[subobjectID].deleteMode;
                if (object_id > 0 && deleteMode !== SubobjectDeleteMode.none)
                    deleted_subobjects.push({ object_id, is_full_delete: deleteMode === SubobjectDeleteMode.full });
            }

            // Return serialized composite object data
            return { subobjects, deleted_subobjects, display_mode: obj.composite.display_mode, numerate_chapters: obj.composite.numerate_chapters };
        default:
            return null;
    }
};


/**
 * Modifies object_data in add/update object fetches to prepare it for adding to the respective storage with addObjectsData action.
 * `requestPayload` is the body of the request sent to backend.
 * `responseObject` is the `object` attribute of the JSON parsed from response body.
 * 
 * TODO implement via fetch response types or util functions?
 * TODO implement via response -> store transformers?
 */
export const modifyObjectDataPostSave = (requestPayload, responseObject) => {
    const { object_type } = responseObject;
    const request_object_data = requestPayload.object.object_data;
    
    switch (object_type) {
        // Map IDs of the new subobjects to their new values
        case "composite":
            const IDMapping = responseObject.object_data.id_mapping;
            return {
                ...request_object_data,
                subobjects: request_object_data.subobjects.map(so => {
                    const object_id = IDMapping[so.object_id] !== undefined ? IDMapping[so.object_id] : so.object_id;
                    return { ...so, object_id };
                })
            };
        default:
            return request_object_data;
    }
};
