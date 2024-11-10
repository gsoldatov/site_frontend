import { getResponseErrorType } from "./common";
import { updateTagFetch, getNonCachedTags, deleteTagsFetch } from "./data/tags";

import { setRedirectOnRender } from "../reducers/common";
import { loadTagsEditExistingPage, setTagsEditOnLoadFetchState, setTagsEditOnSaveFetchState, setShowDeleteDialogTagsEdit, setCurrentTag } from "../reducers/ui/tags-edit";

import { isFetchingTag } from "../store/state-util/ui-tags-edit";

import { enumResponseErrorType } from "../util/enums/enum-response-error-type";
import { updatedTagAttributes } from "../store/state-templates/tags";
import { currentTag } from "../store/types/ui/tags-edit";


/**
 * Loads tag data on existing tag page.
 */
export const editTagOnLoadFetch = tag_id => {
    return async (dispatch, getState) => {
        // Set initial page state
        dispatch(loadTagsEditExistingPage());

        // Exit if tag_id is not valid
        tag_id = parseInt(tag_id);
        if (!(tag_id > 0)) {
            dispatch(setTagsEditOnLoadFetchState({ isFetching: false, fetchError: "Object not found." }));
            return;
        }
        
        // Run view fetch & add tag data
        dispatch(setTagsEditOnLoadFetchState({ isFetching: true, fetchError: "" }));
        const result = await dispatch(getNonCachedTags([tag_id]));

        // Handle fetch errors
        if (result.failed) {
            dispatch(setTagsEditOnLoadFetchState({ isFetching: false, fetchError: result.error }));
            return;
        }

        // Handle successful fetch end
        const tag = currentTag.parse(getState().tags[tag_id]);
        dispatch(setCurrentTag(tag));
        dispatch(setTagsEditOnLoadFetchState({ isFetching: false, fetchError: "" }));
    };
};


/**
 * Handles "Save" button click on existing tag page.
 */
export const editTagOnSaveFetch = () => {
    return async (dispatch, getState) => {
        // Exit if already fetching
        let state = getState();
        if (isFetchingTag(state)) return;

        // Run fetch & update tag
        dispatch(setTagsEditOnSaveFetchState({ isFetching: true, fetchError: "" }));
        
        const tag = {};
        updatedTagAttributes.forEach(attr => { tag[attr] = state.tagsEditUI.currentTag[attr]; });
        const result = await dispatch(updateTagFetch(tag));

        // Handle fetch errors
        if (result.failed) {
            dispatch(setTagsEditOnSaveFetchState({ isFetching: false, fetchError: result.error }));
            return;
        }

        // Handle successful fetch end
        dispatch(setCurrentTag(result));
        dispatch(setTagsEditOnSaveFetchState({ isFetching: false, fetchError: "" }));
    };
};


/**
 * Handles delete confirmation button click on existing tag page.
 */
export const editTagOnDeleteFetch = () => {
    return async (dispatch, getState) => {
        // Exit if already fetching
        let state = getState();
        if (isFetchingTag(state)) return;

        // Hide delete dialog
        dispatch(setShowDeleteDialogTagsEdit(false));

        // Run fetch & delete tag data from state
        dispatch(setTagsEditOnSaveFetchState({ isFetching: true, fetchError: "" }));
        const result = await dispatch(deleteTagsFetch( [state.tagsEditUI.currentTag.tag_id] ));

        // Handle fetch errors (consider 404 status as a successful fetch)
        if (result.failed && result.status !== 404) {
            dispatch(setTagsEditOnSaveFetchState({ isFetching: false, fetchError: result.error }));
            return;
        }

        // Handle successful fetch end
        dispatch(setRedirectOnRender("/tags/list"));
    };
};
