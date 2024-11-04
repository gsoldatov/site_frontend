import { getResponseErrorType } from "./common";
import { viewObjectsFetch, deleteObjectsFetch, getPageObjectIDs } from "./data-objects";
import { tagsSearchFetch, objectsTagsUpdateFetch } from "./data-tags";

import { setObjectsFetch, setObjectsPaginationInfo, setObjectsTagsInput, setCurrentObjectsTags, 
        setShowDeleteDialogObjects, setTagsFilterInput, setTagsFilter } from "../actions/objects-list";

import { isFetchingObjects } from "../store/state-util/ui-objects-list";

import { enumResponseErrorType } from "../util/enums/enum-response-error-type";


/**
 * On load UI reset & current page fetch.
 */
export const objectsOnLoadFetch = () => {
    return async (dispatch, getState) => {
        const currentPage = getState().objectsListUI.paginationInfo.currentPage;
        dispatch(setObjectsTagsInput({ isDisplayed: false, inputText: "", matchingIDs: [] }));
        dispatch(setCurrentObjectsTags({ added: [], removed: [] }));
        dispatch(pageFetch(currentPage));
    };
};


/**
 * Updates `state.objectsListUI.paginationInfo`, resets current displayed page to 1 and fetches objects to display on it.
 */
export const setObjectsPaginationInfoAndFetchPage = paginationInfo => {
    return async (dispatch, getState) => {
        paginationInfo.currentPage = 1;
        dispatch(setObjectsPaginationInfo(paginationInfo));
        dispatch(pageFetch(paginationInfo.currentPage));
    };
};


/**
 * Updates tags filter for displayed objects, resets current displayed page to 1 and fetches objects to display on it.
 */
export const setTagsFilterAndFetchPage = tagID => {
    return async (dispatch, getState) => {
        dispatch(setObjectsPaginationInfo({ currentPage: 1 }));
        dispatch(setTagsFilter(tagID));
        dispatch(pageFetch(1));
    };
};


/**
 * Fetches objects to display on provided `currentPage`.
 */
export const pageFetch = currentPage => {
    return async (dispatch, getState) => {
        const state = getState();
        if (isFetchingObjects(state)) return;

        dispatch(setObjectsPaginationInfo({ currentPage }));
        dispatch(setObjectsFetch(true, ""));
        const pI = getState().objectsListUI.paginationInfo;

        // Exit with error if filter text is too long
        if (pI.filterText.length > 255) {
            dispatch(setObjectsFetch(false, "Object name filter text is too long."));
            return;
        }

        // Fetch IDs of objects to display on the page
        let result = await dispatch(getPageObjectIDs({
            page: pI.currentPage,
            items_per_page: pI.itemsPerPage,
            order_by: pI.sortField,
            sort_order: pI.sortOrder,
            filter_text: pI.filterText,
            object_types: pI.objectTypes,
            tags_filter: pI.tagsFilter
        }));

        // Handle fetch errors
        const responseErrorType = getResponseErrorType(result);
        if (responseErrorType > enumResponseErrorType.none) {
            const errorMessage = responseErrorType === enumResponseErrorType.general ? result.error : "";
            dispatch(setObjectsFetch(false, errorMessage));
            return;
        }

        // Is fetch is successful, update paginantion info and fetch missing object data
        dispatch(setObjectsPaginationInfo({ totalItems: result["total_items"], currentPageObjectIDs: result["object_ids"] }));

        let nonCachedObjects = result["object_ids"].filter(object_id => !(object_id in state.objects));
        if (nonCachedObjects.length !== 0) {
            result = await dispatch(viewObjectsFetch(nonCachedObjects));
            dispatch(setObjectsFetch(false, getResponseErrorType(result) === enumResponseErrorType.general ? result.error : ""));
        } else dispatch(setObjectsFetch(false, ""));
    };
};


/**
 * Delete selected objects from state and stop displaying them on the current page.
 * 
 * If `deleteSubobjects` is true, deleted all subobjects of selected composite objects.
 */
export const onDeleteFetch = deleteSubobjects => {
    return async (dispatch, getState) => {
        // Exit if already fetching
        let state = getState();
        if (isFetchingObjects(state)) return;

        // Hide delete dialog
        dispatch(setShowDeleteDialogObjects(false));

        // Run view fetch & delete objects data
        dispatch(setObjectsFetch(true, ""));
        const result = await dispatch(deleteObjectsFetch(state.objectsListUI.selectedObjectIDs, deleteSubobjects));

        // Handle fetch errors
        const responseErrorType = getResponseErrorType(result);
        if (responseErrorType > enumResponseErrorType.none) {
            const errorMessage = responseErrorType === enumResponseErrorType.general ? result.error : "";
            dispatch(setObjectsFetch(false, errorMessage));
            return;
        }

        // Handle successful fetch end
        dispatch(setObjectsPaginationInfo({ currentPageObjectIDs: state.objectsListUI.paginationInfo.currentPageObjectIDs.filter(id => !result.includes(id)) }));  // delete from current page
        dispatch(setObjectsFetch(false, ""));
    };
};


/**
 * Thunk creator for fetching tags which match the value returned by `inputTextSelector` and updating the state with `actionCreator`.
 */
const dropdownFetchThunkCreatorCreator = (actionCreator, inputTextSelector) => {
    return ({queryText, existingIDs}) => {
        return async (dispatch, getState) => {
            // Input text at the start of the query
            const inputText = inputTextSelector(getState());

            // Run fetch & update matching tags
            const result = await dispatch(tagsSearchFetch({queryText, existingIDs}));

            if (getResponseErrorType(result) === enumResponseErrorType.none) {
                // Reset matching IDs if an item was added before the fetch start
                if (inputText.length === 0) {
                    dispatch(actionCreator({ matchingIDs: [] }));
                    return;
                }

                // Update matching tags if input text didn't change during fetch
                if (inputText === inputTextSelector(getState())) dispatch(actionCreator({ matchingIDs: result }));
            }
        };
    }
};


// Thunks for fetching tags created by `dropdownFetchThunkCreatorCreator`
export const objectsTagsDropdownFetch = dropdownFetchThunkCreatorCreator(setObjectsTagsInput, state => state.objectsListUI.tagsInput.inputText);
export const tagsFilterDropdownFetch = dropdownFetchThunkCreatorCreator(setTagsFilterInput, state => state.objectsListUI.tagsFilterInput.inputText);


/**
 * Handles "Update Tags" button click.
 */
export function onObjectsTagsUpdateFetch() {
    return async (dispatch, getState) => {
        // Exit if already fetching data
        let state = getState();
        if (isFetchingObjects(state)) return;

        // Reset tag input
        dispatch(setObjectsTagsInput({ isDisplayed: false, inputText: "", matchingIDs: [] }));

        // Run fetch
        dispatch(setObjectsFetch(true, ""));
        const objUI = state.objectsListUI;
        const result = await dispatch(objectsTagsUpdateFetch(objUI.selectedObjectIDs, objUI.addedTags, objUI.removedTagIDs));

        // Handle fetch errors
        const responseErrorType = getResponseErrorType(result);
        if (responseErrorType > enumResponseErrorType.none) {
            const errorMessage = responseErrorType === enumResponseErrorType.general ? result.error : "";
            dispatch(setObjectsFetch(false, errorMessage));
            return;
        }

        // Handle successful fetch end
        // Reset added & removed tags
        dispatch(setCurrentObjectsTags({ added: [], removed: [] }));
        dispatch(setObjectsFetch(false, ""));
    };
};
