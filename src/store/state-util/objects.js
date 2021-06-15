import { deepCopy } from "../../util/copy";
import { deepEqual } from "../../util/equality-checks";
import { enumDeleteModes } from "../state-templates/composite-subobjects";
import { getSubobjectDisplayOrder } from "./composite";
/*
    Functions for checking/getting objects state.
*/


/**
 *  Returns true if object_name of `obj` is already taken by another object, which is present in the local storage, or false otherwise.
 */
export const checkIfObjectNameExists = (state, obj) => {
    const objects = state.objects;
    const loweredName = obj.object_name.toLowerCase();

    for (let i in objects) {
        if (loweredName === objects[i].object_name.toLowerCase() && obj.object_id !== objects[i].object_id) {
            return true;
        }
    }

    return false;
};


/**
 * Returns true is state of an edited object `obj` is valid or throws an error if not.
 */
export const validateObject = (state, obj) => {
    switch (obj.object_type) {
        case "composite":
            if (obj.object_name.length === 0) throw Error("Object name is required.");

            // Check if at least one non-deleted subobject exists
            let hasNonDeletedSubobjects = false;
            for (let subobjectID of Object.keys(obj.composite.subobjects))
                if (obj.composite.subobjects[subobjectID].deleteMode === enumDeleteModes.none) {
                    hasNonDeletedSubobjects = true;
                    break;
                }
            
            if (!hasNonDeletedSubobjects) throw Error("Composite object must have at least one non-deleted subobject.");
            
            // Recursively check non-composite non-deleted subobjects
            for (let subobjectID of Object.keys(obj.composite.subobjects)) {
                const subobject = state.editedObjects[subobjectID];
                if (subobject !== undefined && subobject.object_type !== "composite" && obj.composite.subobjects[subobjectID].deleteMode === enumDeleteModes.none) 
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
 */
export const validateNonCompositeObject = obj => {
    if (obj.object_name.length === 0) throw Error("Object name is required.");

    switch (obj.object_type) {
        case "link":
            if (obj.link.length === 0) throw Error("Link value is required.");
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
 * Returns `obj` object data serialized into a format required by backed API.
 */
export const serializeObjectData = (state, obj) => {
    // Function must return a copy of the object if its data is mutable;
    // This will prevent potential inconsistency in local storage due to user inputs during the add fetch.
    switch (obj.object_type) {
        case "link":
            return { link: obj.link };
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
                if (obj.composite.subobjects[subobjectID].deleteMode === enumDeleteModes.none) {
                    nonDeletedSubobjects[subobjectID] = deepCopy(obj.composite.subobjects[subobjectID]);
                }
            }
            
            // Adjust non-deleted objects' positions
            const nonDeletedSubobjectsOrder = getSubobjectDisplayOrder({ subobjects: nonDeletedSubobjects }, true);
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
                for (let attr of ["row", "column", "selected_tab"])
                    subobject[attr] = so[attr];

                // Add subobjects' attributes & data changes
                const eso = state.editedObjects[subobjectID];

                if (eso !== undefined) {
                    if (
                        eso.object_type !== "composite"
                        && (
                            object_id < 0
                            || (object_id > 0 && !objectHasNoChanges(state, object_id))
                        )
                    ) {
                        // Attributes
                        for (let attr of ["object_name", "object_description", "object_type"])
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
                if (object_id > 0 && deleteMode !== enumDeleteModes.none)
                    deleted_subobjects.push({ object_id, is_full_delete: deleteMode === enumDeleteModes.full });
            }

            // Return serialized composite object data
            return { subobjects, deleted_subobjects };
        default:
            return null;
    }
};


/**
 * Returns object data from `state` storage for the provided `objectID`.
 * 
 * If `formatAsEditedObjectProps` is true, returns a deep copy of data formatted to be inserted into an edited object,
 * otherwise returns the reference to the original object in the storage.
 * 
 * If object data or attributes (object type is required) are not present, returns `undefined`.
 */
export const getObjectDataFromStore = (state, objectID, formatAsEditedObjectProps) => {
    if (!objectDataIsInState(state, objectID)) return undefined;

    const objectType = state.objects[objectID].object_type;
    switch (objectType) {
        case "link":
            return formatAsEditedObjectProps
                ? { ...state.links[objectID] }
                : state.links[objectID];
        case "markdown":
            return formatAsEditedObjectProps
                ? (state.markdown[objectID] ? { markdown: { raw_text: state.markdown[objectID].raw_text, parsed: "" }} : undefined)
                : state.markdown[objectID];
        case "to_do_list":
            return formatAsEditedObjectProps
                ? { toDoList: deepCopy(state.toDoLists[objectID]) }
                : state.toDoLists[objectID];
        case "composite":
            return formatAsEditedObjectProps
                ? { composite: deepCopy(state.composite[objectID]) }
                : state.composite[objectID];
        default:
            return undefined;
    }
};


/**
 * Returns true if object data for the provided `objectID` exists in `state` or false otherwise.
 */
export const objectDataIsInState = (state, objectID) => {
    if (!state.objects[objectID]) return false;
    const objectType = state.objects[objectID].object_type;

    switch (objectType) {
        case "link":
            return objectID in state.links;
        case "markdown":
            return objectID in state.markdown;
        case "to_do_list":
            return objectID in state.toDoLists;
        case "composite":
            return objectID in state.composite;
        default:
            return false;
    }
};


/**
 * Modifies object_data in add/update object fetches to prepare it for adding to the respective storage with addObjectData action.
 * `requestPayload` is the body of the request sent to backend.
 * `responseObject` is the `object` attribute of the JSON parsed from response body.
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


/**
 * Returns true if state of the object with provided `objectID` in state.editedObjects has no changes compared to its last saved state.
 * 
 * If object is not present in any of the storages (state.editedObjects, state.objects, state.objectsTags, data storages), also returns true.
 */
 export const objectHasNoChanges = (state, objectID) => {
    // If objectID is not present in edited objects, return true to avoid copying edited objects
    if (!state.editedObjects.hasOwnProperty(objectID)) return true;

    // If saved object attributes, tags or data are missing, return true to avoid deleting existing changes of a non-cached object
    if (!state.objects.hasOwnProperty(objectID) || !state.objectsTags.hasOwnProperty(objectID) || !objectDataIsInState(state, objectID)) 
        return true;
    
    const object = state.objects[objectID], objectTags = state.objectsTags[objectID], objectData = getObjectDataFromStore(state, objectID),
        editedObject = state.editedObjects[objectID];
    
    // Check object attributes
    if (objectAttributesAreModified(object, editedObject)) return false;

    // Check object tags
    if (objectTagsAreModified(objectTags, editedObject)) return false;

    // Check object data
    if (objectDataIsModified(objectData, editedObject)) return false;

    // No changes were made
    return true;
};


/**
 * Accepts saved object attributes `object` and edited object state `editedObject`.
 * 
 * Returns true if object attributes in `editedObjects` are different than in `object`.
 * 
 * If `object` or `editedObject` are undefined, returns false.
 */
export const objectAttributesAreModified = (object, editedObject) => {
    if (object === undefined || editedObject === undefined) return false;

    for (let key of Object.keys(object))
        if (!deepEqual(object[key], editedObject[key])) return true;
    
    return false;
};


/**
 * Accepts saved object tags `objectTags` and an edited object state `editedObject`.
 * 
 * Returns true if object tags in `editedObject` are modified.
 * 
 * If object is not present in state.editedObjects, returns false.
 */
export const objectTagsAreModified = (objectTags, editedObject) => {
    if (editedObject === undefined) return false;

    return editedObject.addedTags.length > 0 || editedObject.removedTagIDs.length > 0 || 
        (editedObject.object_id > 0 && !deepEqual(editedObject.currentTagIDs, objectTags));  // don't compare currentTagIDs for new objects
};


/**
 * Accepts saved in a storage object data `objectData` and an edited object state `editedObject`.
 * 
 * Returns true if object data `editedObject` is modified.
 * 
 * If `objectData` or `editedObject` are undefined, returns false.
 * 
 * If object is not present in state.editedObjects or corresponding data storage, returns false.
 */
export const objectDataIsModified = (objectData, editedObject) => {
    if (objectData === undefined || editedObject === undefined) return false;

    switch(editedObject.object_type) {
        case "link":
            return objectData.link !== editedObject.link;
        case "markdown":
            return objectData.raw_text !== editedObject.markdown.raw_text;
        case "to_do_list":
            return !deepEqual(objectData, editedObject.toDoList);
        case "composite":
            return !deepEqual(objectData, editedObject.composite);
        default:
            throw Error(`objectDataIsModified received an unexpected object type ${editedObject.object_type} when checking object ${editedObject.objectID}`);
    }
};
