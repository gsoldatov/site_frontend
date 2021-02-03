/*
    Functions for checking/getting tags state.
*/


// Returns true if currentTag's tag_name is already taken by another tag, which is present in the local storage.
export const checkIfCurrentTagNameExists = state => {
    let tags = state.tags;
    let currentTagNameLowered = state.tagUI.currentTag.tag_name.toLowerCase();

    for (let i in tags) {
        if (currentTagNameLowered === tags[i].tag_name.toLowerCase() && state.tagUI.currentTag.tag_id !== tags[i].tag_id) {
            return true;
        }
    }

    return false;
};


// Returns the ID corresponding to the provided tag name.
export const getTagIDByName = (state, name) => {
    for (let id of Object.keys(state.tags)) {
        if (state.tags[id].tag_name.toLowerCase() === name.toLowerCase()) return parseInt(id);
    }
};
