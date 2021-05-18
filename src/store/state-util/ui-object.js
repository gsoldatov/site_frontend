import { getDefaultEditedObjectState } from "../../reducers/helpers/object";


/*
    Functions for checking/getting data from a /objects/:id page UI state.
*/


// Returns the currentObjectID data from state.editedObjects 
// (`getDefaultEditedObjectState` called by default to allow first render of the object page for objects not present in state.editedObjects,
// as well as rendering 
// a workaround for the first case is to reimplement <Layout> as a class component and invoke on load effects in constructor (before first render).
// Another option is to refactor all selectors dependant on the `getCurrentObject` function to use default value when the function returns `undefined`.
export const getCurrentObject = state => state.editedObjects[state.objectUI.currentObjectID] || getDefaultEditedObjectState();


// Returns a selector for the object data from state.editedObjects for the provided `objectID` or default edited object state.
export const getEditedOrDefaultObjectSelector = objectID => state => state.editedObjects[objectID] || getDefaultEditedObjectState();


// Returns true if any of object page fetches are being performed.
export const isFetchingObject = state => state.objectUI.objectOnLoadFetch.isFetching || state.objectUI.objectOnSaveFetch.isFetching;


// // Returns true if any of object page fetches are being performed or a confirmation dialog is being displayed.
// export const isFetchingOrShowingDeleteDialogObject = state => isFetchingObject(state) || state.objectUI.showDeleteDialog;


// Returns true if any of object page fetches are being performed or on load fetch failed
export const isFetchingOrOnLoadFetchFailed = state => isFetchingObject(state) || state.objectUI.objectOnLoadFetch.fetchError;


// Returns a selector for checking if to-do list drag and drop functionality is enabled
export const getIsTDLDragAndDropEnabledSelector = objectID => state => !isFetchingObject(state) && state.editedObjects[objectID].toDoList.sort_type === "default";
