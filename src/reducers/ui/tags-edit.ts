// import { getDefaultCurrentTagState } from "../../store/state-templates/tags";
import { getCurrentTagState } from "../../store/types/ui/tags-edit";

import type { State } from "../../store/types/state";
import type { CurrentTag, TagsEditOnLoadFetch, TagsEditOnSaveFetch } from "../../store/types/ui/tags-edit";
// import type { TagsListPaginationInfo, TagsListFetch } from "../../store/types/ui/tags-list";


/** Sets default state of a /tags/edit/:id page for a new tag. */
export const loadNewTagPage = () => ({ type: "LOAD_ADD_TAG_PAGE" });

const _loadNewTagPage = (state: State, action: any): State => {
    return {
        ...state,
        tagsEditUI: {
            ...state.tagsEditUI,
            currentTag: getCurrentTagState(),
            tagOnLoadFetch: { isFetching: false, fetchError: "" },
            tagOnSaveFetch: { isFetching: false, fetchError: ""}
        }
    };
}

/** Sets default state of a /tags/edit/:id page for an existing tag. */
export const loadEditTagPage = () => ({ type: "LOAD_EDIT_TAG_PAGE" });

const _loadEditTagPage = (state: State, action: any): State => {
    return {
        ...state,
        tagsEditUI: {
            ...state.tagsEditUI,
            currentTag: getCurrentTagState(),
            tagOnLoadFetch: { isFetching: false, fetchError: "" },
            tagOnSaveFetch: { isFetching: false, fetchError: "" },
            showDeleteDialog: false
        }
    };
}

/** Updates state.tagsEditUI.currentTags with values from `tag`. */
export const setCurrentTag = (tag: Partial<CurrentTag>) => ({ type: "SET_CURRENT_TAG", tag });

const _setCurrentTag = (state: State, action: { tag: Partial<CurrentTag> }): State => {
    const currentTag = { ...state.tagsEditUI.currentTag, ...action.tag };
    return { ...state, tagsEditUI: { ...state.tagsEditUI, currentTag }};
}


/** Sets display flag for /tags/edit/:id page delete dialog. */
export const setShowDeleteDialogTag = (showDeleteDialog: boolean) => ({ type: "SET_SHOW_DELETE_DIALOG_TAG", showDeleteDialog });

const _setShowDeleteDialogTag = (state: State, action: { showDeleteDialog: boolean }): State => {
    const { showDeleteDialog } = action;
    return { ...state, tagsEditUI: { ...state.tagsEditUI, showDeleteDialog }};
}


/** Sets /tags/edit/:id on load fetch state. */
export const setTagOnLoadFetchState = (isFetching = false, fetchError = "") => ({ type: "SET_TAG_ON_LOAD_FETCH_STATE", isFetching, fetchError });

const _setTagOnLoadFetchState = (state: State, action: { isFetching: boolean, fetchError: string }): State => {
    const tagOnLoadFetch = { ...state.tagsEditUI.tagOnLoadFetch, isFetching: action.isFetching, fetchError: action.fetchError };
    return { ...state, tagsEditUI: { ...state.tagsEditUI, tagOnLoadFetch }};
}

/** Sets /tags/edit/:id on save fetch state. */
export const setTagOnSaveFetchState = (isFetching = false, fetchError = "") => ({ type: "SET_TAG_ON_SAVE_FETCH_STATE", isFetching, fetchError });

const _setTagOnSaveFetchState = (state: State, action: { isFetching: boolean, fetchError: string }): State => {
    const tagOnSaveFetch = { ...state.tagsEditUI.tagOnLoadFetch, isFetching: action.isFetching, fetchError: action.fetchError };
    return { ...state, tagsEditUI: { ...state.tagsEditUI, tagOnSaveFetch }};
}


export const tagsEditRoot = {
    "LOAD_ADD_TAG_PAGE": _loadNewTagPage,
    "LOAD_EDIT_TAG_PAGE": _loadEditTagPage,
    "SET_CURRENT_TAG": _setCurrentTag,
    "SET_TAG_ON_LOAD_FETCH_STATE": _setTagOnLoadFetchState,
    "SET_TAG_ON_SAVE_FETCH_STATE": _setTagOnSaveFetchState,
    "SET_SHOW_DELETE_DIALOG_TAG": _setShowDeleteDialogTag
};

/**
 * TODO
 * - rename loadNewTagPage
 * - rename loadEditTagPage
 * - rename tagOnLoadFetch
 * - rename tagOnSaveFetch
 * - rename setShowDeleteDialogTag
 * - rename setTagOnLoadFetchState & make it use a single argument without default values
 * - rename setTagOnSaveFetchState & make it use a single argument without default values
 * - remove usage of state-util/tags;
 */