import { LOAD_OBJECTS_EDITED_PAGE, TOGGLE_OBJECTS_EDITED_SELECTION, TOGGLE_OBJECTS_EDITED_SELECT_ALL } from "../actions/objects-edited";


function loadObjectsEditedPage(state, action) {
    return {
        ...state,
        objectsEditedUI: {
            ...state.objectsEditedUI,
            selectedObjectIDs: new Set()
        }
    };
}


function toggleObjectsEditedSelection(state, action) {
    const { objectID } = action;
    let newSelectedObjectIDs = new Set(state.objectsEditedUI.selectedObjectIDs);
    if (newSelectedObjectIDs.has(objectID))
        newSelectedObjectIDs.delete(objectID);
    else
        newSelectedObjectIDs.add(objectID);
    
    return {
        ...state,
        objectsEditedUI: {
            ...state.objectsEditedUI,
            selectedObjectIDs: newSelectedObjectIDs
        }
    };
}


function toggleObjectsEditedSelectAll(state, action) {
    const editedObjectIDs = Object.keys(state.editedObjects);
    const newSelectedObjectIDs = state.objectsEditedUI.selectedObjectIDs.size < editedObjectIDs.length ? new Set(editedObjectIDs) : new Set();
    
    return {
        ...state,
        objectsEditedUI: {
            ...state.objectsEditedUI,
            selectedObjectIDs: newSelectedObjectIDs
        }
    };
}


const root = {
    LOAD_OBJECTS_EDITED_PAGE: loadObjectsEditedPage,
    TOGGLE_OBJECTS_EDITED_SELECTION: toggleObjectsEditedSelection,
    TOGGLE_OBJECTS_EDITED_SELECT_ALL: toggleObjectsEditedSelectAll
};

export default root;