/*
    Functions for checking/getting data from a /tags/edit/:id page UI state.
*/


/**
 * Returns true if any of tag page fetches are being performed.
 */
export const isFetchingTag = state => state.tagsEditUI.tagsEditOnLoadFetch.isFetching || state.tagsEditUI.tagsEditOnSaveFetch.isFetching;


/**
 * Returns true if any of tag page fetches are being performed or a confirmation dialog is being displayed.
 */
export const isFetchinOrShowingDialogTag = state => isFetchingTag(state) || state.tagsEditUI.showDeleteDialog;
