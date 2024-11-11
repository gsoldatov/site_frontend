export const ADD_OBJECTS = "ADD_OBJECTS";
export const ADD_OBJECTS_DATA = "ADD_OBJECTS_DATA";
export const UPDATE_OBJECTS_DATA = "UPDATE_OBJECTS_DATA";
export const DELETE_OBJECTS = "DELETE_OBJECTS";


/** [Reducer file](../reducers/data-objects.js) */
export const addObjects     = objects => ({ type: ADD_OBJECTS, objects });

/** [Reducer file](../reducers/data-objects.js) */
export const addObjectsData  = objectData => ({ type: ADD_OBJECTS_DATA, objectData });

/** [Reducer file](../reducers/data-objects.js) */
export const updateObjectsData  = objectData => ({ type: UPDATE_OBJECTS_DATA, objectData });

/** [Reducer file](../reducers/data-objects.js) */
export const deleteObjects  = ({ objectIDs, deleteSubobjects }) => ({ type: DELETE_OBJECTS, objectIDs, deleteSubobjects });
