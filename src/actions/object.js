import config from "../config";
import { isFetchingObject, checkIfCurrentObjectNameExists } from "../store/state-check-functions";
import { getCurrentObjectData, getObjectData } from "../store/state-util";
import { setRedirectOnRender } from "./common";
import { addObjects, addObjectData, setObjectsTags, deselectObjects, deleteObjects, setObjectsFetch } from "./objects";
import { getNonCachedTags } from "./tags";

const backendURL = config.backendURL;


export const LOAD_ADD_OBJECT_PAGE = "LOAD_ADD_OBJECT_PAGE";
export const LOAD_EDIT_OBJECT_PAGE = "LOAD_EDIT_OBJECT_PAGE";
export const SET_CURRENT_OBJECT = "SET_CURRENT_OBJECT";
export const SET_TAGS_INPUT = "SET_TAGS_INPUT";
export const SET_CURRENT_OBJECT_TAGS = "SET_CURRENT_OBJECT_TAGS";
export const SET_SHOW_DELETE_DIALOG_OBJECT = "SET_SHOW_DELETE_DIALOG_OBJECT";
export const SET_OBJECT_ON_LOAD_FETCH_STATE = "SET_OBJECT_ON_LOAD_FETCH_STATE";
export const SET_OBJECT_ON_SAVE_FETCH_STATE = "SET_OBJECT_ON_SAVE_FETCH_STATE";

export const loadAddObjectPage      = () => ({ type: LOAD_ADD_OBJECT_PAGE });
export const loadEditObjectPage     = () => ({ type: LOAD_EDIT_OBJECT_PAGE });
export const setCurrentObject       = object => ({ type: SET_CURRENT_OBJECT, object: object });
export const setTagsInput           = inputState => ({ type: SET_TAGS_INPUT, tagsInput: inputState });
export const setCurrentObjectTags   = tagUpdates => ({ type: SET_CURRENT_OBJECT_TAGS, tagUpdates: tagUpdates });
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
                added_tags: state.objectUI.currentObject.addedTags,
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
                    
                    // Set objects tags
                    dispatch(setObjectsTags([object]));

                    // Add object
                    dispatch(addObjects([object])); 
                    dispatch(addObjectData([{ object_id: object.object_id, object_type: object.object_type, object_data: object_data }]));
                    dispatch(setObjectOnSaveFetchState(false, ""));
                    dispatch(setRedirectOnRender(`/objects/${object.object_id}`));
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
        
        // Update fetch status
        dispatch(setObjectOnLoadFetchState(true, ""));

        // Check state for object attributes, tags and data
        if (object_id in state.objects && object_id in state.objectsTags) {
            dispatch(setCurrentObject({ ...state.objects[object_id] }));
            dispatch(setCurrentObjectTags({ currentTagIDs: state.objectsTags[object_id] }));
            await dispatch(getNonCachedTags(state.objectsTags[object_id]));
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
            dispatch(setObjectOnLoadFetchState(false, ""));
            return;
        }

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
                        const object = data["objects"][0];

                        // Set object tags (objects' tags store & current object's current tags)
                        dispatch(setObjectsTags([ object ]));
                        dispatch(setCurrentObjectTags({ currentTagIDs: object.current_tag_ids }));
                        await dispatch(getNonCachedTags(object.current_tag_ids));

                        // Set object attributes
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
                object_data: object_data,
                added_tags: state.objectUI.currentObject.addedTags,
                removed_tag_ids: state.objectUI.currentObject.removedTagIDs
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

                    // Update object's tags
                    dispatch(setObjectsTags([ object ]));
                    dispatch(setCurrentObjectTags({ currentTagIDs: getState().objectsTags[object.object_id], added: [], removed: [] }));
                    await dispatch(getNonCachedTags(getState().objectUI.currentObject.currentTagIDs));

                    // Update object & data
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
                    dispatch(setRedirectOnRender("/objects"));
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

export function objectTagsFetch({queryText, existingIDs}) {
    return async (dispatch, getState) => {
        // Check params
        if (queryText.length === 0 || queryText.length > 255 || existingIDs.length > 1000) return;
        const inputText = getState().objectUI.currentObject.tagsInput.inputText;

        let payload = JSON.stringify({
            query: {
                query_text: queryText,
                maximum_values: 10,
                existing_ids: existingIDs || []
            }
        });

        try {
            let response = await fetch(`${backendURL}/tags/search`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: payload
            });
                        
            switch (response.status) {
                case 200:
                    let tagIDs = (await response.json()).tag_ids;
                    await dispatch(getNonCachedTags(tagIDs));

                    // Do not update if input text changed during fetch
                    if (inputText === getState().objectUI.currentObject.tagsInput.inputText) dispatch(setTagsInput({ matchingIDs: tagIDs }));
                    break;
                case 404:
                    dispatch(setTagsInput({ matchingIDs: [] }));
                    break;
                case 400:
                    throw Error((await response.json())._error);
                case 500:
                    throw Error(await response.text());
            }
        } catch (error) {
            throw error;
        }
    };
}
