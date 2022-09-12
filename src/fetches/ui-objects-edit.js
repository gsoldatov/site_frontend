import { getResponseErrorType } from "./common";
import { addObjectFetch, viewObjectsFetch, updateObjectFetch, deleteObjectsFetch, objectsSearchFetch } from "./data-objects";
import { getNonCachedTags, tagsSearchFetch } from "./data-tags";

import { setRedirectOnRender } from "../actions/common";
import { loadNewObjectPage, loadEditObjectPage, resetEditedObjects, setObjectOnLoadFetchState, setObjectOnSaveFetchState,
        setShowDeleteDialogObject, setEditedObject, 
        setEditedObjectTags, setObjectTagsInput, setAddCompositeSubobjectMenu } from "../actions/objects-edit";

import { getCurrentObject, isFetchingObject } from "../store/state-util/ui-objects-edit";
import { objectDataIsInState } from "../store/state-util/objects";

import { enumResponseErrorType } from "../util/enum-response-error-type";


/**
 * Loads default state of /objects/edit/new page & loads composite object's subobject data.
 */
export const addObjectOnLoad = () => {
    return async (dispatch, getState) => {
        // Load initial page state and start loading composite subobjects
        dispatch(loadNewObjectPage());

        // Fetch tag data of added tags, if it's missing
        // Update fetch status
        dispatch(setObjectOnLoadFetchState(true, ""));

        // Fetch missing tags if object attributes, tags & data are present in the state
        let result = await dispatch(getNonCachedTags(getState().editedObjects[0].addedTags));

        // Handle fetch errors
        const responseErrorType = getResponseErrorType(result);
        if (responseErrorType > enumResponseErrorType.none) {
            const errorMessage = responseErrorType === enumResponseErrorType.general ? result.error : "";
            dispatch(setObjectOnLoadFetchState(false, errorMessage));
            return;
        }

        // Update fetch status
        dispatch(setObjectOnLoadFetchState(false, ""));

        // Start loading composite objects
        dispatch(loadCompositeSubobjectsFetch(0));
    };
};


/**
 * Handles "Save" button click on new object page.
 */
export const addObjectOnSaveFetch = () => {
    return async (dispatch, getState) => {
        let state = getState();

        // Exit if already fetching
        if (isFetchingObject(state)) return;

        // Run fetch & add object
        dispatch(setObjectOnSaveFetchState(true, ""));
        const result = await dispatch(addObjectFetch(getCurrentObject(state)));

        // Handle fetch errors
        const responseErrorType = getResponseErrorType(result);
        if (responseErrorType > enumResponseErrorType.none) {
            const errorMessage = responseErrorType === enumResponseErrorType.general ? result.error : "";
            dispatch(setObjectOnSaveFetchState(false, errorMessage));
            return;
        }

        // Handle successful fetch end
        dispatch(setObjectOnSaveFetchState(false, ""));
        dispatch(setRedirectOnRender(`/objects/edit/${result.object_id}`, { deleteNewObject: true }));
    };
};


/**
 * Fetches attributes, tags and data of an existing object with the provided `object_id` and adds them to state.editedObjects, if the object was not already edited.
 */
export const editObjectOnLoadFetch = object_id => {
    return async (dispatch, getState) => {
        // Set initial page state
        dispatch(loadEditObjectPage(object_id));

        // Exit if object_id is not valid
        object_id = parseInt(object_id);
        if (!(object_id > 0)) {
            dispatch(setObjectOnLoadFetchState(false, "Object not found."));
            return;
        }

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

            // Handle fetch errors
            const responseErrorType = getResponseErrorType(result);
            if (responseErrorType > enumResponseErrorType.none) {
                const errorMessage = responseErrorType === enumResponseErrorType.general ? result.error : "";
                dispatch(setObjectOnLoadFetchState(false, errorMessage));
                return;
            }
        } else {
            // Fetch missing tags if object attributes, tags & data are present in the state
            let result = await dispatch(getNonCachedTags(state.objectsTags[object_id]));

            // Handle fetch errors
            const responseErrorType = getResponseErrorType(result);
            if (responseErrorType > enumResponseErrorType.none) {
                const errorMessage = responseErrorType === enumResponseErrorType.general ? result.error : "";
                dispatch(setObjectOnLoadFetchState(false, errorMessage));
                return;
            }
        }

        // Add an entry for the object in state.editedObjects if it doesn't exist and set object attributes, tags and data into it
        if (setEditedObjects) dispatch(resetEditedObjects({}));  // object_id is taken from state.objectUI.currentObjectID (which was set by loadEditObjectPage)

        // Get non-cached added existing tag information
        const addedExistingTagIDs = getState().editedObjects[object_id].addedTags.filter(tag => typeof(tag) === "number");
        let result = await dispatch(getNonCachedTags(addedExistingTagIDs));
        const responseErrorType = getResponseErrorType(result);
        if (responseErrorType > enumResponseErrorType.none) {
            const errorMessage = responseErrorType === enumResponseErrorType.general ? result.error : "";
            dispatch(setObjectOnLoadFetchState(false, errorMessage));
            return;
        }

        // Run composite object's subobject data load without awaiting it
        dispatch(loadCompositeSubobjectsFetch(object_id));

        // End fetch
        dispatch(setObjectOnLoadFetchState(false, ""));
    };
};


/**
 * Handles "Save" button click on existing object page.
 */
export const editObjectOnSaveFetch = () => {
    return async (dispatch, getState) => {
        let state = getState();

        // Exit if already fetching
        if (isFetchingObject(state)) return;

        // Run fetch & update object
        dispatch(setObjectOnSaveFetchState(true, ""));
        const result = await dispatch(updateObjectFetch(getCurrentObject(state)));
        
        // Handle fetch errors
        const responseErrorType = getResponseErrorType(result);
        if (responseErrorType > enumResponseErrorType.none) {
            const errorMessage = responseErrorType === enumResponseErrorType.general ? result.error : "";
            dispatch(setObjectOnSaveFetchState(false, errorMessage));
            return;
        }

        // Handle successful fetch end
        dispatch(setEditedObjectTags({ currentTagIDs: getState().objectsTags[result.object_id], added: [], removed: [] }));
        dispatch(setEditedObject(result));
        dispatch(setObjectOnSaveFetchState(false, ""));
    };        
};


/**
 * Handles delete confirmation button click on existing object page.
 * 
 * If `deleteSubobjects` is true, deletes all subobjects along with the composite object.
 */
export const editObjectOnDeleteFetch = deleteSubobjects => {
    return async (dispatch, getState) => {
        // Exit if already fetching
        let state = getState();
        if (isFetchingObject(state)) return;

        // Hide delete dialog
        dispatch(setShowDeleteDialogObject(false));

        // Run fetch & delete object data from state
        dispatch(setObjectOnSaveFetchState(true, ""));
        const result = await dispatch(deleteObjectsFetch( [state.objectUI.currentObjectID], deleteSubobjects ));

        // Handle fetch errors
        const responseErrorType = getResponseErrorType(result);
        if (responseErrorType > enumResponseErrorType.none) {
            const errorMessage = responseErrorType === enumResponseErrorType.general ? result.error : "";
            dispatch(setObjectOnSaveFetchState(false, errorMessage));
            return;
        }

        // Handle successful fetch end
        dispatch(setRedirectOnRender("/objects/list"));
    };      
};


/**
 * Handles objects tags dropdown with matching tags update.
 */
export const objectTagsDropdownFetch = ({queryText, existingIDs}) => {
    return async (dispatch, getState) => {
        // Input text at the start of the query
        const inputText = getState().objectUI.tagsInput.inputText;

        // Run fetch & update matching tags
        const result = await dispatch(tagsSearchFetch({queryText, existingIDs}));

        if (getResponseErrorType(result) === enumResponseErrorType.none) {
            const currentInputText = getState().objectUI.tagsInput.inputText;

            // Reset matching IDs if an item was added before the fetch start
            if (inputText.length === 0) {
                dispatch(setObjectTagsInput({ matchingIDs: [] }));
                return;
            }

            // Update matching tags if input text didn't change during fetch
            if (inputText === currentInputText) dispatch(setObjectTagsInput({ matchingIDs: result }));
        }
    };
};


/**
 * Handles composite object add subobject dropdown values update.
 */
export const compositeSubobjectDropdownFetch = ({queryText, existingIDs}) => {
    return async (dispatch, getState) => {
        // Exit fetch if an item was added before the start of the fetch
        const inputText = getState().objectUI.addCompositeSubobjectMenu.inputText;
        if (inputText.length === 0) return;

        // Run fetch & update matching tags
        const result = await dispatch(objectsSearchFetch({queryText, existingIDs}));

        if (getResponseErrorType(result) === enumResponseErrorType.none) {
            // Update matching tags if input text didn't change during fetch
            if (inputText === getState().objectUI.addCompositeSubobjectMenu.inputText) dispatch(setAddCompositeSubobjectMenu({ matchingIDs: result }));
        }
    };
}


/**
 * Fetches missing subobject attributes/tags/data of composite object with provided `objectID`.
 * 
 * Does nothing if the object is not composite.
 */
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
            if (getResponseErrorType(result) !== enumResponseErrorType.none) {
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
            && !(objID in state.editedObjects));

        // Add objects to state.editedObjects
        if (subobjectIDsToAddToEditedObjects.length > 0)
            dispatch(resetEditedObjects({ objectIDs: subobjectIDsToAddToEditedObjects }));
    };
};
