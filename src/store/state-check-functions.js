/*
    Utility functions for checking current state
*/

export function isFetchingTag(state) {
    return state.tagUI.addTagOnSaveFetch.isFetching || state.tagUI.editTagOnLoadFetch.isFetching || 
        state.tagUI.editTagOnSaveFetch.isFetching || state.tagUI.editTagOnDeleteFetch.isFetching;
};

export function checkIfCurrentTagNameExists(state) {
    let tags = state.tags;
    let currentTagNameLowered = state.tagUI.currentTag.tag_name.toLowerCase();

    for (let i in tags) {
        if (currentTagNameLowered === tags[i].tag_name.toLowerCase()) {
            return true;
        }
    }

    return false;
};