export const ADD_OBJECTS = "ADD_OBJECTS";
export const UPDATE_OBJECTS = "UPDATE_OBJECTS";
export const ADD_OBJECT_DATA = "ADD_OBJECT_DATA";
export const UPDATE_OBJECT_DATA = "UPDATE_OBJECT_DATA";
export const DELETE_OBJECTS = "DELETE_OBJECTS";


/** [Reducer file](../reducers/data-objects.js) */
export const addObjects     = objects => ({ type: ADD_OBJECTS, objects });

/** [Reducer file](../reducers/data-objects.js) */
export const updateObjects  = objects => ({ type: UPDATE_OBJECTS, objects });

/** [Reducer file](../reducers/data-objects.js) */
export const addObjectData  = objectData => ({ type: ADD_OBJECT_DATA, objectData });

/** [Reducer file](../reducers/data-objects.js) */
export const updateObjectData  = objectData => ({ type: UPDATE_OBJECT_DATA, objectData });

/** [Reducer file](../reducers/data-objects.js) */
export const deleteObjects  = ({ objectIDs, deleteSubobjects }) => ({ type: DELETE_OBJECTS, objectIDs, deleteSubobjects });
