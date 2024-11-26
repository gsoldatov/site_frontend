import { getResponseErrorType } from "./common";
import { objectsAddFetch, objectsUpdateFetch } from "./data-objects";
import { objectsViewFetch } from "./data/objects";

import { setRedirectOnRender } from "../reducers/common";
import { setObjectsEditSaveFetchState } from "../reducers/ui/objects-edit";
import { loadEditedObjects, updateEditedComposite, updateEditedObject, editedObjectsPreSaveUpdate } from "../reducers/data/edited-objects";

import { ObjectsSelectors } from "../store/selectors/data/objects/objects";
import { ObjectsEditSelectors } from "../store/selectors/ui/objects-edit";
import { enumResponseErrorType } from "../util/enums/enum-response-error-type";


/**
 * Handles "Save" button click on new object page.
 */
export const objectsEditNewSaveFetch = () => {
    return async (dispatch, getState) => {
        let state = getState();

        // Exit if already fetching
        if (ObjectsEditSelectors.isFetching(state)) return;

        // Prepare edited objects' data for fetch
        dispatch(editedObjectsPreSaveUpdate());

        // Run fetch & add object
        dispatch(setObjectsEditSaveFetchState(true, ""));
        const result = await dispatch(objectsAddFetch(ObjectsEditSelectors.currentObject(state)));

        // Handle fetch errors
        const responseErrorType = getResponseErrorType(result);
        if (responseErrorType > enumResponseErrorType.none) {
            const errorMessage = responseErrorType === enumResponseErrorType.general ? result.error : "";
            dispatch(setObjectsEditSaveFetchState(false, errorMessage));
            return;
        }

        // Handle successful fetch end
        dispatch(setObjectsEditSaveFetchState(false, ""));
        dispatch(setRedirectOnRender(`/objects/edit/${result.object_id}`, { deleteNewObject: true }));
    };
};


/**
 * Handles "Save" button click on existing object page.
 */
export const objectsEditExistingSaveFetch = () => {
    return async (dispatch, getState) => {
        let state = getState();

        // Exit if already fetching
        if (ObjectsEditSelectors.isFetching(state)) return;

        // Prepare edited objects' data for fetch
        dispatch(editedObjectsPreSaveUpdate());

        // Run fetch & update object
        dispatch(setObjectsEditSaveFetchState(true, ""));
        const result = await dispatch(objectsUpdateFetch(ObjectsEditSelectors.currentObject(state)));
        
        // Handle fetch errors
        const responseErrorType = getResponseErrorType(result);
        if (responseErrorType > enumResponseErrorType.none) {
            const errorMessage = responseErrorType === enumResponseErrorType.general ? result.error : "";
            dispatch(setObjectsEditSaveFetchState(false, errorMessage));
            return;
        }

        // Handle successful fetch end
        dispatch(updateEditedObject(result.object_id, 
            { ...result, currentTagIDs: getState().objectsTags[result.object_id], addedTags: [], removedTagIDs: [] }
        ));
        dispatch(setObjectsEditSaveFetchState(false, ""));
    };        
};


/**
 * Fetches missing subobject attributes/tags/data of composite object with provided `objectID`.
 * 
 * Does nothing if the object is not composite.
 */
export const objectsEditLoadCompositeSubobjectsFetch = objectID => {
    return async (dispatch, getState) => {
        let state = getState();
        
        // Exit if object is not composite or not being edited
        if (state.editedObjects[objectID] === undefined || state.editedObjects[objectID].object_type !== "composite") return;

        // Get subobjects, which should be fetched
        let existingSubobjectIDs = Object.keys(state.editedObjects[objectID].composite.subobjects).map(objID => parseInt(objID)).filter(objID => objID > 0);
        let subobjectIDsWithMissingAttributesOrTags = existingSubobjectIDs.filter(objID => !(objID in state.objects && objID in state.objectsTags));
        let subobjectIDsWithMissingData = existingSubobjectIDs.filter(objID => !ObjectsSelectors.dataIsPresent(state, objID));

        // Fetch missing attributes/tags/data
        if (subobjectIDsWithMissingAttributesOrTags.length > 0 || subobjectIDsWithMissingData.length > 0) {
            // Update fetch status
            let nonCachedSubobjectIDs = new Set(subobjectIDsWithMissingAttributesOrTags.concat(subobjectIDsWithMissingData));
            dispatch(updateEditedComposite(objectID, { command: "setSubobjectsFetchError", fetchError: "", subobjectIDs: nonCachedSubobjectIDs }));
            
            // Fetch subobjects from backend
            const objectsViewResult = await dispatch(objectsViewFetch(subobjectIDsWithMissingAttributesOrTags, subobjectIDsWithMissingData));

            // Handle errors
            if (objectsViewResult.failed) {
                dispatch(updateEditedComposite(objectID, { command: "setSubobjectsFetchError", 
                    fetchError: "Could not fetch object data.", subobjectIDs: nonCachedSubobjectIDs }));
                return;
            }

            // Set fetch error for subobjects which were not fetched
            let returnedObjectIDs = objectsViewResult["objects"].map(object => object.object_id);
            let notFoundObjectIDs = subobjectIDsWithMissingAttributesOrTags.filter(objectID => returnedObjectIDs.indexOf(objectID) === -1);
            let returndedObjectDataIDs = objectsViewResult["object_data"].map(object => object.object_id);
            notFoundObjectIDs = notFoundObjectIDs.concat(subobjectIDsWithMissingData.filter(objectID => returndedObjectDataIDs.indexOf(objectID) === -1));
            if (notFoundObjectIDs.length > 0)
                dispatch(updateEditedComposite(objectID, { command: "setSubobjectsFetchError", 
                    fetchError: "Could not fetch object data.", subobjectIDs: notFoundObjectIDs }));
        }

        // Set which objects should be added to state.editedObjects (successfully fetched & not already present there)
        state = getState();
        let subobjectIDsToAddToEditedObjects = existingSubobjectIDs.filter(objID => objID in state.objects && objID in state.objectsTags && ObjectsSelectors.dataIsPresent(state, objID)
            && !(objID in state.editedObjects));

        // Add objects to state.editedObjects
        if (subobjectIDsToAddToEditedObjects.length > 0)
            dispatch(loadEditedObjects(subobjectIDsToAddToEditedObjects));
    };
};
