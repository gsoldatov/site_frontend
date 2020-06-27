import config from "../config";
import { getTagsPaginationCacheKey } from "../store/state-util";

const backendURL = config.backendURL;

export const ADD_TAGS = "ADD_TAGS";
export const DELETE_TAGS = "DELETE_TAGS";
export const TOGGLE_TAG_SELECTION = "TOGGLE_TAG_SELECTION";
export const SET_TAGS_PAGINATION_INFO = "SET_TAGS_PAGINATION_INFO";
export const SET_TAGS_PAGINATION_FETCH = "SET_TAGS_PAGINATION_FETCH";
export const SET_TAGS_REDIRECT_ON_RENDER = "SET_TAGS_REDIRECT_ON_RENDER";

export const addTags            = (tags) => ({ type: ADD_TAGS, tags: tags });
export const deleteTags         = (tag_ids) => ({ type: DELETE_TAGS, tag_ids: tag_ids });
export const toggleTagSelection = (tag_id) => ({ type: TOGGLE_TAG_SELECTION, tag_id: tag_id });
export const setTagsPaginationFetch = (isFetching = false, fetchError = "") => ({ type: SET_TAGS_PAGINATION_FETCH, isFetching: isFetching, fetchError: fetchError });
export const setTagsPaginationInfo  = (paginationInfo) => ({ type: SET_TAGS_PAGINATION_INFO, paginationInfo: paginationInfo });
export const setTagsRedirectOnRender = (redirectOnRender = "") => ({ type: SET_TAGS_REDIRECT_ON_RENDER, redirectOnRender: redirectOnRender });

function getTagsFetch(tag_ids) {
    return async (dispatch, getState) => {
        let payload = JSON.stringify({ tag_ids: tag_ids });
        let response = await fetch(`${backendURL}/tags/view`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: payload
        });

        switch (response.status) {
            case 200:
                let tags = (await response.json())["tags"];
                dispatch(addTags(tags));
                return;
            case 400:
            case 404:
                throw new Error((await response.json())["_error"]);
                return;
            case 500:
                throw new Error(await response.text());
                return;
        }
    };
};

function getPageTagIDs() {
    return async (dispatch, getState) => {
        let pI = getState().tagsUI.paginationInfo;
        let response = await fetch(`${backendURL}/tags/get_page_tag_ids`, {
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

        switch (response.status) {
            case 200:
                let json = await response.json();
                dispatch(setTagsPaginationInfo({ totalItems: json["total_items"], currentPageTagIDs: json["tag_ids"] }));
                return;
            case 400:
            case 404:
                throw new Error((await response.json())["_error"]);
            case 500:
                throw new Error(await response.text());
        }
    };
}

export function pageFetch(currentPage) {
    return async (dispatch, getState) => {
        const state = getState();

        if (state.tagsUI.paginationFetch.isFetching) {
            return;
        }

        try {
            dispatch(setTagsPaginationInfo({ currentPage: currentPage }));
            dispatch(setTagsPaginationFetch(true, ""));
            await dispatch(getPageTagIDs());
            let nonCachedTags = getState().tagsUI.paginationInfo.currentPageTagIDs.filter(tag_id => !(tag_id in state.tags));
            if (nonCachedTags.length !== 0) {   // Fetch tags of the current page which were not cached before
                await dispatch(getTagsFetch(nonCachedTags));
            }
            dispatch(setTagsPaginationFetch(false, ""));
        }
        catch(error) {
            dispatch(setTagsPaginationFetch(false, error.message));
            throw error;
        }
    }
};

