/*
    Functions for checking/getting data from a /tags/list page UI state.
*/


/**
 * Returns true if any of tags page fetches are being performed.
 */
export const isFetchingTags = state => state.tagsUI.fetch.isFetching;


/**
 * Returns true if any of tags page fetches are being performed or a confirmation dialog is being displayed.
 */
export const isFetchinOrShowingDialogTags = state => isFetchingTags(state) || state.tagsUI.showDeleteDialog;
