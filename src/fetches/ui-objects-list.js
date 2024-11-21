import { objectsGetPageObjectIDs, objectsViewFetch, objectsDeleteFetch } from "./data/objects";
import { objectsTagsUpdateFetch } from "./data/objects-tags";
import { tagsSearchFetch } from "./data/tags";

import {
    setObjectsListFetch, setObjectsListPaginationInfo, setObjectsListTagsFilter, setObjectsListTagsFilterInput,
    setObjectsListTagsInput, setShowDeleteDialogObjects, clearObjectsListTagUpdates
} from "../reducers/ui/objects-list";

import { ObjectsListSelectors } from "../store/selectors/ui/objects-list";




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
        dispatch(setObjectsListFetch({ isFetching: true, fetchError: "" }));
        const { selectedObjectIDs } = state.objectsListUI;
        const result = await dispatch(objectsDeleteFetch(selectedObjectIDs, deleteSubobjects));

        // Handle fetch errors
        if (result.failed) {
            dispatch(setObjectsListFetch({ isFetching: false, fetchError: result.error }));
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
        dispatch(setObjectsListFetch({ isFetching: true, fetchError: "" }));
        const objUI = state.objectsListUI;
        const result = await dispatch(objectsTagsUpdateFetch(objUI.selectedObjectIDs, objUI.addedTags, objUI.removedTagIDs));

        // Handle fetch errors
        if (result.failed) {
            dispatch(setObjectsListFetch({ isFetching: false, fetchError: result.error }));
            return;
        }

        // Handle successful fetch end
        // Reset added & removed tags
        dispatch(clearObjectsListTagUpdates());
        dispatch(setObjectsListFetch({ isFetching: false, fetchError: "" }));
    };
};
