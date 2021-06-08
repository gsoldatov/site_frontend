/*
    Functions for checking/getting tags state.
*/


/**
 * Returns true if `tag.tag_name` value is already taken by another tag, which is present in the local storage.
 */
export const checkIfTagNameExists = (state, tag) => {
    const tags = state.tags;
    let loweredName = tag.tag_name.toLowerCase();

    for (let i in tags) {
        if (loweredName === tags[i].tag_name.toLowerCase() && state.tagUI.currentTag.tag_id !== tags[i].tag_id) return true;
    }
    return false;
};


/**
 * Returns the ID corresponding to the provided tag `name`.
 */
export const getTagIDByName = (state, name) => {
    const lowerCaseName = name.toLowerCase();
    for (let id of Object.keys(state.tags)) {
        if (state.tags[id].tag_name.toLowerCase() === lowerCaseName) return parseInt(id);
    }
};


/**
 * Returns lowercase `tag` if its type = string or `tag` otherwise.
 */
export const getLowerCaseTagNameOrID = tag => typeof(tag) === "string" ? tag.toLowerCase() : tag;
