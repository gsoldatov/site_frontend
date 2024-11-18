import type { State } from "../../store/types/state"
import { objectsListUI, type ObjectsListFetch, type ObjectsListPaginationInfo } from "../../store/types/ui/objects-list"


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/** Partially updates `state.objectsUI.fetch`. */
export const setObjectsListFetch = (fetch: Partial<ObjectsListFetch>) => ({ type: "SET_OBJECTS_LIST_FETCH", fetch });

const _setObjectsListFetch = (state: State, action: { fetch: Partial<ObjectsListFetch> }): State => {
    const fetch = { ...state.objectsListUI.fetch, ...action.fetch };
    return { ...state, objectsListUI: { ...state.objectsListUI, fetch }};
};


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/** Partially updates `state.objectsUI.paginationInfo`. */
export const setObjectsListPaginationInfo = (paginationInfo: Partial<ObjectsListPaginationInfo>) => ({ type: "SET_OBJECTS_LIST_PAGINATION_INFO", paginationInfo });

const _setObjectsListPaginationInfo = (state: State, action: { paginationInfo: Partial<ObjectsListPaginationInfo> }): State => {
    const paginationInfo = { ...state.objectsListUI.paginationInfo, ...action.paginationInfo };
    return { ...state, objectsListUI: { ...state.objectsListUI, paginationInfo }};
};


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**
 * Toggles presence of a `tagID` in state.objectsListUI.paginationInfo.tagsFilter.
 * 
 * If `tagIDs` is omitted or set to `undefined`, clears the list.
 */
export const setObjectsListTagsFilter = (tagID: number | undefined = undefined) => ({ type: "SET_OBJECTS_LIST_TAGS_FILTER", tagID });

const _setObjectsListTagsFilter = (state: State, action: { tagID: number | undefined }) => {
    const { tagID } = action;
    const oldTagsFilter = state.objectsListUI.paginationInfo.tagsFilter;
    const tagsFilter = 
        tagID === undefined
        ? []    // reset case

        : oldTagsFilter.includes(tagID)
        ? oldTagsFilter.filter(id => id !== tagID)  // remove existing
        : oldTagsFilter.concat([tagID])     // add non-existing
    ;

    return { 
        ...state,
        objectsListUI: {
            ...state.objectsListUI,
            paginationInfo: {
                ...state.objectsListUI.paginationInfo,
                tagsFilter
            }
        }
    };
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


export const objectsListRoot = {
    "SET_OBJECTS_LIST_FETCH": _setObjectsListFetch,
    "SET_OBJECTS_LIST_PAGINATION_INFO": _setObjectsListPaginationInfo,
    "SET_OBJECTS_LIST_TAGS_FILTER": _setObjectsListTagsFilter
};
