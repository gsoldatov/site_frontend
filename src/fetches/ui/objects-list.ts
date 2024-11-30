import { objectsViewFetch, objectsDeleteFetch, objectsGetPageObjectIDs } from "../data/objects";
import { objectsTagsUpdateFetch } from "../data/objects-tags";
import { tagsSearchFetch } from "../data/tags";

import { clearObjectsListTagUpdates, setObjectsListPaginationInfo, setObjectsListTagsFilter, setObjectsListTagsInput,
    setObjectsListFetch, setObjectsListShowDeleteDialog, setObjectsListTagsFilterInput,
} from "../../reducers/ui/objects-list";

import { ObjectsListSelectors } from "../../store/selectors/ui/objects-list";

import type { State } from "../../store/types/state";
import type { Dispatch, GetState } from "../../store/types/store";
import type { ObjectsListPaginationInfo } from "../../store/types/ui/objects-list";
import type { ObjectsListTagsInput } from "../../store/types/ui/objects-list";


/**
 * On load UI reset & current page fetch.
 */
export const objectsListOnLoadFetch = () => {
    return async (dispatch: Dispatch, getState: GetState): Promise<void> => {
        const currentPage = getState().objectsListUI.paginationInfo.currentPage;
        dispatch(setObjectsListTagsInput({ isDisplayed: false, inputText: "", matchingIDs: [] }));
        dispatch(clearObjectsListTagUpdates());
        dispatch(objectsListPageFetch(currentPage));
    };
};


/**
 * Updates `state.objectsListUI.paginationInfo`, resets current displayed page to 1 and fetches objects to display on it.
 */
export const setObjectsListPaginationInfoAndFetchPage = (paginationInfo: ObjectsListPaginationInfo) => {
    return async (dispatch: Dispatch, getState: GetState): Promise<void> => {
        paginationInfo.currentPage = 1;
        dispatch(setObjectsListPaginationInfo(paginationInfo));
        dispatch(objectsListPageFetch(paginationInfo.currentPage));
    };
};


/**
 * Updates tags filter for displayed objects, resets current displayed page to 1 and fetches objects to display on it.
 */
export const setObjectsListTagsFilterAndFetchPage = (tagID: number) => {
    return async (dispatch: Dispatch, getState: GetState): Promise<void> => {
        dispatch(setObjectsListPaginationInfo({ currentPage: 1 }));
        dispatch(setObjectsListTagsFilter(tagID));
        dispatch(objectsListPageFetch(1));
    };
};


/**
 * Fetches objects to display on provided `currentPage`.
 */
export const objectsListPageFetch = (currentPage: number) => {
    return async (dispatch: Dispatch, getState: GetState): Promise<void> => {
        const state = getState();
        if (ObjectsListSelectors.isFetching(state)) return;

        dispatch(setObjectsListPaginationInfo({ currentPage }));
        dispatch(setObjectsListFetch({ isFetching: true, fetchError:"" }));
        const pI = getState().objectsListUI.paginationInfo;

        // Exit with error if filter text is too long
        if (pI.filterText.length > 255) {
            dispatch(setObjectsListFetch({ isFetching: false, fetchError: "Object name filter text is too long." }));
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
            dispatch(setObjectsListFetch({ isFetching: false, fetchError: pageObjectIDsResult.error! }));
            return;
        }

        // If fetch is successful, update paginantion info and fetch missing object data
        if(!("total_items" in pageObjectIDsResult)) throw Error("Missing total_items in successful fetch result.");
        dispatch(setObjectsListPaginationInfo({ totalItems: pageObjectIDsResult.total_items, currentPageObjectIDs: pageObjectIDsResult.object_ids }));

        let nonCachedObjects = pageObjectIDsResult["object_ids"].filter(object_id => !(object_id in state.objects));
        if (nonCachedObjects.length !== 0) {
            const objectsViewResult = await dispatch(objectsViewFetch(nonCachedObjects));
            dispatch(setObjectsListFetch({ isFetching: false, fetchError: objectsViewResult.failed ? objectsViewResult.error! : "" }));
        } else dispatch(setObjectsListFetch({ isFetching: false, fetchError: "" }));
    };
};


/**
 * Delete selected objects from state and stop displaying them on the current page.
 * 
 * If `deleteSubobjects` is true, deleted all subobjects of selected composite objects.
 */
export const objectsListDeleteFetch = (deleteSubobjects?: boolean) => {
    return async (dispatch: Dispatch, getState: GetState): Promise<void> => {
        // Exit if already fetching
        let state = getState();
        if (ObjectsListSelectors.isFetching(state)) return;

        // Hide delete dialog
        dispatch(setObjectsListShowDeleteDialog(false));

        // Run view fetch & delete objects data
        dispatch(setObjectsListFetch({ isFetching: true, fetchError: "" }));
        const { selectedObjectIDs } = state.objectsListUI;
        const result = await dispatch(objectsDeleteFetch(selectedObjectIDs, deleteSubobjects!));

        // Handle fetch errors
        if (result.failed) {
            dispatch(setObjectsListFetch({ isFetching: false, fetchError: result.error! }));
            return;
        }

        // Handle successful fetch end
        dispatch(setObjectsListPaginationInfo({ currentPageObjectIDs: state.objectsListUI.paginationInfo.currentPageObjectIDs.filter(id => !selectedObjectIDs.includes(id)) }));  // delete from current page
        dispatch(setObjectsListFetch({ isFetching: false, fetchError: "" }));
    };
};


/**
 * Thunk creator for fetching tags which match the value returned by `inputTextSelector` and updating the state with `actionCreator`.
 */
const dropdownFetchThunkCreatorCreator = (actionCreator: (params: Partial<ObjectsListTagsInput>) => any, inputTextSelector: (state: State) => string) => {
    return (queryText: string, existingIDs: number[]) => {
        return async (dispatch: Dispatch, getState: GetState): Promise<void> => {
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
                if (inputText === inputTextSelector(getState())) dispatch(actionCreator({ matchingIDs: result.tagIDs }));
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
    return async (dispatch: Dispatch, getState: GetState): Promise<void> => {
        // Exit if already fetching data
        let state = getState();
        if (ObjectsListSelectors.isFetching(state)) return;

        // Reset tag input
        dispatch(setObjectsListTagsInput({ isDisplayed: false, inputText: "", matchingIDs: [] }));

        // Run fetch
        dispatch(setObjectsListFetch({ isFetching: true, fetchError: "" }));
        const objUI = state.objectsListUI;
        const result = await dispatch(objectsTagsUpdateFetch(objUI.selectedObjectIDs, objUI.addedTags, objUI.removedTagIDs));

        // Handle fetch errors
        if (result.failed) {
            dispatch(setObjectsListFetch({ isFetching: false, fetchError: result.error! }));
            return;
        }

        // Reset added & removed tags
        dispatch(clearObjectsListTagUpdates());
        dispatch(setObjectsListFetch({ isFetching: false, fetchError: "" }));
    };
};
