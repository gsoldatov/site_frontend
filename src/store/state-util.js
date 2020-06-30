import { isFetchingTags } from "./state-check-functions";
/*
    Utility functions for working with state.
*/

export function getTagsFetchError(state) {
    if (isFetchingTags(state)) {
        return null;
    }

    switch (state.tagsUI.lastFetch) {
        case "tagsPagination":
            return state.tagsUI.paginationFetch.fetchError;
        case "tagsOnDelete":
            return state.tagsUI.onDeleteFetch.fetchError;
        default:
            return null;
    }
}
