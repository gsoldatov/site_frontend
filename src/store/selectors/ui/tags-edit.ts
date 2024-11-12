import type { State } from "../../types/state";


export class TagsEditSelectors {
    /**
     * Returns true if any of /tags/edit/:id page fetches are being performed.
     */
    static isFetching(state: State) {
        return state.tagsEditUI.loadFetch.isFetching || state.tagsEditUI.saveFetch.isFetching;
    }


    /**
     * Returns true if any of /tags/edit/:id page fetches are being performed or a confirmation dialog is being displayed.
     */
    static isFetchinOrShowingDialog(state: State) {
        return TagsEditSelectors.isFetching(state) || state.tagsEditUI.showDeleteDialog;
    }
}
