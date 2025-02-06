import type { State } from "../../types/store/state";
import type { TagsListPaginationInfo, TagsListFetch } from "../../types/store/ui/tags-list";


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/** Sets fetch state of the /tags/list page. */
export const setTagsListFetch = (fetch: Partial<TagsListFetch>) => ({ type: "SET_TAGS_LIST_FETCH", fetch });

const _setTagsListFetch = (state: State, action: { fetch: Partial<TagsListFetch> }): State => {
    const fetch = { ...state.tagsListUI.fetch, ...action.fetch };
    return { ...state, tagsListUI: { ...state.tagsListUI, fetch }};
};


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/** Updates state.tagsList.pagigationInfo */
export const setTagsListPaginationInfo = (paginationInfo: Partial<TagsListPaginationInfo>) => ({ type: "SET_TAGS_LIST_PAGINATION_INFO", paginationInfo: paginationInfo });

const _setTagsListPaginationInfo = (state: State, action: { paginationInfo: Partial<TagsListPaginationInfo> }): State => {
    const paginationInfo = { ...state.tagsListUI.paginationInfo, ...action.paginationInfo };
    return { ...state, tagsListUI: { ...state.tagsListUI, paginationInfo }};
};


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/** Sets display of delete dialog on the /tags/list page. */
export const setTagsListShowDeleteDialog = (showDeleteDialog: boolean) => ({ type: "SET_TAGS_LIST_SHOW_DELETE_DIALOG", showDeleteDialog });

const _setTagsListShowDeleteDialog = (state: State, action: { showDeleteDialog: boolean }): State => {
    const { showDeleteDialog } = action;
    return { ...state, tagsListUI: { ...state.tagsListUI, showDeleteDialog }};
};


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/** Selects tags with ids listed in `tag_ids` on the /tags/list page. */
export const selectTags = (tag_ids: number[]) => ({ type: "SELECT_TAGS", tag_ids });

const _selectTags = (state: State, action: { tag_ids: number[] }): State => {
    const selectedTagIDs = [...(new Set(state.tagsListUI.selectedTagIDs.concat(action.tag_ids)))];
    return { ...state, tagsListUI: { ...state.tagsListUI, selectedTagIDs }};
};


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/** Toggles the selection of a tag with `tag_id` on the /tags/list page. */
export const toggleTagSelection = (tag_id: number) => ({ type: "TOGGLE_TAG_SELECTION", tag_id: tag_id });

const _toggleTagSelection = (state: State, action: { tag_id: number }): State => {
    const { selectedTagIDs } = state.tagsListUI;
    return {
        ...state,
        tagsListUI: {
            ...state.tagsListUI,
            selectedTagIDs: selectedTagIDs.includes(action.tag_id) 
                            ? selectedTagIDs.filter(tag_id => tag_id !== action.tag_id)
                            : selectedTagIDs.concat(action.tag_id)
        }
    };
};


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/** Deselects tags with ids listed in `tag_ids` on the /tags/list page. */
export const deselectTags = (tag_ids: number[]) => ({ type: "DESELECT_TAGS", tag_ids });

const _deselectTags = (state: State, action: { tag_ids: number[] }): State => {
    const selectedTagIDs = state.tagsListUI.selectedTagIDs.filter(tag_id => !action.tag_ids.includes(tag_id));
    return { ...state, tagsListUI: { ...state.tagsListUI, selectedTagIDs }};
};


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/** Clears tag selection on the /tags/list page. */
export const clearSelectedTags = () => ({ type: "CLEAR_SELECTED_TAGS" });

const _clearSelectedTags = (state: State, action: any): State => {
    return { ...state, tagsListUI: { ...state.tagsListUI, selectedTagIDs: [] }};
};


export const tagsListRoot = {
    "SET_TAGS_LIST_FETCH": _setTagsListFetch,
    "SET_TAGS_LIST_PAGINATION_INFO": _setTagsListPaginationInfo,
    "SET_TAGS_LIST_SHOW_DELETE_DIALOG": _setTagsListShowDeleteDialog,
    "SELECT_TAGS": _selectTags,
    "TOGGLE_TAG_SELECTION": _toggleTagSelection,
    "DESELECT_TAGS": _deselectTags,
    "CLEAR_SELECTED_TAGS": _clearSelectedTags
};
