import { deleteTagsFetch, getNonCachedTags, tagsAddFetch, updateTagFetch } from "../data/tags";

import { setRedirectOnRender } from "../../reducers/common";
import { loadTagsEditExistingPage, setTagsEditOnLoadFetchState, setTagsEditOnSaveFetchState, setShowDeleteDialogTagsEdit, setCurrentTag } from "../../reducers/ui/tags-edit";

import { isFetchingTag } from "../../store/state-util/ui-tags-edit";

import { currentTag } from "../../store/types/ui/tags-edit";

import type { Dispatch, GetState } from "../../util/types/common";


/**
 * Handles "Save" button click on a new tag's page.
 */
export const tagsEditNewSaveFetch = () => {
    return async (dispatch: Dispatch, getState: GetState): Promise<void> => {
        // Exit if already fetching
        let state = getState();
        if (isFetchingTag(state)) return;

        // Run fetch & add tag
        dispatch(setTagsEditOnSaveFetchState({ isFetching: true, fetchError: "" }));
        const result = await dispatch(tagsAddFetch(state.tagsEditUI.currentTag));

        // Handle fetch errors
        if (result.failed) {
            dispatch(setTagsEditOnSaveFetchState({ isFetching: false, fetchError: result.error || "" }));
            return;
        }
        
        // Handle successful fetch end
        const { tag_id } = result.tag!;
        dispatch(setTagsEditOnSaveFetchState({ isFetching: false, fetchError: "" }));
        dispatch(setRedirectOnRender(`/tags/edit/${tag_id}`));
    };
};


/**
 * Loads initial state and tag data on an existing tag's page.
 */
export const editTagOnLoadFetch = (tag_id: string | number) => {
    return async (dispatch: Dispatch, getState: GetState): Promise<void> => {
        // Set initial page state
        dispatch(loadTagsEditExistingPage());

        // Exit if tag_id is not valid
        tag_id = parseInt(tag_id as string);
        if (!(tag_id > 0)) {
            dispatch(setTagsEditOnLoadFetchState({ isFetching: false, fetchError: "Tag not found." }));
            return;
        }
        
        // Run view fetch & add tag data
        dispatch(setTagsEditOnLoadFetchState({ isFetching: true, fetchError: "" }));
        const result = await dispatch(getNonCachedTags([tag_id]));

        // Handle fetch errors
        if (result.failed) {
            dispatch(setTagsEditOnLoadFetchState({ isFetching: false, fetchError: result.error! }));
            return;
        }

        // Handle successful fetch end
        const tag = currentTag.parse(getState().tags[tag_id]);
        dispatch(setCurrentTag(tag));
        dispatch(setTagsEditOnLoadFetchState({ isFetching: false, fetchError: "" }));
    };
};


/**
 * Handles "Save" button click on existing tag's page.
 */
export const editTagOnSaveFetch = () => {
    return async (dispatch: Dispatch, getState: GetState): Promise<void> => {
        // Exit if already fetching
        let state = getState();
        if (isFetchingTag(state)) return;

        // Run fetch & update tag
        dispatch(setTagsEditOnSaveFetchState({ isFetching: true, fetchError: "" }));
        
        const result = await dispatch(updateTagFetch(state.tagsEditUI.currentTag));

        // Handle fetch errors
        if (result.failed) {
            dispatch(setTagsEditOnSaveFetchState({ isFetching: false, fetchError: result.error! }));
            return;
        }

        // Handle successful fetch end
        dispatch(setCurrentTag(result.tag!));
        dispatch(setTagsEditOnSaveFetchState({ isFetching: false, fetchError: "" }));
    };
};


/**
 * Handles delete confirmation button click on an existing tag's page.
 */
export const editTagOnDeleteFetch = () => {
    return async (dispatch: Dispatch, getState: GetState): Promise<void> => {
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
            dispatch(setTagsEditOnSaveFetchState({ isFetching: false, fetchError: result.error! }));
            return;
        }

        // Handle successful fetch end
        dispatch(setRedirectOnRender("/tags/list"));
    };
};
