import type { State } from "../../store/types/state";
import { positiveInt, type Dispatch, type GetState } from "../../util/types/common";
import { getEditedObjectState } from "../../store/types/data/edited-objects";
import { getObjectsEditUI, type ObjectEditTagsInput } from "../../store/types/ui/objects-edit";


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/** Loads default ui state of the /objects/edit/:id page for a new object. */
export const loadObjectsEditNewPage = () => ({ type: "LOAD_OBJECTS_EDIT_NEW_PAGE" });

const _loadObjectsEditNewPage = (state: State, action: any): State => {
    // Add a new edited object if it's missing
    const editedObjects = "0" in state.editedObjects 
        ? state.editedObjects
        : { ...state.editedObjects, [0]: getEditedObjectState({ object_id: 0, display_in_feed: true, owner_id: state.auth.user_id })};
    
    return { ...state, editedObjects, objectsEditUI: getObjectsEditUI({ currentObjectID: 0 }) };
};


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/** Loads default ui state of the /objects/edit/:id page for an existing object. */
export const loadObjectsEditExistingPage = (currentObjectID: number) => ({ type: "LOAD_OBJECTS_EDIT_EXISTING_PAGE", currentObjectID });

const _loadObjectsEditExistingPage = (state: State, action: { currentObjectID: number }): State => {
    const { selectedTab } = state.objectsEditUI;    // don't reset to default

    // Validate current object & handle invalid currentObjectID
    const { currentObjectID } = action;
    const currentObjectValidation = positiveInt.safeParse(currentObjectID);
    if (!currentObjectValidation.success)
        return { ...state, objectsEditUI: getObjectsEditUI({ loadFetch: { isFetching: false, fetchError: "Object not found." }, selectedTab })};

    // Returns state for a valida
    return { ...state, objectsEditUI: getObjectsEditUI({ currentObjectID: action.currentObjectID, selectedTab }) };
};


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/** Sets /object/edit/:id load fetch state. */
export const setObjectsEditLoadFetchState = (isFetching: boolean, fetchError: string) => ({ type: "SET_OBJECTS_EDIT_LOAD_FETCH_STATE", isFetching, fetchError });

function _setObjectsEditLoadFetchState(state: State, action: { isFetching: boolean, fetchError: string }): State {
    const loadFetch = { isFetching: action.isFetching, fetchError: action. fetchError };
    return { ...state, objectsEditUI: { ...state.objectsEditUI, loadFetch }};
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/** Sets /object/edit/:id save fetch state. */
export const setObjectsEditSaveFetchState = (isFetching: boolean, fetchError: string) => ({ type: "SET_OBJECTS_EDIT_SAVE_FETCH_STATE", isFetching, fetchError });

const _setObjectsEditSaveFetchState = (state: State, action: { isFetching: boolean, fetchError: string }): State => {
    const saveFetch = { isFetching: action.isFetching, fetchError: action. fetchError };
    return { ...state, objectsEditUI: { ...state.objectsEditUI, saveFetch }};
};


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/** Performs partial update on the /objects/edit/:id page tags input's state. */
export const setObjectsEditTagsInput = (tagsInput: Partial<ObjectEditTagsInput>) => ({ type: "SET_OBJECTS_EDIT_TAGS_INPUT", tagsInput });

const _setObjectsEditTagsInput = (state: State, action: { tagsInput: Partial<ObjectEditTagsInput> }): State => {
    const tagsInput = { ...state.objectsEditUI.tagsInput, ...action.tagsInput };
    return { ...state, objectsEditUI: { ...state.objectsEditUI, tagsInput }};
};



///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
export const objectsEditRoot = {
    "LOAD_OBJECTS_EDIT_NEW_PAGE": _loadObjectsEditNewPage,
    "LOAD_OBJECTS_EDIT_EXISTING_PAGE": _loadObjectsEditExistingPage,
    "SET_OBJECTS_EDIT_LOAD_FETCH_STATE": _setObjectsEditLoadFetchState,
    "SET_OBJECTS_EDIT_SAVE_FETCH_STATE": _setObjectsEditSaveFetchState,
    "SET_OBJECTS_EDIT_TAGS_INPUT": _setObjectsEditTagsInput,
};
