import { objectsAddFetch, objectsUpdateFetch } from "../data-objects";
import { objectsViewFetch, objectsDeleteFetch, objectsSearchFetch } from "../data/objects";
import { fetchMissingTags, tagsSearchFetch } from "../data/tags";
import { objectsEditLoadCompositeSubobjectsFetch } from "../ui-objects-edit";

import { setRedirectOnRender } from "../../reducers/common";
import { loadObjectsEditNewPage, loadObjectsEditExistingPage, setObjectsEditLoadFetchState, setObjectsEditSaveFetchState,
    setObjectsEditTagsInput, setObjectsEditShowDeleteDialog, setAddCompositeSubobjectMenu
} from "../../reducers/ui/objects-edit";
import { loadEditedObjects, updateEditedComposite, updateEditedObject, editedObjectsPreSaveUpdate } from "../../reducers/data/edited-objects";

import { ObjectsSelectors } from "../../store/selectors/data/objects/objects";
import { ObjectsEditSelectors } from "../../store/selectors/ui/objects-edit";

import type { Dispatch, GetState } from "../../store/types/store";
import { positiveInt } from "../../util/types/common";


/**
 * Loads default state of /objects/edit/new page, missing tags & composite object's subobject data.
 */
export const objectsEditNewOnLoad = () => {
    return async (dispatch: Dispatch, getState: GetState): Promise<void> => {
        // Load initial page state and start loading composite subobjects
        dispatch(loadObjectsEditNewPage());

        // Fetch tag data of added tags, if it's missing
        // Update fetch status
        dispatch(setObjectsEditLoadFetchState(true, ""));

        // Fetch missing tags if object attributes, tags & data are present in the state
        let result = await dispatch(fetchMissingTags(getState().editedObjects[0].addedTags));

        // Handle fetch errors
        if (result.failed) {
            dispatch(setObjectsEditLoadFetchState(false, result.error!));
            return;
        }

        // Update fetch status
        dispatch(setObjectsEditLoadFetchState(false, ""));

        // Start loading composite objects
        dispatch(objectsEditLoadCompositeSubobjectsFetch(0));
    };
};


/**
 * Fetches attributes, tags and data of an existing object with the provided `objectID`.
 * Adds `objectID` to state.editedObjects, if it's not there.
 * Triggers load of composite subobject data.
 */
export const objectsEditExistingOnLoad = (objectID: number) => {
    return async (dispatch: Dispatch, getState: GetState): Promise<void> => {
        // Set initial page state (or display an error for invalid `objectID`)
        dispatch(loadObjectsEditExistingPage(objectID));

        // Exit if objectID is not valid
        const currentObjectValidation = positiveInt.safeParse(objectID);
        if (!currentObjectValidation.success) return;

        // Update fetch status
        const object_id = currentObjectValidation.data;
        dispatch(setObjectsEditLoadFetchState(true, ""));
        
        // Check if object attributes, tags and data should be fetched and/or added to state.editedObjects
        let state = getState();
        let setEditedObjects = true, fetchAttributesAndTags = true, fetchData = true;
        if (object_id in state.editedObjects) setEditedObjects = false;
        if (object_id in state.objects && object_id in state.objectsTags) fetchAttributesAndTags = false;
        if (ObjectsSelectors.dataIsPresent(state, object_id)) fetchData = false;

        // Fetch object attributes, tags and/or data if they are missing
        if (fetchAttributesAndTags || fetchData) {
            let objectIDs = fetchAttributesAndTags ? [object_id] : undefined;
            let objectDataIDs = fetchData ? [object_id] : undefined;
            const objectsViewResult = await dispatch(objectsViewFetch(objectIDs, objectDataIDs));

            // Handle errors
            if (objectsViewResult.failed) {
                dispatch(setObjectsEditLoadFetchState(false, objectsViewResult.error!));
                return;
            }
        } else {
            // Fetch missing tags if object attributes, tags & data are present in the state
            let result = await dispatch(fetchMissingTags(state.objectsTags[object_id]));

            // Handle fetch errors
            if (result.failed) {
                dispatch(setObjectsEditLoadFetchState(false, result.error!));
                return;
            }
        }

        // Add an entry for the object in state.editedObjects if it doesn't exist and set object attributes, tags and data into it
        if (setEditedObjects) dispatch(loadEditedObjects([objectID]));

        // Get non-cached added existing tag information
        const addedExistingTagIDs = getState().editedObjects[object_id].addedTags.filter(tag => typeof(tag) === "number");
        let result = await dispatch(fetchMissingTags(addedExistingTagIDs));

        // Handle fetch errors
        if (result.failed) {
            dispatch(setObjectsEditLoadFetchState(false, result.error!));
            return;
        }

        // Run composite object's subobject data load without awaiting it
        dispatch(objectsEditLoadCompositeSubobjectsFetch(object_id));

        // End fetch
        dispatch(setObjectsEditLoadFetchState(false, ""));
    };
};


/**
 * Handles delete confirmation button click on existing object page.
 * 
 * If `deleteSubobjects` is true, deletes all subobjects along with the composite object.
 */
export const objectsEditExistingDeleteFetch = (deleteSubobjects: boolean) => {
    return async (dispatch: Dispatch, getState: GetState): Promise<void> => {
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
            dispatch(setObjectsEditSaveFetchState(false, result.error!));
            return;
        }

        // Handle successful fetch end
        dispatch(setRedirectOnRender("/objects/list"));
    };      
};


/**
 * Handles objects tags dropdown with matching tags update.
 */
export const objectsEditTagsDropdownFetch = (queryText: string, existingIDs: number[]) => {
    return async (dispatch: Dispatch, getState: GetState): Promise<void> => {
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
