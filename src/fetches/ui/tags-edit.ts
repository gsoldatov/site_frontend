// import { addTagFetch, viewTagsFetch, updateTagFetch, deleteTagsFetch } from "../data-tags";
import { tagsAddFetch } from "../data/tags";

import { setRedirectOnRender } from "../../reducers/common";
import { loadTagsEditExistingPage, setTagsEditOnLoadFetchState, setTagsEditOnSaveFetchState, setShowDeleteDialogTagsEdit, setCurrentTag } from "../../reducers/ui/tags-edit";

import { isFetchingTag } from "../../store/state-util/ui-tags-edit";

import { tag } from "../../store/types/data/tags";

import type { Dispatch, GetState } from "../../util/types/common";


/**
 * Handles "Save" button click on new tag page.
 */
export const tagsEditNewSaveFetch = () => {
    return async (dispatch: Dispatch, getState: GetState) => {
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
