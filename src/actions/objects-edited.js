export const LOAD_OBJECTS_EDITED_PAGE = "LOAD_OBJECTS_EDITED_PAGE";
export const TOGGLE_EDITED_OBJECT_SELECTION = "TOGGLE_EDITED_OBJECT_SELECTION";
export const TOGGLE_ALL_OBJECTS_SELECTION = "TOGGLE_ALL_OBJECTS_SELECTION";


/** [Reducer file](../reducers/objects-edited.js) */
export const loadObjectsEditedPage        = () => ({ type: LOAD_OBJECTS_EDITED_PAGE });
/** [Reducer file](../reducers/objects-edited.js) */
export const toggleEditedObjectSelection = objectID => ({ type: TOGGLE_EDITED_OBJECT_SELECTION, objectID });
/** [Reducer file](../reducers/objects-edited.js) */
export const toggleAllObjectsSelection   = () => ({ type: TOGGLE_ALL_OBJECTS_SELECTION });