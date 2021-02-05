/*
    Functions for checking/getting data from a /objects/:id page UI state.
*/


// Returns true if any of object page fetches are being performed.
export const isFetchingObject = state => state.objectUI.objectOnLoadFetch.isFetching || state.objectUI.objectOnSaveFetch.isFetching;


// Returns true if any of object page fetches are being performed or a confirmation dialog is being displayed.
export const isFetchinOrShowingDialogObject = state => isFetchingObject(state) || state.objectUI.showDeleteDialog;


// Returns true if to-do list items can be dragged and dropped over each other
export const isTDLDragAndDropEnabled = state => !isFetchingObject(state) && state.objectUI.currentObject.toDoList.sort_type === "default";
