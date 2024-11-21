import { clearObjectsListTagUpdates, setObjectsListPaginationInfo, setObjectsListTagsFilter, setObjectsListTagsInput } from "../../reducers/ui/objects-list";
import { objectsListPageFetch } from "../ui-objects-list";

import type { Dispatch, GetState } from "../../util/types/common";
import type { ObjectsListPaginationInfo } from "../../store/types/ui/objects-list";


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
