import config from "../config";
import { isFetchingObject, checkIfCurrentObjectNameExists, checkIfObjectDataExists } from "../store/state-check-functions";
import { getCurrentObjectData, getObjectData } from "../store/state-util";
import { addObjects, addObjectData, deselectObjects, deleteObjects } from "./objects";

const backendURL = config.backendURL;

export const LOAD_ADD_OBJECT_PAGE = "LOAD_ADD_OBJECT_PAGE";
export const LOAD_EDIT_OBJECT_PAGE = "LOAD_EDIT_OBJECT_PAGE";
export const SET_CURRENT_OBJECT = "SET_CURRENT_OBJECT";
export const SET_OBJECT_REDIRECT_ON_RENDER  = "SET_OBJECT_REDIRECT_ON_RENDER";
export const SET_OBJECT_ON_LOAD_FETCH_STATE = "SET_OBJECT_ON_LOAD_FETCH_STATE";
export const SET_OBJECT_ON_SAVE_FETCH_STATE = "SET_OBJECT_ON_SAVE_FETCH_STATE";
export const SET_SHOW_DELETE_DIALOG_OBJECT = "SET_SHOW_DELETE_DIALOG_OBJECT";

export const loadAddObjectPage      = () => ({ type: LOAD_ADD_OBJECT_PAGE });
export const loadEditObjectPage     = () => ({ type: LOAD_EDIT_OBJECT_PAGE });
export const setCurrentObject       = object => ({ type: SET_CURRENT_OBJECT, object: object });
export const setObjectRedirectOnRender = (redirectOnRender = "") => ({ type: SET_OBJECT_REDIRECT_ON_RENDER, redirectOnRender: redirectOnRender });
export const setShowDeleteDialogObject = (showDeleteDialog = false) => ({ type: SET_SHOW_DELETE_DIALOG_OBJECT, showDeleteDialog: showDeleteDialog });

export const setObjectOnLoadFetchState = (isFetching = false, fetchError = "") => {
    return {
        type: SET_OBJECT_ON_LOAD_FETCH_STATE,
        isFetching: isFetching,
        fetchError: fetchError
    };
};

export const setObjectOnSaveFetchState = (isFetching = false, fetchError = "") => {
    return {
        type: SET_OBJECT_ON_SAVE_FETCH_STATE,
        isFetching: isFetching,
        fetchError: fetchError
    };
};

export function addObjectOnSaveFetch() {
    return async (dispatch, getState) => {
        let state = getState();

        // Exit if already fetching
        if (isFetchingObject(state)) {
            return;
        }

        // Check if object_name already exists in local storage
        if (checkIfCurrentObjectNameExists(state)) {
            dispatch(setObjectOnSaveFetchState(false, "Object name already exists."));
            return;
        }

        // Update fetch status
        dispatch(setObjectOnSaveFetchState(true, ""));

        // Post the object and handle response & errors
        let object_data = getCurrentObjectData(state);
        let payload = JSON.stringify({
            object: {
                object_type: state.objectUI.currentObject.object_type,
                object_name: state.objectUI.currentObject.object_name,
                object_description: state.objectUI.currentObject.object_description,
                object_data: object_data
            }
        });

        try {
            let response = await fetch(`${backendURL}/objects/add`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: payload
            });

            switch (response.status) {
                case 200:
                    let object = (await response.json()).object;
                    dispatch(addObjects([object]));
                    dispatch(addObjectData([{ object_id: object.object_id, object_type: object.object_type, object_data: object_data }]));
                    dispatch(setObjectOnSaveFetchState(false, ""));
                    dispatch(setObjectRedirectOnRender(`/objects/${object.object_id}`));
                    break;
                case 400:
                    throw Error((await response.json())._error);
                case 500:
                    throw Error(await response.text());
            }
        } catch (error) {
            dispatch(setObjectOnSaveFetchState(false, error.message));
        }
    };
};

export function editObjectOnLoadFetch(object_id) {
    return async (dispatch, getState) => {
        // Set initial page state
        dispatch(loadEditObjectPage());

        let state = getState();
        let payload = {};

        // Check state for object attributes and data
        if (object_id in state.objects) {
            dispatch(setCurrentObject({ ...state.objects[object_id] }));
        } else {
            payload["object_ids"] = [parseInt(object_id)];;
        }

        let objectData = getObjectData(state, object_id);
        if (objectData !== null) {
            dispatch(setCurrentObject({...objectData}));
        } else {
            payload["object_data_ids"] = [parseInt(object_id)];;
        }

        // End fetch if both attributes and data are in state
        if (!("object_ids" in payload) && !("object_data_ids" in payload)) {
            return;
        }
        
        // Update fetch status
        dispatch(setObjectOnLoadFetchState(true, ""));

        // Fetch object attributes and data and handle response
        payload = JSON.stringify(payload);

        try {
            let response = await fetch(`${backendURL}/objects/view`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: payload
            });

            switch (response.status) {
                case 200:
                    let data = await response.json();

                    if (data["objects"].length > 0) {
                        let object = data["objects"][0];
                        dispatch(addObjects([object]));
                        dispatch(setCurrentObject(object));
                    }

                    if (data["object_data"].length > 0) {
                        dispatch(addObjectData(data["object_data"]));
                        dispatch(setCurrentObject({...data["object_data"][0]["object_data"] }));
                    }

                    dispatch(setObjectOnLoadFetchState(false, ""));
                    break;
                case 400:
                    throw Error((await response.json())._error);
                case 404:
                    throw Error("Object not found.");
                case 500:
                    throw Error(await response.text());
            }
        }
        catch (error) {
            dispatch(setObjectOnLoadFetchState(false, error.message));
        }
    };
};

export function editObjectOnSaveFetch() {
    return async (dispatch, getState) => {
        let state = getState();

        // Exit if already fetching
        if (isFetchingObject(state)) {
            return;
        }

        // Check if object_name already exists in local storage
        if (checkIfCurrentObjectNameExists(state)) {
            dispatch(setObjectOnSaveFetchState(false, "Object name already exists."));
            return;
        }
        
        // Update fetch status
        dispatch(setObjectOnSaveFetchState(true, ""));

        // Fetch object data and handle response
        let object_data = getCurrentObjectData(state);
        let payload = JSON.stringify({
            object: {
                object_id: state.objectUI.currentObject.object_id,
                object_name: state.objectUI.currentObject.object_name,
                object_description: state.objectUI.currentObject.object_description,
                object_data: object_data
            }
        });

        try {
            let response = await fetch(`${backendURL}/objects/update`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: payload
            });

            switch (response.status) {
                case 200:
                    let object = (await response.json()).object;
                    dispatch(addObjects([object]));
                    dispatch(addObjectData([{ object_id: object.object_id, object_type: object.object_type, object_data: object_data }]));
                    dispatch(setCurrentObject(object));
                    dispatch(setObjectOnSaveFetchState(false, ""));
                    break;
                case 400:
                    throw Error((await response.json())._error);
                case 404:
                    throw Error("Object not found.");
                case 500:
                    throw Error(await response.text());
            }
        } catch (error) {
            dispatch(setObjectOnSaveFetchState(false, error.message));
        }
    };        
};

export function editObjectOnDeleteFetch() {
    return async (dispatch, getState) => {
        // Hide delete dialog
        dispatch(setShowDeleteDialogObject(false));

        // Exit if already fetching
        let state = getState();

        if (isFetchingObject(state)) {
            return;
        }
        
        // Update fetch status
        dispatch(setObjectOnSaveFetchState(true, ""));

        // Fetch object data and handle response
        let object_ids = [state.objectUI.currentObject.object_id];
        let payload = JSON.stringify({ 
            object_ids: object_ids
        });

        try {
            let response = await fetch(`${backendURL}/objects/delete`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: payload
            });
                        
            switch (response.status) {
                case 200:
                case 404:   // Objects not present in the database should be deleted from state
                    dispatch(setObjectOnSaveFetchState(false, response.status === 200 ? "" : "Object not found."));
                    dispatch(deselectObjects(object_ids));
                    dispatch(deleteObjects(object_ids));
                    dispatch(setObjectRedirectOnRender("/objects"));
                    break;
                case 400:
                    throw Error((await response.json())._error);
                case 500:
                    throw Error(await response.text());
            }
        } catch (error) {
            dispatch(setObjectOnSaveFetchState(false, error.message));
        }
    };      
};
