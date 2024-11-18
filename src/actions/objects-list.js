export const SET_OBJECTS_LIST_TAGS_INPUT = "SET_OBJECTS_LIST_TAGS_INPUT";
export const SET_OBJECTS_LIST_CURRENT_TAGS = "SET_OBJECTS_LIST_CURRENT_TAGS";
export const SELECT_OBJECTS = "SELECT_OBJECTS";
export const TOGGLE_OBJECT_SELECTION = "TOGGLE_OBJECT_SELECTION";
export const CLEAR_SELECTED_OBJECTS = "CLEAR_SELECTED_OBJECTS";
export const SET_OBJECTS_LIST_TAGS_FILTER_INPUT = "SET_OBJECTS_LIST_TAGS_FILTER_INPUT";
export const SET_OBJECTS_LIST_SHOW_DELETE_DIALOG = "SET_OBJECTS_LIST_SHOW_DELETE_DIALOG";


/** [Reducer file](../reducers/objects-list.js) */
export const setObjectsListTagsInput         = tagsInput => ({ type: SET_OBJECTS_LIST_TAGS_INPUT, tagsInput });
/** [Reducer file](../reducers/objects-list.js) */
export const setObjectsListCurrentTags       = tagUpdates => ({ type: SET_OBJECTS_LIST_CURRENT_TAGS, tagUpdates });
/** [Reducer file](../reducers/objects-list.js) */
export const selectObjects               = object_ids => ({ type: SELECT_OBJECTS, object_ids });
/** [Reducer file](../reducers/objects-list.js) */
export const toggleObjectSelection       = object_id => ({ type: TOGGLE_OBJECT_SELECTION, object_id });
/** [Reducer file](../reducers/objects-list.js) */
export const clearSelectedObjects        = () => ({ type: CLEAR_SELECTED_OBJECTS });
/** [Reducer file](../reducers/objects-list.js) */
export const setObjectsListTagsFilterInput          = tagsFilterInput => ({ type: SET_OBJECTS_LIST_TAGS_FILTER_INPUT, tagsFilterInput });
/** [Reducer file](../reducers/objects-list.js) */
export const setShowDeleteDialogObjects  = (showDeleteDialog = false) => ({ type: SET_OBJECTS_LIST_SHOW_DELETE_DIALOG, showDeleteDialog });
