/*
    Functions for checking/getting objects state.
*/


// Returns true if currentObject's object_name is already taken by another object, which is present in the local storage.
export const checkIfCurrentObjectNameExists = state => {
    let objects = state.objects;
    let currentObjectNameLowered = state.objectUI.currentObject.object_name.toLowerCase();

    for (let i in objects) {
        if (currentObjectNameLowered === objects[i].object_name.toLowerCase() && state.objectUI.currentObject.object_id !== objects[i].object_id) {
            return true;
        }
    }

    return false;
};


// Returns true is current object's data is valid or throws an error if not.
export const validateCurrentObject = state => {
    const obj = state.objectUI.currentObject;
    
    if (obj.object_name.length === 0) throw Error("Object name is required.");
    if (checkIfCurrentObjectNameExists(state)) throw Error("Object name already exists.");

    switch (obj.object_type) {
        case "link":
            if(obj.link.length === 0) throw Error("Link value is required.");
            break;
        case "markdown":
            if(obj.markdown.raw_text.length === 0) throw Error("Markdown text is required.");
            break;
        default:
            break;
    }

    return true;
};


// Returns current object's object data in a format required by backed API.
export const getCurrentObjectData = state => {
    // Function must return a copy of the object if its data is mutable;
    // This will prevent potential inconsistency in local storage due to user inputs during the add fetch.
    const currentObject = state.objectUI.currentObject;
    switch (currentObject.object_type) {
        case "link":
            return { "link": currentObject.link };
        case "markdown":
            return { "raw_text": currentObject.markdown.raw_text };
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
        default:
            return undefined;
    }
};
