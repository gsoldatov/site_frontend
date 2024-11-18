export const SET_OBJECTS_LIST_CURRENT_TAGS = "SET_OBJECTS_LIST_CURRENT_TAGS";
export const SELECT_OBJECTS = "SELECT_OBJECTS";


/** [Reducer file](../reducers/objects-list.js) */
export const setObjectsListCurrentTags       = tagUpdates => ({ type: SET_OBJECTS_LIST_CURRENT_TAGS, tagUpdates });
/** [Reducer file](../reducers/objects-list.js) */
export const selectObjects               = object_ids => ({ type: SELECT_OBJECTS, object_ids });
