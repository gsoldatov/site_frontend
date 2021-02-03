/*
    Functions for checking/getting data from a /objects/:id page UI state.
*/


// Returns true if any of object page fetches are being performed.
export const isFetchingObject = state => state.objectUI.objectOnLoadFetch.isFetching || state.objectUI.objectOnSaveFetch.isFetching;


// Returns true if any of object page fetches are being performed or a confirmation dialog is being displayed.
export const isFetchinOrShowingDialogObject = state => isFetchingObject(state) || state.objectUI.showDeleteDialog;
