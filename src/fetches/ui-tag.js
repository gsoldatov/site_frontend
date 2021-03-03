import { isFetchingTag } from "../store/state-util/ui-tag";
import { addTagFetch, viewTagsFetch, updateTagFetch, deleteTagsFetch } from "./data-tags";
import { setRedirectOnRender } from "../actions/common";
import { loadEditTagPage, setTagOnLoadFetchState, setTagOnSaveFetchState, setShowDeleteDialogTag, setCurrentTag } from "../actions/tag";


// Handles "Save" button click on new tag page
export const addTagOnSaveFetch = () => {
    return async (dispatch, getState) => {
        let state = getState();

        // Exit if already fetching
        if (isFetchingTag(state)) return;

        // Run fetch & add tag
        dispatch(setTagOnSaveFetchState(true, ""));
        const tagAttributes = { tag_name: state.tagUI.currentTag.tag_name, tag_description: state.tagUI.currentTag.tag_description };
        const result = await dispatch(addTagFetch(tagAttributes));

        if (result.error === undefined) {
            dispatch(setTagOnSaveFetchState(false, ""));
            dispatch(setRedirectOnRender(`/tags/${result.tag_id}`));
        } else {
            dispatch(setTagOnSaveFetchState(false, result.error));
        }
    };
};


// Loads tag data on existing tag page
export const editTagOnLoadFetch = tag_id => {
    return async (dispatch, getState) => {
        // Set initial page state
        dispatch(loadEditTagPage());

        let state = getState();

        // Check local tag storage
        if (tag_id in state.tags) {
            dispatch(setCurrentTag({ ...state.tags[tag_id] }));
            return;
        }
        
        // Run view fetch & add tag data
        dispatch(setTagOnLoadFetchState(true, ""));
        const result = await dispatch(viewTagsFetch( [tag_id] ));

        if (result.error === undefined) {
            dispatch(setCurrentTag(result[0]));
            dispatch(setTagOnLoadFetchState(false, ""));
        } else {
            dispatch(setTagOnLoadFetchState(false, result.error));
        }
    };
};


// Handles "Save" button click on existing tag page
export const editTagOnSaveFetch = () => {
    return async (dispatch, getState) => {
        let state = getState();

        // Exit if already fetching
        if (isFetchingTag(state)) return;

        // Run fetch & update tag
        dispatch(setTagOnSaveFetchState(true, ""));
        
        const { tag_id, tag_name, tag_description } = state.tagUI.currentTag;
        const tagAttributes = { tag_id, tag_name, tag_description };
        const result = await dispatch(updateTagFetch(tagAttributes));
        
        if (result.error === undefined) {
            dispatch(setCurrentTag(result));
            dispatch(setTagOnSaveFetchState(false, ""));
        } else {
            dispatch(setTagOnSaveFetchState(false, result.error));
        }
    };        
};


// Handles delete confirmation button click on existing tag page
export const editTagOnDeleteFetch = () => {
    return async (dispatch, getState) => {
        // Exit if already fetching
        let state = getState();
        if (isFetchingTag(state)) return;

        // Hide delete dialog
        dispatch(setShowDeleteDialogTag(false));

        // Run view fetch & delete tag data
        dispatch(setTagOnLoadFetchState(true, ""));
        const result = await dispatch(deleteTagsFetch( [state.tagUI.currentTag.tag_id] ));

        if (result.error === undefined) {
            dispatch(setRedirectOnRender("/tags"));
        } else {
            dispatch(setTagOnLoadFetchState(false, result.error));
        }
    };      
};
