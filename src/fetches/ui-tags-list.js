import { getConfig } from "../config";

import { runFetch, getErrorFromResponse, getResponseErrorType } from "./common";
import { deleteTagsFetch, getNonCachedTags } from "./data-tags";

import { setTagsFetch, setShowDeleteDialogTags, setTagsPaginationInfo } from "../actions/tags-list";

import { isFetchingTags } from "../store/state-util/ui-tags-list";

import { enumResponseErrorType } from "../util/enums/enum-response-error-type";


const backendURL = getConfig().backendURL;


/**
 * Updates pagination info, resets current displayed page to 1 and fetches tags to display on it.
 */
export const setTagsPaginationInfoAndFetchPage = paginationInfo => {
    return async (dispatch, getState) => {
        paginationInfo.currentPage = 1;
        dispatch(setTagsPaginationInfo(paginationInfo));
        dispatch(pageFetch(paginationInfo.currentPage));
    };
};


/**
 * Fetches tags to display on provided `currentPage`.
 */
export const pageFetch = currentPage => {
    return async (dispatch, getState) => {
        const state = getState();
        if (isFetchingTags(state)) return;

        dispatch(setTagsPaginationInfo({ currentPage }));
        dispatch(setTagsFetch(true, ""));

        // Fetch IDs of tags to display on the page
        let result = await dispatch(getPageTagIDs());

        // Handle fetch errors
        const responseErrorType = getResponseErrorType(result);
        if (responseErrorType > enumResponseErrorType.none) {
            const errorMessage = responseErrorType === enumResponseErrorType.general ? result.error : "";
            dispatch(setTagsFetch(false, errorMessage));
            return;
        }

        // Is fetch is successful, fetch missing tag data
        result = await dispatch(getNonCachedTags(getState().tagsListUI.paginationInfo.currentPageTagIDs));
        dispatch(setTagsFetch(false, getResponseErrorType(result) === enumResponseErrorType.general ? result.error : ""));
    };
};


/**
 * Fetches backend and sets tag IDs of the current page based on the current pagination info settings.
 */
const getPageTagIDs = () => {
    return async (dispatch, getState) => {
        const pI = getState().tagsListUI.paginationInfo;

        // Exit with error if filter text is too long
        if (pI.filterText.length > 255) return { error: "Tag name filter text is too long."};

        let response = await dispatch(runFetch(`${backendURL}/tags/get_page_tag_ids`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                pagination_info: {
                    page: pI.currentPage,
                    items_per_page: pI.itemsPerPage,
                    order_by: pI.sortField,
                    sort_order: pI.sortOrder,
                    filter_text: pI.filterText
                }
            })
        }));

        switch (response.status) {
            case 200:
                let json = await response.json();
                dispatch(setTagsPaginationInfo({ totalItems: json["total_items"], currentPageTagIDs: json["tag_ids"] }));
                return json;
            default:
                return await getErrorFromResponse(response);
        }
    };
}


/**
 * Delete selected tags from state and stop displaying them on the current page.
 */
export const onDeleteFetch = () => {
    return async (dispatch, getState) => {
        // Exit if already fetching
        let state = getState();
        if (isFetchingTags(state)) return;

        // Hide delete dialog
        dispatch(setShowDeleteDialogTags(false));

        // Run delete fetch & delete tags data
        dispatch(setTagsFetch(true, ""));
        const result = await dispatch(deleteTagsFetch(state.tagsListUI.selectedTagIDs));

        // Handle fetch errors
        const responseErrorType = getResponseErrorType(result);
        if (responseErrorType > enumResponseErrorType.none) {
            const errorMessage = responseErrorType === enumResponseErrorType.general ? result.error : "";
            dispatch(setTagsFetch(false, errorMessage));
            return;
        }

        // Handle successful fetch end
        dispatch(setTagsPaginationInfo({ currentPageTagIDs: state.tagsListUI.paginationInfo.currentPageTagIDs.filter(id => !result.includes(id)) }));  // delete from current page
        dispatch(setTagsFetch(false, ""));
    };
};
