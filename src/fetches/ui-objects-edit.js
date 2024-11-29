import { objectsAddFetch, objectsUpdateFetch } from "./data/objects";

import { setRedirectOnRender } from "../reducers/common";
import { setObjectsEditSaveFetchState } from "../reducers/ui/objects-edit";
import { updateEditedObject, editedObjectsPreSaveUpdate } from "../reducers/data/edited-objects";

import { ObjectsEditSelectors } from "../store/selectors/ui/objects-edit";


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
        if (result.failed) {
            dispatch(setObjectsEditSaveFetchState(false, result.error));
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
        if (result.failed) {
            dispatch(setObjectsEditSaveFetchState(false, result.error));
            return;
        }

        // Handle successful fetch end
        const { object } = result;
        dispatch(updateEditedObject(object.object_id, 
            { ...object, currentTagIDs: getState().objectsTags[object.object_id], addedTags: [], removedTagIDs: [] }
        ));
        dispatch(setObjectsEditSaveFetchState(false, ""));
    };        
};
