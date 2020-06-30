/*
    Utility functions for checking current state
*/

/* ********************************************************** */
/*                          TAG PAGE                          */
/* ********************************************************** */

/* Returns true if any of tag page fetches are being performed. */
export function isFetchingTag(state) {
    return state.tagUI.addTagOnSaveFetch.isFetching || state.tagUI.editTagOnLoadFetch.isFetching || 
        state.tagUI.editTagOnSaveFetch.isFetching || state.tagUI.editTagOnDeleteFetch.isFetching;
};

/* Returns true if any of tag page fetches are being performed or a confirmation dialog is being displayed. */
export function isFetchinOrShowingDialogTag(state) {
    return isFetchingTag(state) || state.tagUI.showDeleteDialog;
}

/* Returns true if currentTag's tag_name is already taken by another tag, which is present in the local storage. */
export function checkIfCurrentTagNameExists(state) {
    let tags = state.tags;
    let currentTagNameLowered = state.tagUI.currentTag.tag_name.toLowerCase();

    for (let i in tags) {
        if (currentTagNameLowered === tags[i].tag_name.toLowerCase() && state.tagUI.currentTag.tag_id !== tags[i].tag_id) {
            return true;
        }
    }

    return false;
};


/* *********************************************************** */
/*                          TAGS PAGE                          */
/* *********************************************************** */
/* Returns true if any of tags page fetches are being performed. */
export function isFetchingTags(state) {
    return state.tagsUI.paginationFetch.isFetching || state.tagsUI.onDeleteFetch.isFetching;
};

/* Returns true if any of tags page fetches are being performed or a confirmation dialog is being displayed. */
export function isFetchinOrShowingDialogTags(state) {
    return isFetchingTags(state) || state.tagsUI.showDeleteDialog;
}