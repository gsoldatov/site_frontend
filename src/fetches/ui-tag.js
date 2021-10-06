import { getResponseErrorType } from "./common";
import { addTagFetch, viewTagsFetch, updateTagFetch, deleteTagsFetch } from "./data-tags";

import { setRedirectOnRender } from "../actions/common";
import { loadEditTagPage, setTagOnLoadFetchState, setTagOnSaveFetchState, setShowDeleteDialogTag, setCurrentTag } from "../actions/tag";

import { isFetchingTag } from "../store/state-util/ui-tag";

import { enumResponseErrorType } from "../util/enum-response-error-type";


/**
 * Handles "Save" button click on new tag page.
 */
export const addTagOnSaveFetch = () => {
    return async (dispatch, getState) => {
        // Exit if already fetching
        let state = getState();
        if (isFetchingTag(state)) return;

        // Run fetch & add tag
        dispatch(setTagOnSaveFetchState(true, ""));
        const tagAttributes = { tag_name: state.tagUI.currentTag.tag_name, tag_description: state.tagUI.currentTag.tag_description };
        const result = await dispatch(addTagFetch(tagAttributes));

        // Handle fetch errors
        const responseErrorType = getResponseErrorType(result);
        if (responseErrorType > enumResponseErrorType.none) {
            const errorMessage = responseErrorType === enumResponseErrorType.general ? result.error : "";
            dispatch(setTagOnSaveFetchState(false, errorMessage));
            return;
        }

        // Handle successful fetch end
        dispatch(setTagOnSaveFetchState(false, ""));
        dispatch(setRedirectOnRender(`/tags/${result.tag_id}`));
    };
};


/**
 * Loads tag data on existing tag page.
 */
export const editTagOnLoadFetch = tag_id => {
    return async (dispatch, getState) => {
        // Set initial page state
        dispatch(loadEditTagPage());

        // Exit if tag_id is not valid
        tag_id = parseInt(tag_id);
        if (!(tag_id > 0)) {
            dispatch(setTagOnLoadFetchState(false, "Object not found."));
            return;
        }

        // Check local tag storage
        let state = getState();
        if (tag_id in state.tags) {
            dispatch(setCurrentTag({ ...state.tags[tag_id] }));
            return;
        }
        
        // Run view fetch & add tag data
        dispatch(setTagOnLoadFetchState(true, ""));
        const result = await dispatch(viewTagsFetch( [tag_id] ));

        // Handle fetch errors
        const responseErrorType = getResponseErrorType(result);
        if (responseErrorType > enumResponseErrorType.none) {
            const errorMessage = responseErrorType === enumResponseErrorType.general ? result.error : "";
            dispatch(setTagOnLoadFetchState(false, errorMessage));
            return;
        }

        // Handle successful fetch end
        dispatch(setCurrentTag(result[0]));
        dispatch(setTagOnLoadFetchState(false, ""));
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
        dispatch(setTagOnSaveFetchState(true, ""));
        
        const { tag_id, tag_name, tag_description } = state.tagUI.currentTag;
        const tagAttributes = { tag_id, tag_name, tag_description };
        const result = await dispatch(updateTagFetch(tagAttributes));

        // Handle fetch errors
        const responseErrorType = getResponseErrorType(result);
        if (responseErrorType > enumResponseErrorType.none) {
            const errorMessage = responseErrorType === enumResponseErrorType.general ? result.error : "";
            dispatch(setTagOnSaveFetchState(false, errorMessage));
            return;
        }

        // Handle successful fetch end
        dispatch(setCurrentTag(result));
        dispatch(setTagOnSaveFetchState(false, ""));
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
        dispatch(setShowDeleteDialogTag(false));

        // Run fetch & delete tag data from state
        dispatch(setTagOnSaveFetchState(true, ""));
        const result = await dispatch(deleteTagsFetch( [state.tagUI.currentTag.tag_id] ));

        // Handle fetch errors
        const responseErrorType = getResponseErrorType(result);
        if (responseErrorType > enumResponseErrorType.none) {
            const errorMessage = responseErrorType === enumResponseErrorType.general ? result.error : "";
            dispatch(setTagOnSaveFetchState(false, errorMessage));
            return;
        }

        // Handle successful fetch end
        dispatch(setRedirectOnRender("/tags"));
    };
};
