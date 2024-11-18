import { FetchErrorType, FetchResult } from "../fetch-runner";
import { objectsViewFetch, objectsViewCompositeHierarchyElements } from "../data/objects";
import { fetchMissingTags } from "../data/tags";

import { ObjectsSelectors } from "../../store/selectors/data/objects/objects";

import type { Dispatch, GetState } from "../../util/types/common";


/**
 * Fetches attributes, tags and data of an existing object with the provided `objectID`.
 */
export const objectsViewCardOnLoadFetch = (objectID: string | number) => {
    return async (dispatch: Dispatch, getState: GetState): Promise<FetchResult> => {
        // Exit if objectID is not valid
        objectID = parseInt(objectID as string);
        if (!(objectID > 0)) return FetchResult.fetchNotRun({ errorType: FetchErrorType.general, error: "Object not found." });
        
        // Check if object attributes, tags and data should be fetched
        let state = getState();
        let fetchAttributesAndTags = true, fetchData = true;
        if (objectID in state.objects && objectID in state.objectsTags) fetchAttributesAndTags = false;
        if (ObjectsSelectors.dataIsPresent(state, objectID)) fetchData = false;

        // Fetch object attributes, tags and/or data if they are missing
        if (fetchAttributesAndTags || fetchData) {
            let objectIDs = fetchAttributesAndTags ? [objectID] : undefined;
            let objectDataIDs = fetchData ? [objectID] : undefined;
            return await dispatch(objectsViewFetch(objectIDs, objectDataIDs));
        } else {
            // Fetch missing tags if object attributes, tags & data are present in the state
            return await dispatch(fetchMissingTags(state.objectsTags[objectID]));
        }
    };
};


/**
 * Fetches missing subobject attributes and data of a composite object displayed in <ObjectDataCompositeGroupedLinks> component.
 */
export const objectsViewGroupedLinksOnLoad = (objectID: string | number) => {
    return async (dispatch: Dispatch, getState: GetState): Promise<FetchResult> => {
        objectID = parseInt(objectID as string);
        if (!(objectID > 0)) return FetchResult.fetchNotRun({ errorType: FetchErrorType.general, error: "Object not found." });
        
        const state = getState();
        const subobjectIDs = Object.keys(state.composite[objectID].subobjects).map(id => parseInt(id));
        const subobjectIDsWithNonCachedAttributes = subobjectIDs.filter(suobbjectID => !(suobbjectID in state.objects) || !(suobbjectID in state.objectsTags));
        const subobjectIDsWithNonCachedData = subobjectIDs.filter(subobjectID => !ObjectsSelectors.dataIsPresent(state, subobjectID));

        // Exit, if subobject attributes & data are present
        if (subobjectIDsWithNonCachedAttributes.length === 0 && subobjectIDsWithNonCachedData.length === 0)
            return FetchResult.fetchNotRun();

        // Fetch missing subobject attributes and data
        return await dispatch(objectsViewFetch(subobjectIDsWithNonCachedAttributes, subobjectIDsWithNonCachedData));
    };
};


/**
 * Fetches objects in the composite hierarchy with root object ID `rootObjectID`, then fetches missing attributes, tags & data for objects in the hierarchy.
 */
export const objectsViewCompositeChaptersOnLoad = (rootObjectID: string | number) => {
    return async (dispatch: Dispatch, getState: GetState): Promise<FetchResult> => {
        // Exit if rootObjectID is not valid
        rootObjectID = parseInt(rootObjectID as string);
        if (!(rootObjectID > 0)) return FetchResult.fetchNotRun({ errorType: FetchErrorType.general, error: "Object not found." });

        // Get composite & non-composite objects in the hierarchy
        const viewHierarchyResult = await dispatch(objectsViewCompositeHierarchyElements(rootObjectID));

        // Handle fetch errors
        if (viewHierarchyResult.failed) return viewHierarchyResult;

        // Get missing object attributes, tags & data
        // Also, get missing data of the current object
        if (!("composite" in viewHierarchyResult)) throw Error("Missing composite in correct fetch result.");
        const state = getState();
        const objectIDs = viewHierarchyResult.non_composite.concat(viewHierarchyResult.composite).filter(
            objectID => !(objectID in state.objects && objectID in state.objectsTags));
        const objectDataIDs = viewHierarchyResult.composite.filter(objectID => !ObjectsSelectors.dataIsPresent(state, objectID));

        return await dispatch(objectsViewFetch(objectIDs, objectDataIDs));
    };
};
