/*
    Functions for checking/getting data from a /tags/:id page UI state.
*/


// Returns true if any of tag page fetches are being performed.
export const isFetchingTag = state => state.tagUI.tagOnLoadFetch.isFetching || state.tagUI.tagOnSaveFetch.isFetching;


// Returns true if any of tag page fetches are being performed or a confirmation dialog is being displayed.
export const isFetchinOrShowingDialogTag = state => isFetchingTag(state) || state.tagUI.showDeleteDialog;
