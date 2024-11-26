import { getResponseErrorType } from "./common";
import { objectsAddFetch, objectsUpdateFetch } from "./data-objects";
import { objectsViewFetch, objectsDeleteFetch, objectsSearchFetch } from "./data/objects";
import { tagsSearchFetch } from "./data/tags";

import { setRedirectOnRender } from "../reducers/common";
import { setObjectsEditSaveFetchState,
    setObjectsEditTagsInput, setObjectsEditShowDeleteDialog, setAddCompositeSubobjectMenu
} from "../reducers/ui/objects-edit";
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
 * Handles delete confirmation button click on existing object page.
 * 
 * If `deleteSubobjects` is true, deletes all subobjects along with the composite object.
 */
export const objectsEditExistingDeleteFetch = deleteSubobjects => {
    return async (dispatch, getState) => {
        // Exit if already fetching
        let state = getState();
        if (ObjectsEditSelectors.isFetching(state)) return;

        // Hide delete dialog
        dispatch(setObjectsEditShowDeleteDialog(false));

        // Run fetch & delete object data from state
        dispatch(setObjectsEditSaveFetchState(true, ""));
        const result = await dispatch(objectsDeleteFetch([state.objectsEditUI.currentObjectID], deleteSubobjects));

        // Handle fetch errors
        if (result.failed) {
            dispatch(setObjectsEditSaveFetchState(false, result.error));
            return;
        }

        // Handle successful fetch end
        dispatch(setRedirectOnRender("/objects/list"));
    };      
};


/**
 * Handles objects tags dropdown with matching tags update.
 */
export const objectsEditTagsDropdownFetch = (queryText, existingIDs) => {
    return async (dispatch, getState) => {
        // Input text at the start of the query
        const inputText = getState().objectsEditUI.tagsInput.inputText;

        // Run fetch
        const result = await dispatch(tagsSearchFetch(queryText, existingIDs));

        // Update matching tags if fetch finished
        if (result.tagIDs !== undefined) {
            const currentInputText = getState().objectsEditUI.tagsInput.inputText;

            // Reset matching IDs if an item was added before the fetch start
            if (inputText.length === 0) {
                dispatch(setObjectsEditTagsInput({ matchingIDs: [] }));
                return;
            }

            // Update matching tags if input text didn't change during fetch
            if (inputText === currentInputText) dispatch(setObjectsEditTagsInput({ matchingIDs: result.tagIDs }));
        }
    };
};


/**
 * Handles composite object add subobject dropdown values update.
 */
export const objectsEditCompositeSubobjectDropdownFetch = (queryText, existingIDs) => {
    return async (dispatch, getState) => {
        // Exit fetch if an item was added before the start of the fetch
        const inputText = getState().objectsEditUI.addCompositeSubobjectMenu.inputText;
        if (inputText.length === 0) return;

        // Run fetch & update matching objects
        const result = await dispatch(objectsSearchFetch(queryText, existingIDs));

        if (!result.failed) {
            // Update matching tags if input text didn't change during fetch
            if (inputText === getState().objectsEditUI.addCompositeSubobjectMenu.inputText) dispatch(setAddCompositeSubobjectMenu({ matchingIDs: result.object_ids }));
        }
    };
}


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
