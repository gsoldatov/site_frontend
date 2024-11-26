import { tagsDeleteFetch, fetchMissingTags, tagsAddFetch, tagsUpdateFetch } from "../data/tags";

import { setRedirectOnRender } from "../../reducers/common";
import { loadTagsEditExistingPage, setTagsEditLoadFetchState, setTagsEditSaveFetchState, setTagsEditShowDeleteDialog, setCurrentTag } from "../../reducers/ui/tags-edit";

import { TagsEditSelectors } from "../../store/selectors/ui/tags-edit";

import { currentTag } from "../../store/types/ui/tags-edit";
import type { Dispatch, GetState } from "../../store/types/store";


/**
 * Handles "Save" button click on a new tag's page.
 */
export const tagsEditNewSaveFetch = () => {
    return async (dispatch: Dispatch, getState: GetState): Promise<void> => {
        // Exit if already fetching
        let state = getState();
        if (TagsEditSelectors.isFetching(state)) return;

        // Run fetch & add tag
        dispatch(setTagsEditSaveFetchState({ isFetching: true, fetchError: "" }));
        const result = await dispatch(tagsAddFetch(state.tagsEditUI.currentTag));

        // Handle fetch errors
        if (result.failed) {
            dispatch(setTagsEditSaveFetchState({ isFetching: false, fetchError: result.error || "" }));
            return;
        }
        
        // Handle successful fetch end
        const { tag_id } = result.tag!;
        dispatch(setTagsEditSaveFetchState({ isFetching: false, fetchError: "" }));
        dispatch(setRedirectOnRender(`/tags/edit/${tag_id}`));
    };
};


/**
 * Loads initial state and tag data on an existing tag's page.
 */
export const tagsEditExistingLoadFetch = (tag_id: string | number) => {
    return async (dispatch: Dispatch, getState: GetState): Promise<void> => {
        // Set initial page state
        dispatch(loadTagsEditExistingPage());

        // Exit if tag_id is not valid
        tag_id = parseInt(tag_id as string);
        if (!(tag_id > 0)) {
            dispatch(setTagsEditLoadFetchState({ isFetching: false, fetchError: "Tag not found." }));
            return;
        }
        
        // Run view fetch & add tag data
        dispatch(setTagsEditLoadFetchState({ isFetching: true, fetchError: "" }));
        const result = await dispatch(fetchMissingTags([tag_id]));

        // Handle fetch errors
        if (result.failed) {
            dispatch(setTagsEditLoadFetchState({ isFetching: false, fetchError: result.error! }));
            return;
        }

        // Handle successful fetch end
        const tag = currentTag.parse(getState().tags[tag_id]);
        dispatch(setCurrentTag(tag));
        dispatch(setTagsEditLoadFetchState({ isFetching: false, fetchError: "" }));
    };
};


/**
 * Handles "Save" button click on existing tag's page.
 */
export const tagsEditExistingSaveFetch = () => {
    return async (dispatch: Dispatch, getState: GetState): Promise<void> => {
        // Exit if already fetching
        let state = getState();
        if (TagsEditSelectors.isFetching(state)) return;

        // Run fetch & update tag
        dispatch(setTagsEditSaveFetchState({ isFetching: true, fetchError: "" }));
        
        const result = await dispatch(tagsUpdateFetch(state.tagsEditUI.currentTag));

        // Handle fetch errors
        if (result.failed) {
            dispatch(setTagsEditSaveFetchState({ isFetching: false, fetchError: result.error! }));
            return;
        }

        // Handle successful fetch end
        dispatch(setCurrentTag(result.tag!));
        dispatch(setTagsEditSaveFetchState({ isFetching: false, fetchError: "" }));
    };
};


/**
 * Handles delete confirmation button click on an existing tag's page.
 */
export const tagsEditExistingDeleteFetch = () => {
    return async (dispatch: Dispatch, getState: GetState): Promise<void> => {
        // Exit if already fetching
        let state = getState();
        if (TagsEditSelectors.isFetching(state)) return;

        // Hide delete dialog
        dispatch(setTagsEditShowDeleteDialog(false));

        // Run fetch & delete tag data from state
        dispatch(setTagsEditSaveFetchState({ isFetching: true, fetchError: "" }));
        const result = await dispatch(tagsDeleteFetch( [state.tagsEditUI.currentTag.tag_id] ));

        // Handle fetch errors (consider 404 status as a successful fetch)
        if (result.failed && result.status !== 404) {
            dispatch(setTagsEditSaveFetchState({ isFetching: false, fetchError: result.error! }));
            return;
        }

        // Handle successful fetch end
        dispatch(setRedirectOnRender("/tags/list"));
    };
};
