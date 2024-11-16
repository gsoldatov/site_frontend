export const UPDATE_OBJECTS_DATA = "UPDATE_OBJECTS_DATA";
export const DELETE_OBJECTS = "DELETE_OBJECTS";


/** [Reducer file](../reducers/data-objects.js) */
export const updateObjectsData  = objectData => ({ type: UPDATE_OBJECTS_DATA, objectData });

/** [Reducer file](../reducers/data-objects.js) */
export const deleteObjects  = ({ objectIDs, deleteSubobjects }) => ({ type: DELETE_OBJECTS, objectIDs, deleteSubobjects });
