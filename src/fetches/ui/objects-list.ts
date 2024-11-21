import { clearObjectsListTagUpdates, setObjectsListTagsInput } from "../../reducers/ui/objects-list";
import type { Dispatch, GetState } from "../../util/types/common";
import { objectsListPageFetch } from "../ui-objects-list";


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