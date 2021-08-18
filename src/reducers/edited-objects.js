import { LOAD_EDITED_OBJECTS_PAGE, TOGGLE_EDITED_OBJECT_SELECTION, TOGGLE_ALL_OBJECTS_SELECTION } from "../actions/edited-objects";


function loadEditedObjectsPage(state, action) {
    return {
        ...state,
        editedObjectsUI: {
            ...state.editedObjectsUI,
            selectedObjectIDs: new Set()
        }
    };
}


function toggleEditedObjectSelection(state, action) {
    const { objectID } = action;
    let newSelectedObjectIDs = new Set(state.editedObjectsUI.selectedObjectIDs);
    if (newSelectedObjectIDs.has(objectID))
        newSelectedObjectIDs.delete(objectID);
    else
        newSelectedObjectIDs.add(objectID);
    
    return {
        ...state,
        editedObjectsUI: {
            ...state.editedObjectsUI,
            selectedObjectIDs: newSelectedObjectIDs
        }
    };
}


function toggleAllObjectsSelection(state, action) {
    const editedObjectIDs = Object.keys(state.editedObjects);
    const newSelectedObjectIDs = state.editedObjectsUI.selectedObjectIDs.size < editedObjectIDs.length ? new Set(editedObjectIDs) : new Set();
    
    return {
        ...state,
        editedObjectsUI: {
            ...state.editedObjectsUI,
            selectedObjectIDs: newSelectedObjectIDs
        }
    };
}


const root = {
    LOAD_EDITED_OBJECTS_PAGE: loadEditedObjectsPage,
    TOGGLE_EDITED_OBJECT_SELECTION: toggleEditedObjectSelection,
    TOGGLE_ALL_OBJECTS_SELECTION: toggleAllObjectsSelection
};

export default root;