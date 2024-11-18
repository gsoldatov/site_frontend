import type { State } from "../../store/types/state"
import { 
    type ObjectsListFetch, type ObjectsListPaginationInfo, type ObjectsListTagsFilterInput, type ObjectsListTagsInput
} from "../../store/types/ui/objects-list"


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
};


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/** Partially updates state.objectsListUI.tagsFilterInput */
export const setObjectsListTagsFilterInput = (tagsFilterInput: Partial<ObjectsListTagsFilterInput>)  => ({ type: "SET_OBJECTS_LIST_TAGS_FILTER_INPUT", tagsFilterInput });

const _setObjectsListTagsFilterInput = (state: State, action: { tagsFilterInput: Partial<ObjectsListTagsFilterInput> }): State => {
    const tagsFilterInput = { ...state.objectsListUI.tagsFilterInput, ...action.tagsFilterInput };
    return { ...state, objectsListUI: { ...state.objectsListUI, tagsFilterInput }};
};


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/** Partially updates state.objectsListUI.tagsInput */
export const setObjectsListTagsInput = (tagsInput: Partial<ObjectsListTagsInput>) => ({ type: "SET_OBJECTS_LIST_TAGS_INPUT", tagsInput });

const _setObjectsListTagsInput = (state: State, action: { tagsInput: Partial<ObjectsListTagsInput> }): State => {
    const tagsInput = { ...state.objectsListUI.tagsInput, ...action.tagsInput };
    return { ...state, objectsListUI: { ...state.objectsListUI, tagsInput }};
};


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/** Sets /objects/list page delete dialog display. */
export const setShowDeleteDialogObjects = (showDeleteDialog: boolean) => ({ type: "SET_OBJECTS_LIST_SHOW_DELETE_DIALOG", showDeleteDialog });

const _setShowDeleteDialogObjects = (state: State, action: { showDeleteDialog: boolean }): State => {
    return { ...state, objectsListUI: { ...state.objectsListUI, showDeleteDialog: action.showDeleteDialog }};
};


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/** Clears selected objects and closes delete dialog on the /objects/list page. */
export const clearSelectedObjects = () => ({ type: "CLEAR_SELECTED_OBJECTS" });

const _clearSelectedObjects = (state: State, action: any): State => {
    return {
        ...state,
        objectsListUI: {
            ...state.objectsListUI,
            selectedObjectIDs: [],
            showDeleteDialog: false
        }
    };
};


export const objectsListRoot = {
    "SET_OBJECTS_LIST_FETCH": _setObjectsListFetch,
    "SET_OBJECTS_LIST_PAGINATION_INFO": _setObjectsListPaginationInfo,
    "SET_OBJECTS_LIST_TAGS_FILTER": _setObjectsListTagsFilter,
    "SET_OBJECTS_LIST_TAGS_FILTER_INPUT": _setObjectsListTagsFilterInput,
    "SET_OBJECTS_LIST_TAGS_INPUT": _setObjectsListTagsInput,
    "SET_OBJECTS_LIST_SHOW_DELETE_DIALOG": _setShowDeleteDialogObjects,
    // "SET_OBJECTS_LIST_CURRENT_TAGS": _setObjectsListCurrentTags,
    // "SELECT_OBJECTS": _selectObjects,
    // "TOGGLE_OBJECT_SELECTION": _toggleObjectSelection,
    "CLEAR_SELECTED_OBJECTS": _clearSelectedObjects
};
