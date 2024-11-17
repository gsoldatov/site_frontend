import { getResponseErrorType } from "./common";
import { objectsGetPageObjectIDs, objectsViewFetch, objectsDeleteFetch } from "./data/objects";
import { objectsTagsUpdateFetch } from "./data/objects-tags";
import { tagsSearchFetch } from "./data/tags";

import { setObjectsListFetch, setObjectsListPaginationInfo, setObjectsListTagsInput, setObjectsListCurrentTags, 
        setShowDeleteDialogObjects, setObjectsListTagsFilterInput, setObjectsListTagsFilter } from "../actions/objects-list";

import { ObjectsListSelectors } from "../store/selectors/ui/objects-list";

import { enumResponseErrorType } from "../util/enums/enum-response-error-type";


/**
 * On load UI reset & current page fetch.
 */
export const objectsListOnLoadFetch = () => {
    return async (dispatch, getState) => {
        const currentPage = getState().objectsListUI.paginationInfo.currentPage;
        dispatch(setObjectsListTagsInput({ isDisplayed: false, inputText: "", matchingIDs: [] }));
        dispatch(setObjectsListCurrentTags({ added: [], removed: [] }));
        dispatch(objectsListPageFetch(currentPage));
    };
};


/**
 * Updates `state.objectsListUI.paginationInfo`, resets current displayed page to 1 and fetches objects to display on it.
 */
export const setObjectsListPaginationInfoAndFetchPage = paginationInfo => {
    return async (dispatch, getState) => {
        paginationInfo.currentPage = 1;
        dispatch(setObjectsListPaginationInfo(paginationInfo));
        dispatch(objectsListPageFetch(paginationInfo.currentPage));
    };
};


/**
 * Updates tags filter for displayed objects, resets current displayed page to 1 and fetches objects to display on it.
 */
export const setObjectsListTagsFilterAndFetchPage = tagID => {
    return async (dispatch, getState) => {
        dispatch(setObjectsListPaginationInfo({ currentPage: 1 }));
        dispatch(setObjectsListTagsFilter(tagID));
        dispatch(objectsListPageFetch(1));
    };
};


/**
 * Fetches objects to display on provided `currentPage`.
 */
export const objectsListPageFetch = currentPage => {
    return async (dispatch, getState) => {
        const state = getState();
        if (ObjectsListSelectors.isFetching(state)) return;

        dispatch(setObjectsListPaginationInfo({ currentPage }));
        dispatch(setObjectsListFetch(true, ""));
        const pI = getState().objectsListUI.paginationInfo;

        // Exit with error if filter text is too long
        if (pI.filterText.length > 255) {
            dispatch(setObjectsListFetch(false, "Object name filter text is too long."));
            return;
        }

        // Fetch IDs of objects to display on the page
        const pageObjectIDsResult = await dispatch(objectsGetPageObjectIDs({
            page: pI.currentPage,
            items_per_page: pI.itemsPerPage,
            order_by: pI.sortField,
            sort_order: pI.sortOrder,
            filter_text: pI.filterText,
            object_types: pI.objectTypes,
            tags_filter: pI.tagsFilter
        }));

        // Handle fetch errors
        if (pageObjectIDsResult.failed) {
            dispatch(setObjectsListFetch(false, pageObjectIDsResult.error));
            return;
        }

        // If fetch is successful, update paginantion info and fetch missing object data
        dispatch(setObjectsListPaginationInfo({ totalItems: pageObjectIDsResult["total_items"], currentPageObjectIDs: pageObjectIDsResult["object_ids"] }));

        let nonCachedObjects = pageObjectIDsResult["object_ids"].filter(object_id => !(object_id in state.objects));
        if (nonCachedObjects.length !== 0) {
            const objectsViewResult = await dispatch(objectsViewFetch(nonCachedObjects));
            dispatch(setObjectsListFetch(false, objectsViewResult.failed ? objectsViewResult.error : ""));
        } else dispatch(setObjectsListFetch(false, ""));
    };
};


/**
 * Delete selected objects from state and stop displaying them on the current page.
 * 
 * If `deleteSubobjects` is true, deleted all subobjects of selected composite objects.
 */
export const objectsListDeleteFetch = deleteSubobjects => {
    return async (dispatch, getState) => {
        // Exit if already fetching
        let state = getState();
        if (ObjectsListSelectors.isFetching(state)) return;

        // Hide delete dialog
        dispatch(setShowDeleteDialogObjects(false));

        // Run view fetch & delete objects data
        dispatch(setObjectsListFetch(true, ""));
        const { selectedObjectIDs } = state.objectsListUI;
        const result = await dispatch(objectsDeleteFetch(selectedObjectIDs, deleteSubobjects));

        // Handle fetch errors
        if (result.failed) {
            dispatch(setObjectsListFetch(false, result.error));
            return;
        }

        // Handle successful fetch end
        dispatch(setObjectsListPaginationInfo({ currentPageObjectIDs: state.objectsListUI.paginationInfo.currentPageObjectIDs.filter(id => !selectedObjectIDs.includes(id)) }));  // delete from current page
        dispatch(setObjectsListFetch(false, ""));
    };
};


/**
 * Thunk creator for fetching tags which match the value returned by `inputTextSelector` and updating the state with `actionCreator`.
 */
const dropdownFetchThunkCreatorCreator = (actionCreator, inputTextSelector) => {
    return (queryText, existingIDs) => {
        return async (dispatch, getState) => {
            // Input text at the start of the query
            const inputText = inputTextSelector(getState());

            // Run fetch & update matching tags
            const result = await dispatch(tagsSearchFetch(queryText, existingIDs));

            // Update matching tags if fetch finished
            if (result.tagIDs !== undefined) {
                // Reset matching IDs if an item was added before the fetch start
                if (inputText.length === 0) {
                    dispatch(actionCreator({ matchingIDs: [] }));
                    return;
                }

                // Update matching tags if input text didn't change during fetch
                const matchingIDs = result instanceof Array ? result : result.tagIDs;   // TODO fix to use the result structure when objects fetch is typed
                if (inputText === inputTextSelector(getState())) dispatch(actionCreator({ matchingIDs }));
            }
        };
    }
};


// Thunks for fetching tags created by `dropdownFetchThunkCreatorCreator`
export const objectsListTagsDropdownFetch = dropdownFetchThunkCreatorCreator(setObjectsListTagsInput, state => state.objectsListUI.tagsInput.inputText);
export const objectsListTagsFilterDropdownFetch = dropdownFetchThunkCreatorCreator(setObjectsListTagsFilterInput, state => state.objectsListUI.tagsFilterInput.inputText);


/**
 * Handles "Update Tags" button click.
 */
export function objectsListUpdateTagsFetch() {
    return async (dispatch, getState) => {
        // Exit if already fetching data
        let state = getState();
        if (ObjectsListSelectors.isFetching(state)) return;

        // Reset tag input
        dispatch(setObjectsListTagsInput({ isDisplayed: false, inputText: "", matchingIDs: [] }));

        // Run fetch
        dispatch(setObjectsListFetch(true, ""));
        const objUI = state.objectsListUI;
        const result = await dispatch(objectsTagsUpdateFetch(objUI.selectedObjectIDs, objUI.addedTags, objUI.removedTagIDs));

        // Handle fetch errors
        if (result.failed) {
            dispatch(setObjectsListFetch(false, result.error));
            return;
        }

        // Handle successful fetch end
        // Reset added & removed tags
        dispatch(setObjectsListCurrentTags({ added: [], removed: [] }));
        dispatch(setObjectsListFetch(false, ""));
    };
};
