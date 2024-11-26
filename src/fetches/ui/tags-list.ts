import { FetchRunner, FetchResult, FetchErrorType } from "../fetch-runner";
import { fetchMissingTags, tagsDeleteFetch } from "../data/tags";

import { setTagsListFetch, setTagsListShowDeleteDialog, setTagsListPaginationInfo } from "../../reducers/ui/tags-list";

import { TagsListSelectors } from "../../store/selectors/ui/tags-list";

import { tagsGetPageTagIDsResponseSchema } from "../types/ui/tags-list";
import type { Dispatch, GetState } from "../../store/types/store";
import type { TagsListPaginationInfo } from "../../store/types/ui/tags-list";


/**
 * Updates pagination info, resets current displayed page to 1 and fetches tags to display on it.
 */
export const setTagsListPaginationInfoAndFetchPage = (paginationInfo: Partial<TagsListPaginationInfo>) => {
    return async (dispatch: Dispatch, getState: GetState): Promise<void> => {
        paginationInfo.currentPage = 1;
        dispatch(setTagsListPaginationInfo(paginationInfo));
        dispatch(tagsListPageFetch(paginationInfo.currentPage));
    };
};


/**
 * Fetches tags to display on provided `currentPage`.
 */
export const tagsListPageFetch = (currentPage: number) => {
    return async (dispatch: Dispatch, getState: GetState): Promise<void> => {
        const state = getState();
        if (TagsListSelectors.isFetching(state)) return;

        dispatch(setTagsListPaginationInfo({ currentPage }));
        dispatch(setTagsListFetch({ isFetching: true, fetchError:"" }));

        // Fetch IDs of tags to display on the page
        let result = await dispatch(tagsGetPageTagIDs());

        // Handle fetch errors
        if (result.failed) {
            dispatch(setTagsListFetch({ isFetching: false, fetchError: result.error! }));
            return;
        }

        // Is fetch is successful, fetch missing tag data
        result = await dispatch(fetchMissingTags(getState().tagsListUI.paginationInfo.currentPageTagIDs));
        const fetchError = result.failed ? result.error! : "";
        dispatch(setTagsListFetch({ isFetching: false, fetchError }));
    };
};


/**
 * Fetches backend and sets tag IDs of the current page based on the current pagination info settings.
 */
const tagsGetPageTagIDs = () => {
    return async (dispatch: Dispatch, getState: GetState): Promise<FetchResult> => {
        const pI = getState().tagsListUI.paginationInfo;

        // Exit with error if filter text is too long
        if (pI.filterText.length > 255) return FetchResult.fetchNotRun({ errorType: FetchErrorType.general, error: "Tag name filter text is too long."});

        // Fetch backend
        const body = { pagination_info: {
            page: pI.currentPage,
            items_per_page: pI.itemsPerPage,
            order_by: pI.sortField,
            sort_order: pI.sortOrder,
            filter_text: pI.filterText
        }};
        const runner = new FetchRunner("/tags/get_page_tag_ids", { method: "POST", body });
        const result = await runner.run();

        switch (result.status) {
            case 200:
                const responsePI = tagsGetPageTagIDsResponseSchema.parse(result.json);
                dispatch(setTagsListPaginationInfo({ totalItems: responsePI.total_items, currentPageTagIDs: responsePI.tag_ids }));
                return result;
            default:
                return result;
        }
    };
}


/**
 * Delete selected tags from state and stop displaying them on the current page.
 */
export const tagsListDeleteFetch = () => {
    return async (dispatch: Dispatch, getState: GetState): Promise<void> => {
        // Exit if already fetching
        let state = getState();
        if (TagsListSelectors.isFetching(state)) return;

        // Hide delete dialog
        dispatch(setTagsListShowDeleteDialog(false));

        // Run delete fetch & delete tags data
        dispatch(setTagsListFetch({ isFetching: true, fetchError: "" }));
        const { selectedTagIDs } = state.tagsListUI;
        const result = await dispatch(tagsDeleteFetch(state.tagsListUI.selectedTagIDs));

        // Handle fetch errors (consider 404 status as a successful fetch, so that tags are cleared from the state)
        if (result.failed && result.status !== 404) {
            dispatch(setTagsListFetch({ isFetching: false, fetchError: result.error! }));
            return;
        }

        // Handle successful fetch end
        dispatch(setTagsListPaginationInfo({ 
            currentPageTagIDs: state.tagsListUI.paginationInfo.currentPageTagIDs.filter(id => !selectedTagIDs.includes(id)) }));  // delete from current page
        dispatch(setTagsListFetch({ isFetching: false, fetchError: "" }));
    };
};
