export const ADD_OBJECTS = "ADD_OBJECTS";
export const ADD_OBJECT_DATA = "ADD_OBJECT_DATA";
export const DELETE_OBJECTS = "DELETE_OBJECTS";


export const addObjects     = objects => ({ type: ADD_OBJECTS, objects });
export const addObjectData  = objectData => ({ type: ADD_OBJECT_DATA, objectData });
export const deleteObjects  = object_ids => ({ type: DELETE_OBJECTS, object_ids });
