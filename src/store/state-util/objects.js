import { deepCopy } from "../../util/copy";
import { objectHasNoChanges } from "../../util/equality-checks";
import { enumDeleteModes } from "../state-templates/composite-subobjects";
import { getSubobjectDisplayOrder } from "./composite";
/*
    Functions for checking/getting objects state.
*/


// Returns true if object_name of `obj` is already taken by another object, which is present in the local storage, or false otherwise.
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


// Returns true is `obj` data is valid or throws an error if not.
export const validateObject = (state, obj) => {
    if (obj.object_name.length === 0) throw Error("Object name is required.");
    // if (checkIfObjectNameExists(state, obj)) throw Error("Object name already exists.");

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
        case "composite":
            // Check if at least one non-deleted subobject exists
            let hasNonDeletedSubobjects = false;
            for (let subobjectID of Object.keys(obj.composite.subobjects))
                if (obj.composite.subobjects[subobjectID].deleteMode === enumDeleteModes.none) {
                    hasNonDeletedSubobjects = true;
                    break;
                }
            
            if (!hasNonDeletedSubobjects) throw Error("Composite object must have at least one non-deleted subobject.");
            
            // Recursively check non-composite subobjects
            for (let subobjectID of Object.keys(obj.composite.subobjects)) {
                const subobject = state.editedObjects[subobjectID];
                if (subobject.object_type !== "composite") validateObject(state, subobject);
            }

            if (Object.keys(obj.composite.subobjects).length === 0) throw Error("At least one item is required in the to-do list.");
        default:
            break;
    }

    return true;
};


// Returns `obj` object data serialized into a format required by backed API.
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
            const nonDeletedSubobjectsOrder = getSubobjectDisplayOrder({ subobjects: nonDeletedSubobjects });
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


// Returns a new object with object data for the provided object_id or undefined.
export const getObjectDataFromStore = (state, object_id) => {
    if (!objectDataIsInState(state, object_id)) return undefined;

    const objectType = state.objects[object_id].object_type;
    switch (objectType) {
        case "link":
            return { ...state.links[object_id] };
        case "markdown":
            return state.markdown[object_id] ? { markdown: { raw_text: state.markdown[object_id].raw_text, parsed: "" }} : undefined;
        case "to_do_list":
            return { toDoList: {
                ...state.toDoLists[object_id],
                items: deepCopy(state.toDoLists[object_id].items)
            }};
        case "composite":
            return { composite: deepCopy(state.composite[object_id]) };
        default:
            return undefined;
    }
};


// Returns true if object data for the provided `object_id` exists in state or false otherwise.
export const objectDataIsInState = (state, object_id) => {
    if (!state.objects[object_id]) return false;
    const objectType = state.objects[object_id].object_type;

    switch (objectType) {
        case "link":
            return object_id in state.links;
        case "markdown":
            return object_id in state.markdown;
        case "to_do_list":
            return object_id in state.toDoLists;
        case "composite":
            return object_id in state.composite;
        default:
            return false;
    }
};


// Modifies object_data in add/update object fetches to prepare it for adding to the respective storage with addObjectData action.
// `requestPayload` is the body of the request sent to backend.
// `responseObject` is the `object` attribute of the JSON parsed from response body.
export const modifyObjectDataPostSave = (requestPayload, responseObject) => {
    const { object_type } = requestPayload.object;
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
