import { EditedObjectsUpdaters } from "../../store/updaters/data/edited-objects";

import type { State } from "../../store/types/state";
import { positiveInt } from "../../util/types/common";
import { getObjectsEditUI, type ObjectsEditTagsInput, type ObjectsEditAddCompositeSubobjectMenu } from "../../store/types/ui/objects-edit";


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/** Loads default ui state of the /objects/edit/:id page for a new object. */
export const loadObjectsEditNewPage = () => ({ type: "LOAD_OBJECTS_EDIT_NEW_PAGE" });

const _loadObjectsEditNewPage = (state: State, action: any): State => {
    // Add a new edited object if it's missing
    const newState = "0" in state.editedObjects 
        ? state 
        : EditedObjectsUpdaters.loadEditedObjects(state, [0], { display_in_feed: true, owner_id: state.auth.user_id });
    return { ...newState, objectsEditUI: getObjectsEditUI({ currentObjectID: 0 }) };
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
/** Sets selected tab on the /objects/edit/:id page. */
export const setObjectsEditSelectedTab = (selectedTab: number) => ({ type: "SET_OBJECTS_EDIT_SELECTED_TAB", selectedTab });

const _setObjectsEditSelectedTab = (state: State, action: { selectedTab: number }): State => {
    return { ...state, objectsEditUI: { ...state.objectsEditUI, selectedTab: action.selectedTab }};
};


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/** Performs partial update on the /objects/edit/:id page tags input's state. */
export const setObjectsEditTagsInput = (tagsInput: Partial<ObjectsEditTagsInput>) => ({ type: "SET_OBJECTS_EDIT_TAGS_INPUT", tagsInput });

const _setObjectsEditTagsInput = (state: State, action: { tagsInput: Partial<ObjectsEditTagsInput> }): State => {
    const tagsInput = { ...state.objectsEditUI.tagsInput, ...action.tagsInput };
    return { ...state, objectsEditUI: { ...state.objectsEditUI, tagsInput }};
};


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/** Toggles display of side menu reset dialog on the /objects/edit/:id page and closes other dialogs. */
export const setObjectsEditShowResetDialog = (showResetDialog: boolean) => ({ type: "SET_OBJECTS_EDIT_SHOW_RESET_DIALOG", showResetDialog });

const _setObjectsEditShowResetDialog = (state: State, action: { showResetDialog: boolean }): State => {
    const { showResetDialog } = action;
    const showDeleteDialog = showResetDialog ? false : state.objectsEditUI.showDeleteDialog;
    return { ...state, objectsEditUI: { ...state.objectsEditUI, showResetDialog, showDeleteDialog }};
};


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/** Toggles display of side menu delete dialog on the /objects/edit/:id page and closes other dialogs. */
export const setObjectsEditShowDeleteDialog = (showDeleteDialog: boolean) => ({ type: "SET_OBJECTS_EDIT_SHOW_DELETE_DIALOG", showDeleteDialog });

const _setObjectsEditShowDeleteDialog = (state: State, action: { showDeleteDialog: boolean }): State => {
    const { showDeleteDialog } = action;
    const showResetDialog = showDeleteDialog ? false : state.objectsEditUI.showResetDialog;
    return { ...state, objectsEditUI: { ...state.objectsEditUI, showDeleteDialog, showResetDialog }};
};


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/** Sets `toDoListRerenderPending` prop of the /objects/edit/:id UI state. */
export const setToDoListRerenderPending = (toDoListRerenderPending: boolean) => ({ type: "SET_TO_DO_LIST_RERENDER_PENDING", toDoListRerenderPending });

const _setToDoListRerenderPending = (state: State, action: { toDoListRerenderPending: boolean }): State => {
    const { toDoListRerenderPending } = action;
    return { ...state, objectsEditUI: { ...state.objectsEditUI, toDoListRerenderPending }};
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/** Partially updates composite subobject menu state on the /objects/edit/:id page. */
export const setAddCompositeSubobjectMenu = (addCompositeSubobjectMenu: Partial<ObjectsEditAddCompositeSubobjectMenu>) => 
    ({ type: "SET_ADD_COMPOSITE_SUBOBJECT_MENU", addCompositeSubobjectMenu });

const _setAddCompositeSubobjectMenu = (state: State, action: { addCompositeSubobjectMenu: Partial<ObjectsEditAddCompositeSubobjectMenu> }): State => {
    const addCompositeSubobjectMenu = { ...state.objectsEditUI.addCompositeSubobjectMenu, ...action.addCompositeSubobjectMenu };
    return { ...state, objectsEditUI: { ...state.objectsEditUI, addCompositeSubobjectMenu }};
};


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
export const objectsEditRoot = {
    "LOAD_OBJECTS_EDIT_NEW_PAGE": _loadObjectsEditNewPage,
    "LOAD_OBJECTS_EDIT_EXISTING_PAGE": _loadObjectsEditExistingPage,
    "SET_OBJECTS_EDIT_LOAD_FETCH_STATE": _setObjectsEditLoadFetchState,
    "SET_OBJECTS_EDIT_SAVE_FETCH_STATE": _setObjectsEditSaveFetchState,
    "SET_OBJECTS_EDIT_TAGS_INPUT": _setObjectsEditTagsInput,
    "SET_OBJECTS_EDIT_SELECTED_TAB": _setObjectsEditSelectedTab,
    "SET_OBJECTS_EDIT_SHOW_RESET_DIALOG": _setObjectsEditShowResetDialog,
    "SET_OBJECTS_EDIT_SHOW_DELETE_DIALOG": _setObjectsEditShowDeleteDialog,
    "SET_TO_DO_LIST_RERENDER_PENDING": _setToDoListRerenderPending,
    "SET_ADD_COMPOSITE_SUBOBJECT_MENU": _setAddCompositeSubobjectMenu
};
