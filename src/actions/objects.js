import config from "../config";
import { isFetchingObjects } from "../store/state-check-functions";

const backendURL = config.backendURL;

export const ADD_OBJECTS = "ADD_OBJECTS";
export const ADD_OBJECT_DATA = "ADD_OBJECT_DATA";
export const DELETE_OBJECTS = "DELETE_OBJECTS";
export const SELECT_OBJECTS = "SELECT_OBJECTS";
export const TOGGLE_OBJECT_SELECTION = "TOGGLE_OBJECT_SELECTION";
export const DESELECT_OBJECTS = "DESELECT_OBJECTS";
export const CLEAR_SELECTED_OBJECTS = "CLEAR_SELECTED_OBJECTS";
export const SET_OBJECTS_PAGINATION_INFO = "SET_OBJECTS_PAGINATION_INFO";
export const SET_OBJECTS_REDIRECT_ON_RENDER = "SET_OBJECTS_REDIRECT_ON_RENDER";
export const SET_SHOW_DELETE_DIALOG_OBJECTS = "SET_SHOW_DELETE_DIALOG_OBJECTS";
export const SET_OBJECTS_FETCH = "SET_OBJECTS_FETCH";

export const addObjects                     = objects => ({ type: ADD_OBJECTS, objects: objects });
export const addObjectData                  = objectData => ({ type: ADD_OBJECT_DATA, objectData: objectData });
export const deleteObjects                  = object_ids => ({ type: DELETE_OBJECTS, object_ids: object_ids });
export const selectObjects               = object_ids => ({ type: SELECT_OBJECTS, object_ids: object_ids });
export const toggleObjectSelection       = object_id => ({ type: TOGGLE_OBJECT_SELECTION, object_id: object_id });
export const deselectObjects                = object_ids => ({ type: DESELECT_OBJECTS, object_ids: object_ids });
export const clearSelectedObjects        = () => ({ type: CLEAR_SELECTED_OBJECTS });
export const setObjectsPaginationInfo    = paginationInfo => ({ type: SET_OBJECTS_PAGINATION_INFO, paginationInfo: paginationInfo });
export const setObjectsRedirectOnRender  = (redirectOnRender = "") => ({ type: SET_OBJECTS_REDIRECT_ON_RENDER, redirectOnRender: redirectOnRender });
export const setShowDeleteDialogObjects  = (showDeleteDialog = false) => ({ type: SET_SHOW_DELETE_DIALOG_OBJECTS, showDeleteDialog: showDeleteDialog });

export const setObjectsFetch = (isFetching = false, fetchError = "") => { 
    return {
        type: SET_OBJECTS_FETCH, 
        isFetching: isFetching, 
        fetchError: fetchError
    };
};

function getObjectsFetch(object_ids) {
    return async (dispatch, getState) => {
        let payload = JSON.stringify({ object_ids: object_ids });
        let response = await fetch(`${backendURL}/objects/view`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: payload
        });

        switch (response.status) {
            case 200:
                let objects = (await response.json())["objects"];
                dispatch(addObjects(objects));
                return;
            case 400:
            case 404:
                throw new Error((await response.json())["_error"]);
                return;
            case 500:
                throw new Error(await response.text());
                return;
        }
    };
};

function getPageObjectIDs() {
    return async (dispatch, getState) => {
        let pI = getState().objectsUI.paginationInfo;
        let response = await fetch(`${backendURL}/objects/get_page_object_ids`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                pagination_info: {
                    page: pI.currentPage,
                    items_per_page: pI.itemsPerPage,
                    order_by: pI.sortField,
                    sort_order: pI.sortOrder,
                    filter_text: pI.filterText,
                    object_types: pI.objectTypes
                }
            })
        });

        switch (response.status) {
            case 200:
                let json = await response.json();
                dispatch(setObjectsPaginationInfo({ totalItems: json["total_items"], currentPageObjectIDs: json["object_ids"] }));
                return;
            case 400:
            case 404:
                throw new Error((await response.json())["_error"]);
            case 500:
                throw new Error(await response.text());
        }
    };
}

export function pageFetch(currentPage) {
    return async (dispatch, getState) => {
        const state = getState();

        if (isFetchingObjects(state)) {
            return;
        }

        try {
            dispatch(setObjectsPaginationInfo({ currentPage: currentPage }));
            dispatch(setObjectsFetch(true, ""));
            await dispatch(getPageObjectIDs());
            let nonCachedObjects = getState().objectsUI.paginationInfo.currentPageObjectIDs.filter(object_id => !(object_id in state.objects));
            if (nonCachedObjects.length !== 0) {   // Fetch objects of the current page which were not cached before
                await dispatch(getObjectsFetch(nonCachedObjects));
            }
            dispatch(setObjectsFetch(false, ""));
        }
        catch(error) {
            dispatch(setObjectsFetch(false, error.message));
        }
    };
};

export function setObjectsPaginationInfoAndFetchPage(paginationInfo){
    return async (dispatch, getState) => {
        paginationInfo.currentPage = 1;
        dispatch(setObjectsPaginationInfo(paginationInfo));
        dispatch(pageFetch(paginationInfo.currentPage));
    };
}

export function onDeleteFetch() {
    return async (dispatch, getState) => {
        // Hide delete dialog
        dispatch(setShowDeleteDialogObjects(false));

        // Exit if already fetching
        let state = getState();

        if (isFetchingObjects(state)) {
            return;
        }
        
        try {
            // Update fetch status
            dispatch(setObjectsFetch(true, ""));

            // Fetch object data and handle response
            let payload = JSON.stringify({ 
                object_ids: state.objectsUI.selectedObjectIDs
            });

            let response = await fetch(`${backendURL}/objects/delete`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: payload
            });

            let deleteFromState = true;
            let error = "";

            switch (response.status) {
                case 200:
                    break;
                case 400:
                    error = (await response.json())._error;
                    deleteFromState = false;
                    break;
                case 404:
                    // error = "Objects not found.";
                    break;
                case 500:
                    error = await response.text();
                    deleteFromState = false;
                    break;
            }

            if (deleteFromState) {
                dispatch(setObjectsPaginationInfo({ currentPageObjectIDs: state.objectsUI.paginationInfo.currentPageObjectIDs.filter(id => !state.objectsUI.selectedObjectIDs.includes(id)) }));  // delete from current page
                dispatch(deleteObjects(state.objectsUI.selectedObjectIDs));  // delete from object storage
                dispatch(clearSelectedObjects());    // clear object selection
            }
            dispatch(setObjectsFetch(false, error));
        } catch (error) {
            dispatch(setObjectsFetch(false, error.message));
        }
    };
};
