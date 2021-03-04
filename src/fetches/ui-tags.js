import config from "../config";

import { runFetch, getErrorFromResponse, responseHasError } from "./common";
import { deleteTagsFetch, getNonCachedTags } from "./data-tags";

import { setTagsFetch, setShowDeleteDialogTags, setTagsPaginationInfo } from "../actions/tags";

import { isFetchingTags } from "../store/state-util/ui-tags";


const backendURL = config.backendURL;


// Updates pagination info, resets current displayed page to 1 and fetches tags to display on it.
export const setTagsPaginationInfoAndFetchPage = paginationInfo => {
    return async (dispatch, getState) => {
        paginationInfo.currentPage = 1;
        dispatch(setTagsPaginationInfo(paginationInfo));
        dispatch(pageFetch(paginationInfo.currentPage));
    };
};


// Fetches tags to display on provided `currentPage`.
export const pageFetch = currentPage => {
    return async (dispatch, getState) => {
        const state = getState();
        if (isFetchingTags(state)) return;

        dispatch(setTagsPaginationInfo({ currentPage: currentPage }));
        dispatch(setTagsFetch(true, ""));

        let result = await dispatch(getPageTagIDs());   // Fetch IDs of tags to display on the page
        if (responseHasError(result)) dispatch(setTagsFetch(false, result.error));
        else {  // Fetch missing tag data
            result = await dispatch(getNonCachedTags(getState().tagsUI.paginationInfo.currentPageTagIDs));
            dispatch(setTagsFetch(false, responseHasError(result) ? result.error : ""));
        }
    };
};


// Fetches backend and sets tag IDs of the current page based on the current pagination info settings.
const getPageTagIDs = () => {
    return async (dispatch, getState) => {
        const pI = getState().tagsUI.paginationInfo;
        let response = await runFetch(`${backendURL}/tags/get_page_tag_ids`, {
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
        });
        if (responseHasError(response)) return response;  // return error message in case of network error

        switch (response.status) {
            case 200:
                let json = await response.json();
                dispatch(setTagsPaginationInfo({ totalItems: json["total_items"], currentPageTagIDs: json["tag_ids"] }));
            case 400:
            case 404:
            case 500:
                return await getErrorFromResponse(response);
        }
    };
}


// Delete selected tags from state and stop displaying them on the current page.
export const onDeleteFetch = () => {
    return async (dispatch, getState) => {
        // Exit if already fetching
        let state = getState();
        if (isFetchingTags(state)) return;

        // Hide delete dialog
        dispatch(setShowDeleteDialogTags(false));

        // Run view fetch & delete tags data
        dispatch(setTagsFetch(true, ""));
        const result = await dispatch(deleteTagsFetch(state.tagsUI.selectedTagIDs));
        if (!responseHasError(result)) {
            dispatch(setTagsPaginationInfo({ currentPageTagIDs: state.tagsUI.paginationInfo.currentPageTagIDs.filter(id => !result.includes(id)) }));  // delete from current page
            dispatch(setTagsFetch(false, ""));
        } else {
            dispatch(setTagsFetch(false, result.error));
        }
    };
};
