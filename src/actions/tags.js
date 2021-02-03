import config from "../config";
import { isFetchingTags } from "../store/state-util/ui-tags";


const backendURL = config.backendURL;


export const ADD_TAGS = "ADD_TAGS";
export const DELETE_TAGS = "DELETE_TAGS";
export const SELECT_TAGS = "SELECT_TAGS";
export const TOGGLE_TAG_SELECTION = "TOGGLE_TAG_SELECTION";
export const DESELECT_TAGS = "DESELECT_TAGS";
export const CLEAR_SELECTED_TAGS = "CLEAR_SELECTED_TAGS";
export const SET_TAGS_PAGINATION_INFO = "SET_TAGS_PAGINATION_INFO";
export const SET_SHOW_DELETE_DIALOG_TAGS = "SET_SHOW_DELETE_DIALOG_TAGS";
export const SET_TAGS_FETCH = "SET_TAGS_FETCH";


export const addTags                 = tags => ({ type: ADD_TAGS, tags: tags });
export const deleteTags              = tag_ids => ({ type: DELETE_TAGS, tag_ids: tag_ids });
export const selectTags              = tag_ids => ({ type: SELECT_TAGS, tag_ids: tag_ids });
export const toggleTagSelection      = tag_id => ({ type: TOGGLE_TAG_SELECTION, tag_id: tag_id });
export const deselectTags            = tag_ids => ({ type: DESELECT_TAGS, tag_ids: tag_ids });
export const clearSelectedTags       = () => ({ type: CLEAR_SELECTED_TAGS });
export const setTagsPaginationInfo   = paginationInfo => ({ type: SET_TAGS_PAGINATION_INFO, paginationInfo: paginationInfo });
export const setShowDeleteDialogTags = (showDeleteDialog = false) => ({ type: SET_SHOW_DELETE_DIALOG_TAGS, showDeleteDialog: showDeleteDialog });

export const setTagsFetch = (isFetching = false, fetchError = "") => { 
    return {
        type: SET_TAGS_FETCH, 
        isFetching: isFetching, 
        fetchError: fetchError
    };
};

export function getTagsFetch(tag_ids) {
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

// Fetches missing data for a list of provided tag IDs
export function getNonCachedTags(tagIDs) {
    return async (dispatch, getState) => {
        let nonCachedTags = tagIDs.filter(tag_id => !(tag_id in getState().tags));
        if (nonCachedTags.length !== 0) {   // Fetch non-cached tags' data
            await dispatch(getTagsFetch(nonCachedTags));
        }
    };
};

function getPageTagIDs() {
    return async (dispatch, getState) => {
        dispatch(setTagsPaginationInfo({ totalItems: 0, currentPageTagIDs: [] }));

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

        if (isFetchingTags(state)) {
            return;
        }

        try {
            dispatch(setTagsPaginationInfo({ currentPage: currentPage }));
            dispatch(setTagsFetch(true, ""));
            await dispatch(getPageTagIDs());
            await dispatch(getNonCachedTags(getState().tagsUI.paginationInfo.currentPageTagIDs));
            dispatch(setTagsFetch(false, ""));
        }
        catch(error) {
            dispatch(setTagsFetch(false, error.message));
        }
    };
};

export function setTagsPaginationInfoAndFetchPage(paginationInfo){
    return async (dispatch, getState) => {
        paginationInfo.currentPage = 1;
        dispatch(setTagsPaginationInfo(paginationInfo));
        dispatch(pageFetch(paginationInfo.currentPage));
    };
}

export function onDeleteFetch() {
    return async (dispatch, getState) => {
        // Hide delete dialog
        dispatch(setShowDeleteDialogTags(false));

        // Exit if already fetching
        let state = getState();

        if (isFetchingTags(state)) {
            return;
        }
        
        try {
            // Update fetch status
            dispatch(setTagsFetch(true, ""));

            // Fetch tag data and handle response
            let payload = JSON.stringify({ 
                tag_ids: state.tagsUI.selectedTagIDs
            });

            let response = await fetch(`${backendURL}/tags/delete`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: payload
            });

            let deleteFromState = true;
            let error = "";

            switch (response.status) {
                case 200:
                    break;
                case 400:
                    error = (await response.json())._error;
                    deleteFromState = false;
                    break;
                case 404:
                    // error = "Tags not found.";
                    break;
                case 500:
                    error = await response.text();
                    deleteFromState = false;
                    break;
            }

            if (deleteFromState) {
                dispatch(setTagsPaginationInfo({ currentPageTagIDs: state.tagsUI.paginationInfo.currentPageTagIDs.filter(id => !state.tagsUI.selectedTagIDs.includes(id)) }));  // delete from current page
                dispatch(deleteTags(state.tagsUI.selectedTagIDs));  // delete from tag storage
                dispatch(clearSelectedTags());    // clear tag selection
            }
            dispatch(setTagsFetch(false, error));
        } catch (error) {
            dispatch(setTagsFetch(false, error.message));
        }
    };
};
