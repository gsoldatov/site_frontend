import type { State } from "../../../types/store/state";


export class TagsListSelectors {
    /**
     * Returns true if any of /tags/list page fetches are being performed.
     */
    static isFetching(state: State) {
        return state.tagsListUI.fetch.isFetching;
    }


    /**
     * Returns true if any of /tags/list page fetches are being performed or a confirmation dialog is being displayed.
     */
    static isFetchinOrShowingDialog(state: State) {
        return TagsListSelectors.isFetching(state) || state.tagsListUI.showDeleteDialog;
    }
}
