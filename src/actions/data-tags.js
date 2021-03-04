export const ADD_TAGS = "ADD_TAGS";
export const DELETE_TAGS = "DELETE_TAGS";
export const SET_OBJECTS_TAGS = "SET_OBJECTS_TAGS";


export const addTags    = tags => ({ type: ADD_TAGS, tags: tags });
export const deleteTags = tag_ids => ({ type: DELETE_TAGS, tag_ids: tag_ids });
export const setObjectsTags = objectsTags => ({ type: SET_OBJECTS_TAGS, objectsTags });
