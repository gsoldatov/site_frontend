import config from "../config";

import { responseHasError } from "./common";
import { addObjectFetch, viewObjectsFetch, updateObjectFetch, deleteObjectsFetch, objectsSearchFetch } from "./data-objects";
import { getNonCachedTags, tagsSearchFetch } from "./data-tags";

import { setRedirectOnRender } from "../actions/common";
import { loadEditObjectPage, resetEditedObjects, setObjectOnLoadFetchState, setObjectOnSaveFetchState,
        setShowDeleteDialogObject, setEditedObject, 
        setEditedObjectTags, setObjectTagsInput, setAddCompositeSubobjectMenu } from "../actions/object";

import { getCurrentObject, isFetchingObject } from "../store/state-util/ui-object";
import { objectDataIsInState } from "../store/state-util/objects";


const backendURL = config.backendURL;


// Handles "Save" button click on new object page
export const addObjectOnSaveFetch = () => {
    return async (dispatch, getState) => {
        let state = getState();

        // Exit if already fetching
        if (isFetchingObject(state)) return;

        // Run fetch & add object
        dispatch(setObjectOnSaveFetchState(true, ""));
        const result = await dispatch(addObjectFetch(getCurrentObject(state)));

        if (!responseHasError(result)) {
            dispatch(setObjectOnSaveFetchState(false, ""));
            dispatch(setRedirectOnRender(`/objects/${result.object_id}`, true));
        } else {
            dispatch(setObjectOnSaveFetchState(false, result.error));
        }
    };
};


// Fetches attributes, tags and data of an existing object and adds them to state.editedObjects, if the object was not already edited
export const editObjectOnLoadFetch = object_id => {
    return async (dispatch, getState) => {
        // Set initial page state
        object_id = parseInt(object_id);
        dispatch(loadEditObjectPage(object_id));

        // Update fetch status
        dispatch(setObjectOnLoadFetchState(true, ""));
        
        // Check if object attributes, tags and data should be fetched and/or added to state.editedObjects
        let state = getState();
        let setEditedObjects = true, fetchAttributesAndTags = true, fetchData = true;
        if (object_id in state.editedObjects) setEditedObjects = false;
        if (object_id in state.objects && object_id in state.objectsTags) fetchAttributesAndTags = false;
        if (objectDataIsInState(state, object_id)) fetchData = false;

        // Fetch object attributes, tags and/or data if they are missing
        if (fetchAttributesAndTags || fetchData) {
            let objectIDs = fetchAttributesAndTags ? [object_id] : undefined;
            let objectDataIDs = fetchData ? [object_id] : undefined;
            let result = await dispatch(viewObjectsFetch(objectIDs, objectDataIDs));
            if (responseHasError(result)) {
                dispatch(setObjectOnLoadFetchState(false, result.error));
                return;
            }
        }

        // // Fetch non-cached tags     // tags are fetched in viewObjectsFetch
        // let objectTags = getState().objectsTags[object_id];
        // let result = await dispatch(getNonCachedTags(objectTags));
        // if (responseHasError(result)) {
        //     dispatch(setObjectOnLoadFetchState(false, result.error));
        //     return;
        // }

        // Add an entry for the object in state.editedObjects if it doesn't exist and set object attributes, tags and data into it
        if (setEditedObjects) dispatch(resetEditedObjects());  // object_id is taken from state.objectUI.currentObjectID (which was set by loadEditObjectPage)

        // End fetch
        dispatch(setObjectOnLoadFetchState(false, ""));
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
        const result = await dispatch(updateObjectFetch(getCurrentObject(state)));
        
        if (!responseHasError(result)) {
            dispatch(setEditedObjectTags({ currentTagIDs: getState().objectsTags[result.object_id], added: [], removed: [] }));
            dispatch(setEditedObject(result));
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
        const result = await dispatch(deleteObjectsFetch( [state.objectUI.currentObjectID] ));

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
        const inputText = getState().objectUI.tagsInput.inputText;
        if (inputText.length === 0) {
            dispatch(setObjectTagsInput({ matchingIDs: [] }));
            return;
        }

        // Run fetch & update matching tags
        const result = await dispatch(tagsSearchFetch({queryText, existingIDs}));

        if (!responseHasError(result)) {
            // Update matching tags if input text didn't change during fetch
            if (inputText === getState().objectUI.tagsInput.inputText) dispatch(setObjectTagsInput({ matchingIDs: result }));
        }
    };
}


// Handles composite object add subobject dropdown values update
export const compositeSubobjectDropdownFetch = ({queryText, existingIDs}) => {
    return async (dispatch, getState) => {
        // Exit fetch if an item was added before the start of the fetch
        const inputText = getState().objectUI.addCompositeSubobjectMenu.inputText;
        if (inputText.length === 0) return;

        // Run fetch & update matching tags
        const result = await dispatch(objectsSearchFetch({queryText, existingIDs}));

        if (!responseHasError(result)) {
            // Update matching tags if input text didn't change during fetch
            if (inputText === getState().objectUI.addCompositeSubobjectMenu.inputText) dispatch(setAddCompositeSubobjectMenu({ matchingIDs: result }));
        }
    };
}


// Fetches missing attributes/tags/data of composite object's subobjects
export const loadCompositeSubobjectsFetch = objectID => {
    return async (dispatch, getState) => {
        let state = getState();
        
        // Exit if object is not composite or not being edited
        if (state.editedObjects[objectID] === undefined || state.editedObjects[objectID].object_type !== "composite") return;

        // Get subobjects, which should be fetched
        let existingSubobjectIDs = Object.keys(state.editedObjects[objectID].composite.subobjects).map(objID => parseInt(objID)).filter(objID => objID > 0);
        let subobjectIDsWithMissingAttributesOrTags = existingSubobjectIDs.filter(objID => !(objID in state.objects && objID in state.objectsTags));
        let subobjectIDsWithMissingData = existingSubobjectIDs.filter(objID => !objectDataIsInState(state, objID));

        // Fetch missing attributes/tags/data
        if (subobjectIDsWithMissingAttributesOrTags.length > 0 || subobjectIDsWithMissingData.length > 0) {
            // Update fetch status
            let nonCachedSubobjectIDs = new Set(subobjectIDsWithMissingAttributesOrTags.concat(subobjectIDsWithMissingData));
            dispatch(setEditedObject({ compositeUpdate: { command: "setFetchError", fetchError: "", subobjectIDs: nonCachedSubobjectIDs }}, objectID));
            
            // Fetch subobjects from backend
            let result = await dispatch(viewObjectsFetch(subobjectIDsWithMissingAttributesOrTags, subobjectIDsWithMissingData));

            // Handle fetch error
            if (responseHasError(result)) {
                dispatch(setEditedObject({ compositeUpdate: { command: "setFetchError", fetchError: "Could not fetch object data.", subobjectIDs: nonCachedSubobjectIDs }}, objectID));
                return;
            }

            // Set fetch error for subobjects which were not fetched
            let returnedObjectIDs = result["objects"].map(object => object.object_id);
            let notFoundObjectIDs = subobjectIDsWithMissingAttributesOrTags.filter(objectID => returnedObjectIDs.indexOf(objectID) === -1);
            let returndedObjectDataIDs = result["object_data"].map(object => object.object_id);
            notFoundObjectIDs = notFoundObjectIDs.concat(subobjectIDsWithMissingData.filter(objectID => returndedObjectDataIDs.indexOf(objectID) === -1));
            if (notFoundObjectIDs.length > 0)
                dispatch(setEditedObject({ compositeUpdate: { command: "setFetchError", fetchError: "Could not fetch object data.", subobjectIDs: notFoundObjectIDs }}, objectID));
        }

        // Set which objects should be added to state.editedObjects (successfully fetched & not already present there)
        state = getState();
        let subobjectIDsToAddToEditedObjects = existingSubobjectIDs.filter(objID => objID in state.objects && objID in state.objectsTags && objectDataIsInState(state, objID)
            && (!objID in state.editedObjects));

        // Add objects to state.editedObjects
        if (subobjectIDsToAddToEditedObjects.length > 0)
            dispatch(resetEditedObjects(subobjectIDsToAddToEditedObjects));
    };
};