import { getCurrentTagState } from "../../store/types/ui/tags-edit";

import type { State } from "../../store/types/state";
import type { CurrentTag, TagsEditOnLoadFetch, TagsEditOnSaveFetch } from "../../store/types/ui/tags-edit";


/** Sets default state of a /tags/edit/:id page for a new tag. */
export const loadTagsEditNewPage = () => ({ type: "LOAD_TAGS_EDIT_NEW_PAGE" });

const _loadTagsEditNewPage = (state: State, action: any): State => {
    return {
        ...state,
        tagsEditUI: {
            ...state.tagsEditUI,
            currentTag: getCurrentTagState(),
            tagsEditOnLoadFetch: { isFetching: false, fetchError: "" },
            tagsEditOnSaveFetch: { isFetching: false, fetchError: ""}
        }
    };
}

/** Sets default state of a /tags/edit/:id page for an existing tag. */
export const loadTagsEditExistingPage = () => ({ type: "LOAD_TAGS_EDIT_EXISTING_PAGE" });

const _loadTagsEditExistingPage = (state: State, action: any): State => {
    return {
        ...state,
        tagsEditUI: {
            ...state.tagsEditUI,
            currentTag: getCurrentTagState(),
            tagsEditOnLoadFetch: { isFetching: false, fetchError: "" },
            tagsEditOnSaveFetch: { isFetching: false, fetchError: "" },
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
export const setTagsEditShowDeleteDialog = (showDeleteDialog: boolean) => ({ type: "SET_TAGS_EDIT_SHOW_DELETE_DIALOG", showDeleteDialog });

const _setTagsEditShowDeleteDialog = (state: State, action: { showDeleteDialog: boolean }): State => {
    const { showDeleteDialog } = action;
    return { ...state, tagsEditUI: { ...state.tagsEditUI, showDeleteDialog }};
}


/** Sets /tags/edit/:id on load fetch state. */
export const setTagsEditLoadFetchState = (fetch: Partial<TagsEditOnLoadFetch>) => ({ type: "SET_TAGS_EDIT_LOAD_FETCH_STATE", fetch });

const _setTagsEditLoadFetchState = (state: State, action: { fetch: Partial<TagsEditOnLoadFetch> }): State => {
    const tagsEditOnLoadFetch = { ...state.tagsEditUI.tagsEditOnLoadFetch, ...action.fetch };
    return { ...state, tagsEditUI: { ...state.tagsEditUI, tagsEditOnLoadFetch }};
}

/** Sets /tags/edit/:id on save fetch state. */
export const setTagsEditSaveFetchState = (fetch: Partial<TagsEditOnSaveFetch>) => ({ type: "SET_TAGS_EDIT_SAVE_FETCH_STATE", fetch });

const _setTagsEditSaveFetchState = (state: State, action: { fetch: Partial<TagsEditOnSaveFetch> }): State => {
    const tagsEditOnSaveFetch = { ...state.tagsEditUI.tagsEditOnSaveFetch, ...action.fetch };
    return { ...state, tagsEditUI: { ...state.tagsEditUI, tagsEditOnSaveFetch }};
}


export const tagsEditRoot = {
    "LOAD_TAGS_EDIT_NEW_PAGE": _loadTagsEditNewPage,
    "LOAD_TAGS_EDIT_EXISTING_PAGE": _loadTagsEditExistingPage,
    "SET_CURRENT_TAG": _setCurrentTag,
    "SET_TAGS_EDIT_LOAD_FETCH_STATE": _setTagsEditLoadFetchState,
    "SET_TAGS_EDIT_SAVE_FETCH_STATE": _setTagsEditSaveFetchState,
    "SET_TAGS_EDIT_SHOW_DELETE_DIALOG": _setTagsEditShowDeleteDialog
};
