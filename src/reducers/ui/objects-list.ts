import type { State } from "../../store/types/state"
import type { ObjectsListFetch } from "../../store/types/ui/objects-list"


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/** Updates `state.objectsUI.fetch`. */
export const setObjectsListFetch = (fetch: Partial<ObjectsListFetch>) => ({ type: "SET_OBJECTS_LIST_FETCH", fetch });

const _setObjectsListFetch = (state: State, action: { fetch: Partial<ObjectsListFetch> }): State => {
    const fetch = { ...state.objectsListUI.fetch, ...action.fetch };
    return { ...state, objectsListUI: { ...state.objectsListUI, fetch }};
};


export const objectsListRoot = {
    "SET_OBJECTS_LIST_FETCH": _setObjectsListFetch
};
