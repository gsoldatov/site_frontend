import config from "../config";

import { responseHasError } from "./common";
import { addObjectFetch, viewObjectsFetch, updateObjectFetch, deleteObjectsFetch } from "./data-objects";
import { getNonCachedTags, tagsSearchFetch } from "./data-tags";

import { setRedirectOnRender } from "../actions/common";
import { loadEditObjectPage, setObjectOnLoadFetchState, setObjectOnSaveFetchState, setShowDeleteDialogObject, setCurrentObject, 
        setCurrentObjectTags, setObjectTagsInput } from "../actions/object";

import { isFetchingObject } from "../store/state-util/ui-object";
import { getObjectDataFromStore } from "../store/state-util/objects";


const backendURL = config.backendURL;


// Handles "Save" button click on new object page
export const addObjectOnSaveFetch = () => {
    return async (dispatch, getState) => {
        let state = getState();

        // Exit if already fetching
        if (isFetchingObject(state)) return;

        // Run fetch & add object
        dispatch(setObjectOnSaveFetchState(true, ""));
        const result = await dispatch(addObjectFetch(state.objectUI.currentObject));

        if (!responseHasError(result)) {
            dispatch(setObjectOnSaveFetchState(false, ""));
            dispatch(setRedirectOnRender(`/objects/${result.object_id}`));
        } else {
            dispatch(setObjectOnSaveFetchState(false, result.error));
        }
    };
};


// Loads object attributes & data on existing object page
export const editObjectOnLoadFetch = object_id => {
    return async (dispatch, getState) => {
        // Set initial page state
        dispatch(loadEditObjectPage());

        // Update fetch status
        dispatch(setObjectOnLoadFetchState(true, ""));

        // Check state for object attributes, tags and data
        let state = getState();
        let objectIDs, objectDataIDs;
        if (object_id in state.objects && object_id in state.objectsTags) {
            dispatch(setCurrentObject({ ...state.objects[object_id] }));
            dispatch(setCurrentObjectTags({ currentTagIDs: state.objectsTags[object_id] }));
            await dispatch(getNonCachedTags(state.objectsTags[object_id]));
        } else objectIDs = [parseInt(object_id)];
        
        let objectData = getObjectDataFromStore(state, object_id);
        if (objectData !== undefined) dispatch(setCurrentObject(objectData));
        else objectDataIDs = [parseInt(object_id)];

        // End fetch if both attributes and data are in state
        if (!objectIDs && !objectDataIDs) {
            dispatch(setObjectOnLoadFetchState(false, ""));
            return;
        }

        // Run fetch & set current object
        const result = await dispatch(viewObjectsFetch(objectIDs, objectDataIDs));

        if (!responseHasError(result)) {
            const object = getState().objects[object_id];
            const objectTags = getState().objectsTags[object_id];
            dispatch(setCurrentObject(object));
            dispatch(setCurrentObjectTags({ currentTagIDs: objectTags }));
            dispatch(setCurrentObject(getObjectDataFromStore(getState(), object_id)));
            dispatch(setObjectOnLoadFetchState(false, ""));
        } else {
            dispatch(setObjectOnLoadFetchState(false, result.error));
        }
    };
};


// Handles "Save" button click on existing object page
export const editObjectOnSaveFetch = () => {
    return async (dispatch, getState) => {
        let state = getState();

        // Exit if already fetching
        if (isFetchingObject(state)) return;

        // Run fetch & update object
        dispatch(setObjectOnSaveFetchState(true, ""));
        const result = await dispatch(updateObjectFetch(state.objectUI.currentObject));
        
        if (!responseHasError(result)) {
            dispatch(setCurrentObjectTags({ currentTagIDs: getState().objectsTags[result.object_id], added: [], removed: [] }));
            dispatch(setCurrentObject(result));
            dispatch(setObjectOnSaveFetchState(false, ""));
        } else {
            dispatch(setObjectOnSaveFetchState(false, result.error));
        }
    };        
};


// Handles delete confirmation button click on existing object page
export const editObjectOnDeleteFetch = () => {
    return async (dispatch, getState) => {
        // Exit if already fetching
        let state = getState();
        if (isFetchingObject(state)) return;

        // Hide delete dialog
        dispatch(setShowDeleteDialogObject(false));

        // Run fetch & delete object data from state
        dispatch(setObjectOnSaveFetchState(true, ""));
        const result = await dispatch(deleteObjectsFetch( [state.objectUI.currentObject.object_id] ));

        if (!responseHasError(result)) {
            dispatch(setRedirectOnRender("/objects"));
        } else {
            dispatch(setObjectOnSaveFetchState(false, result.error));
        }
    };      
};


// Handles objects tags dropdown with matching tags update
export const objectTagsDropdownFetch = ({queryText, existingIDs}) => {
    return async (dispatch, getState) => {
        // Exit fetch if an item was added before the start of the fetch
        const inputText = getState().objectUI.currentObject.tagsInput.inputText;
        if (inputText.length === 0) {
            dispatch(setObjectTagsInput({ matchingIDs: [] }));
            return;
        }

        // Run fetch & update matching tags
        const result = await dispatch(tagsSearchFetch({queryText, existingIDs}));

        if (!responseHasError(result)) {
            // Update matching tags if input text didn't change during fetch
            if (inputText === getState().objectUI.currentObject.tagsInput.inputText) dispatch(setObjectTagsInput({ matchingIDs: result }));
        }
    };
}
