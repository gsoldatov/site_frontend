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
