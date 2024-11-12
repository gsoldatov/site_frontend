import type { State } from "../../store/types/state";

/** Sets default state of the /objects/edited page. */
export const loadObjectsEditedPage = () => ({ type: "LOAD_OBJECTS_EDITED_PAGE" });

const _loadObjectsEditedPage = (state: State, action: any): State => {
    return {
        ...state,
        objectsEditedUI: {
            ...state.objectsEditedUI,
            selectedObjectIDs: new Set()
        }
    };
};

/** Toggles selection of an object with `objectID` on the /objects/edited page. */
export const toggleObjectsEditedSelection = (objectID: string | number) => ({ type: "TOGGLE_OBJECTS_EDITED_SELECTION", objectID });

const _toggleObjectsEditedSelection = (state: State, action: { objectID: string | number }): State => {
    const objectID = parseInt(action.objectID as string);
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
};

/** Selects or deselects all objects on the /objects/edited page. */
export const toggleObjectsEditedSelectAll = () => ({ type: "TOGGLE_OBJECTS_EDITED_SELECT_ALL" });

const _toggleObjectsEditedSelectAll = (state: State, action: any): State => {
    const editedObjectIDs = Object.keys(state.editedObjects).map(k => parseInt(k));
    const newSelectedObjectIDs: Set<number> = state.objectsEditedUI.selectedObjectIDs.size < editedObjectIDs.length ? new Set(editedObjectIDs) : new Set();
    
    return {
        ...state,
        objectsEditedUI: {
            ...state.objectsEditedUI,
            selectedObjectIDs: newSelectedObjectIDs
        }
    };
};


export const objectsEditedRoot = {
    "LOAD_OBJECTS_EDITED_PAGE": _loadObjectsEditedPage,
    "TOGGLE_OBJECTS_EDITED_SELECTION": _toggleObjectsEditedSelection,
    "TOGGLE_OBJECTS_EDITED_SELECT_ALL": _toggleObjectsEditedSelectAll
};
