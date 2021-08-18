export const LOAD_EDITED_OBJECTS_PAGE = "LOAD_EDITED_OBJECTS_PAGE";
export const TOGGLE_EDITED_OBJECT_SELECTION = "TOGGLE_EDITED_OBJECT_SELECTION";
export const TOGGLE_ALL_OBJECTS_SELECTION = "TOGGLE_ALL_OBJECTS_SELECTION";

export const loadEditedObjectsPage        = () => ({ type: LOAD_EDITED_OBJECTS_PAGE });
export const toggleEditedObjectSelection = objectID => ({ type: TOGGLE_EDITED_OBJECT_SELECTION, objectID });
export const toggleAllObjectsSelection   = () => ({ type: TOGGLE_ALL_OBJECTS_SELECTION });