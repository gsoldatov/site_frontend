export const LOAD_OBJECTS_EDITED_PAGE = "LOAD_OBJECTS_EDITED_PAGE";
export const TOGGLE_OBJECTS_EDITED_SELECTION = "TOGGLE_OBJECTS_EDITED_SELECTION";
export const TOGGLE_OBJECTS_EDITED_SELECT_ALL = "TOGGLE_OBJECTS_EDITED_SELECT_ALL";


/** [Reducer file](../reducers/objects-edited.js) */
export const loadObjectsEditedPage        = () => ({ type: LOAD_OBJECTS_EDITED_PAGE });
/** [Reducer file](../reducers/objects-edited.js) */
export const toggleObjectsEditedSelection = objectID => ({ type: TOGGLE_OBJECTS_EDITED_SELECTION, objectID });
/** [Reducer file](../reducers/objects-edited.js) */
export const toggleObjectsEditedSelectAll   = () => ({ type: TOGGLE_OBJECTS_EDITED_SELECT_ALL });