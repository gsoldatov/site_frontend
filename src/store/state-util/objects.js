import { getItemsCopy } from "./to-do-lists";
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
        default:
            break;
    }

    return true;
};


// Returns `obj` object data serialized into a format required by backed API.
export const serializeObjectData = obj => {
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
        default:
            return null;
    }
};


// Returns a new object with object data for the provided object_id or undefined.
export const getObjectDataFromStore = (state, object_id) => {
    if (!state.objects[object_id]) return undefined;
    const objectType = state.objects[object_id].object_type;
    switch (objectType) {
        case "link":
            if (!state.links[object_id]) return undefined;
            return { ...state.links[object_id] };
        case "markdown":
            if (!state.markdown[object_id]) return undefined;
            return state.markdown[object_id] ? { markdown: { raw_text: state.markdown[object_id].raw_text, parsed: "" }} : undefined;
        case "to_do_list":
            if (!state.toDoLists[object_id]) return undefined;
            return { toDoList: {
                ...state.toDoLists[object_id],
                items: getItemsCopy(state.toDoLists[object_id])
            }};
        default:
            return undefined;
    }
};
