import { objectsBulkUpsertFetch, objectsViewFetch, objectsDeleteFetch, objectsSearchFetch } from "../data/objects";
import { fetchMissingTags, tagsSearchFetch } from "../data/tags";

import { setRedirectOnRender } from "../../reducers/common";
import { loadObjectsEditNewPage, loadObjectsEditExistingPage, setObjectsEditLoadFetchState, 
    setObjectsEditSaveFetchState, setObjectsEditTagsInput, setObjectsEditShowDeleteDialog, 
    setAddCompositeSubobjectMenu, setToDoListRerenderPending
} from "../../reducers/ui/objects-edit";
import { loadEditedObjects, updateEditedComposite } from "../../reducers/data/edited-objects";
import { deleteObjects } from "../../reducers/data/objects";

import { ObjectsSelectors } from "../../store/selectors/data/objects/objects";
import { EditedObjectsSelectors } from "../../store/selectors/data/objects/edited-objects";
import { ObjectsEditSelectors } from "../../store/selectors/ui/objects-edit";

import type { Dispatch, GetState } from "../../types/store/store";
import { positiveInt } from "../../types/common";


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
 * Handles "Save" button click on the /objects/edit/:id page (uses bulk upsert fetch).
 */
export const objectsEditSaveFetch = () => {
    return async (dispatch: Dispatch, getState: GetState): Promise<void> => {
        // Exit if already fetching
        let state = getState();
        if (ObjectsEditSelectors.isFetching(state)) return;

        // Get edited objects to be upserted, deleted & removed from state (the latter is additionally filtered later)
        const { currentObjectID } = state.objectsEditUI;
        const {upsertedObjectIDs, deletedObjectIDs, removedFromStateObjectIDs } = 
            EditedObjectsSelectors.getUpsertedDeletedAndRemovedObjectIDs(state, currentObjectID);
        const upsertedEditedObjects = upsertedObjectIDs.map(objectID => state.editedObjects[objectID]);

        // Exit, if current object if marked for full deletion
        if (deletedObjectIDs.includes(currentObjectID)) {
            dispatch(setObjectsEditSaveFetchState(false, "Cannot save object marked for full deletion."));
            return;
        }

        // Run upsert fetch
        dispatch(setObjectsEditSaveFetchState(true, ""));
        const upsertResult = await dispatch(objectsBulkUpsertFetch(upsertedEditedObjects, deletedObjectIDs));
        
        // Handle fetch errors
        if (upsertResult.failed) {
            dispatch(setObjectsEditSaveFetchState(false, upsertResult.error!));
            return;
        }

        // Fetch non cached tags
        if (!("response" in upsertResult)) throw Error("Missing `response` in successful fetch result.");
        const allObjectsTags: Set<number> = new Set();
        upsertResult.response.objects_attributes_and_tags.forEach(object => object.current_tag_ids.forEach(tagID => allObjectsTags.add(tagID)));
        const fetchMissingTagsResult = await dispatch(fetchMissingTags([...allObjectsTags]));

        // Handle tag fetch errors
        if (fetchMissingTagsResult.failed) {
            dispatch(setObjectsEditSaveFetchState(false, fetchMissingTagsResult.error!));
            return;
        }

        // Load returned data into edited objects
        const objectIDs = upsertResult.response.objects_attributes_and_tags.map(oa => oa.object_id);
        dispatch(loadEditedObjects(objectIDs));

        // Trigger to-do list rerender
        dispatch(setToDoListRerenderPending(true));

        // Disable fetch placeholder
        dispatch(setObjectsEditSaveFetchState(false, ""));

        // Redirect from new to existing object's page
        if (currentObjectID <= 0) {
            const mappedObjectID = upsertResult.response.new_object_ids_map[currentObjectID];
            dispatch(setRedirectOnRender(`/objects/edit/${mappedObjectID}`));
        }

        // Get final list of objects, deleted from state:
        // - add existing objects, which were created during the fetch;
        // - exclude new current edited object & its subobjects.
        const newCurrentObjectID = currentObjectID > 0 ? currentObjectID : upsertResult.response.new_object_ids_map[currentObjectID];
        const displayedObjectIDs = EditedObjectsSelectors.objectAndSubobjectIDs(getState(), [newCurrentObjectID]);
        const finalRemovedObjectIDs = removedFromStateObjectIDs
            .concat(Object.values(upsertResult.response.new_object_ids_map))
            .filter(id => !displayedObjectIDs.includes(id));

        // Delete object data, which is no longer used
        dispatch(deleteObjects(finalRemovedObjectIDs, false));
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


/**
 * Handles composite object add subobject dropdown values update.
 */
export const objectsEditCompositeSubobjectDropdownFetch = (queryText: string, existingIDs: number[]) => {
    return async (dispatch: Dispatch, getState: GetState): Promise<void> => {
        // Exit fetch if an item was added before the start of the fetch
        const inputText = getState().objectsEditUI.addCompositeSubobjectMenu.inputText;
        if (inputText.length === 0) return;

        // Run fetch & update matching objects
        const result = await dispatch(objectsSearchFetch(queryText, existingIDs));

        if (!result.failed) {
            // Update matching tags if input text didn't change during fetch
            if (!("object_ids" in result)) throw Error("Missing object_ids in correct fetch result.");
            if (inputText === getState().objectsEditUI.addCompositeSubobjectMenu.inputText)
                dispatch(setAddCompositeSubobjectMenu({ matchingIDs: result.object_ids }));
        }
    };
};


/**
 * Fetches missing subobject attributes/tags/data of composite object with provided `objectID`.
 * 
 * Does nothing if the object is not composite.
 */
export const objectsEditLoadCompositeSubobjectsFetch = (objectID: number) => {
    return async (dispatch: Dispatch, getState: GetState): Promise<void> => {
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
            let nonCachedSubobjectIDs = [...new Set(subobjectIDsWithMissingAttributesOrTags.concat(subobjectIDsWithMissingData))];
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
            if (!("objects_attributes_and_tags" in objectsViewResult)) throw Error("Missing objects in successful fetch result.");
            let returnedObjectIDs = objectsViewResult["objects_attributes_and_tags"].map(object => object.object_id);
            let notFoundObjectIDs = subobjectIDsWithMissingAttributesOrTags.filter(objectID => returnedObjectIDs.indexOf(objectID) === -1);
            let returndedObjectDataIDs = objectsViewResult["objects_data"].map(object => object.object_id);
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
