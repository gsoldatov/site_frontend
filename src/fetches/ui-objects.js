import config from "../config";

import { runFetch, getErrorFromResponse, responseHasError } from "./common";
import { viewObjectsFetch, deleteObjectsFetch } from "./data-objects";
import { tagsSearchFetch, objectsTagsUpdateFetch } from "./data-tags";

import { setObjectsFetch, setObjectsPaginationInfo, setObjectsTagsInput, setCurrentObjectsTags, 
        setShowDeleteDialogObjects, setTagsFilterInput, setTagsFilter } from "../actions/objects";

import { isFetchingObjects } from "../store/state-util/ui-objects";


const backendURL = config.backendURL;


// On load UI reset & current page fetch
export const objectsOnLoadFetch = () => {
    return async (dispatch, getState) => {
        const currentPage = getState().objectsUI.paginationInfo.currentPage;
        dispatch(setObjectsTagsInput({ isDisplayed: false, inputText: "", matchingIDs: [] }));
        dispatch(setCurrentObjectsTags({ added: [], removed: [] }));
        dispatch(pageFetch(currentPage));
    };
};


// Updates pagination info, resets current displayed page to 1 and fetches objects to display on it.
export const setObjectsPaginationInfoAndFetchPage = paginationInfo => {
    return async (dispatch, getState) => {
        paginationInfo.currentPage = 1;
        dispatch(setObjectsPaginationInfo(paginationInfo));
        dispatch(pageFetch(paginationInfo.currentPage));
    };
};


// Updates tags filter for displayed objects, resets current displayed page to 1 and fetches objects to display on it.
export const setTagsFilterAndFetchPage = tagID => {
    return async (dispatch, getState) => {
        dispatch(setObjectsPaginationInfo({ currentPage: 1 }));
        dispatch(setTagsFilter(tagID));
        dispatch(pageFetch(1));
    };
};


// Fetches objects to display on provided `currentPage`.
export const pageFetch = currentPage => {
    return async (dispatch, getState) => {
        const state = getState();
        if (isFetchingObjects(state)) return;

        dispatch(setObjectsPaginationInfo({ currentPage: currentPage }));
        dispatch(setObjectsFetch(true, ""));

        let result = await dispatch(getPageObjectIDs());   // Fetch IDs of objects to display on the page
        if (responseHasError(result)) dispatch(setObjectsFetch(false, result.error));
        else {  // Fetch missing object data
            let nonCachedObjects = getState().objectsUI.paginationInfo.currentPageObjectIDs.filter(object_id => !(object_id in state.objects));
            if (nonCachedObjects.length !== 0) {
                result = await dispatch(viewObjectsFetch(nonCachedObjects));
                dispatch(setObjectsFetch(false, responseHasError(result) ? result.error : ""));
            } else dispatch(setObjectsFetch(false, ""));
        }
    };
};


// Fetches backend and sets object IDs of the current page based on the current pagination info settings.
const getPageObjectIDs = () => {
    return async (dispatch, getState) => {
        const pI = getState().objectsUI.paginationInfo;
        let response = await runFetch(`${backendURL}/objects/get_page_object_ids`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                pagination_info: {
                    page: pI.currentPage,
                    items_per_page: pI.itemsPerPage,
                    order_by: pI.sortField,
                    sort_order: pI.sortOrder,
                    filter_text: pI.filterText,
                    object_types: pI.objectTypes,
                    tags_filter: pI.tagsFilter
                }
            })
        });
        if (responseHasError(response)) return response;  // return error message in case of network error

        switch (response.status) {
            case 200:
                let json = await response.json();
                dispatch(setObjectsPaginationInfo({ totalItems: json["total_items"], currentPageObjectIDs: json["object_ids"] }));
            case 400:
            case 404:
            case 500:
                return await getErrorFromResponse(response);
        }
    };
}


// Delete selected objects from state and stop displaying them on the current page.
export const onDeleteFetch = () => {
    return async (dispatch, getState) => {
        // Exit if already fetching
        let state = getState();
        if (isFetchingObjects(state)) return;

        // Hide delete dialog
        dispatch(setShowDeleteDialogObjects(false));

        // Run view fetch & delete objects data
        dispatch(setObjectsFetch(true, ""));
        const result = await dispatch(deleteObjectsFetch(state.objectsUI.selectedObjectIDs));
        if (!responseHasError(result)) {
            dispatch(setObjectsPaginationInfo({ currentPageObjectIDs: state.objectsUI.paginationInfo.currentPageObjectIDs.filter(id => !result.includes(id)) }));  // delete from current page
            dispatch(setObjectsFetch(false, ""));
        } else {
            dispatch(setObjectsFetch(false, result.error));
        }
    };
};


// Thunk creator for fetching tags which match the value returned by `inputTextSelector` and updating the state with `actionCreator`.
const dropdownFetchThunkCreatorCreator = (actionCreator, inputTextSelector) => {
    return ({queryText, existingIDs}) => {
        return async (dispatch, getState) => {
            // Check params
            const inputText = inputTextSelector(getState());
            if (inputText.length === 0) {   // exit fetch if an item was added before the start of the fetch
                dispatch(actionCreator({ matchingIDs: [] }));
                return;
            }

            // Run fetch & update matching tags
            const result = await dispatch(tagsSearchFetch({queryText, existingIDs}));

            if (!responseHasError(result)) {
                // Update matching tags if input text didn't change during fetch
                if (inputText === inputTextSelector(getState())) dispatch(actionCreator({ matchingIDs: result }));
            }
        };
    }
};


// Thunks for fetching tags created by `dropdownFetchThunkCreatorCreator`
export const objectsTagsDropdownFetch = dropdownFetchThunkCreatorCreator(setObjectsTagsInput, state => state.objectsUI.tagsInput.inputText);
export const tagsFilterDropdownFetch = dropdownFetchThunkCreatorCreator(setTagsFilterInput, state => state.objectsUI.tagsFilterInput.inputText);


// Handles `Update Tags` button click
export function onObjectsTagsUpdateFetch() {
    return async (dispatch, getState) => {
        // Exit if already fetching data
        let state = getState();
        if (isFetchingObjects(state)) return;

        // Reset tag input
        dispatch(setObjectsTagsInput({ isDisplayed: false, inputText: "", matchingIDs: [] }));

        // Run fetch
        dispatch(setObjectsFetch(true, ""));
        const objUI = state.objectsUI;
        const result = await dispatch(objectsTagsUpdateFetch(objUI.selectedObjectIDs, objUI.addedTags, objUI.removedTagIDs));

        if (!responseHasError(result)) {
            // Reset added & removed tags
            dispatch(setCurrentObjectsTags({ added: [], removed: [] }));
            dispatch(setObjectsFetch(false, ""));
        } else
            dispatch(setObjectsFetch(false, result.error));
    };
};