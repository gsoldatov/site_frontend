import { getResponseErrorType } from "./common";
import { objectsAddFetch, objectsUpdateFetch } from "./data-objects";

import { setRedirectOnRender } from "../reducers/common";
import { setObjectsEditSaveFetchState } from "../reducers/ui/objects-edit";
import { updateEditedObject, editedObjectsPreSaveUpdate } from "../reducers/data/edited-objects";

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
