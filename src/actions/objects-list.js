export const SET_OBJECTS_TAGS_INPUT = "SET_OBJECTS_TAGS_INPUT";
export const SET_CURRENT_OBJECTS_TAGS = "SET_CURRENT_OBJECTS_TAGS";
export const SELECT_OBJECTS = "SELECT_OBJECTS";
export const TOGGLE_OBJECT_SELECTION = "TOGGLE_OBJECT_SELECTION";
export const CLEAR_SELECTED_OBJECTS = "CLEAR_SELECTED_OBJECTS";
export const SET_OBJECTS_PAGINATION_INFO = "SET_OBJECTS_PAGINATION_INFO";
export const SET_TAGS_FILTER = "SET_TAGS_FILTER";
export const SET_TAGS_FILTER_INPUT = "SET_TAGS_FILTER_INPUT";
export const SET_SHOW_DELETE_DIALOG_OBJECTS = "SET_SHOW_DELETE_DIALOG_OBJECTS";
export const SET_OBJECTS_FETCH = "SET_OBJECTS_FETCH";


export const setObjectsTagsInput         = tagsInput => ({ type: SET_OBJECTS_TAGS_INPUT, tagsInput });
export const setCurrentObjectsTags       = tagUpdates => ({ type: SET_CURRENT_OBJECTS_TAGS, tagUpdates });
export const selectObjects               = object_ids => ({ type: SELECT_OBJECTS, object_ids });
export const toggleObjectSelection       = object_id => ({ type: TOGGLE_OBJECT_SELECTION, object_id });
export const clearSelectedObjects        = () => ({ type: CLEAR_SELECTED_OBJECTS });
export const setObjectsPaginationInfo    = paginationInfo => ({ type: SET_OBJECTS_PAGINATION_INFO, paginationInfo });
export const setTagsFilter               = tagID => ({ type: SET_TAGS_FILTER, tagID });
export const setTagsFilterInput          = tagsFilterInput => ({ type: SET_TAGS_FILTER_INPUT, tagsFilterInput });
export const setShowDeleteDialogObjects  = (showDeleteDialog = false) => ({ type: SET_SHOW_DELETE_DIALOG_OBJECTS, showDeleteDialog });
export const setObjectsFetch             = (isFetching = false, fetchError = "") => ({ type: SET_OBJECTS_FETCH, isFetching: isFetching, fetchError: fetchError });
