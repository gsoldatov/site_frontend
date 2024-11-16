import { FetchRunner, FetchResult, FetchErrorType } from "../fetch-runner";

import { fetchMissingTags } from "../data/tags";

import { objectsViewResponseSchema } from "../types/data/objects";

import { addObjectsTags, updateObjectsTags } from "../../reducers/data/objects-tags";
import { deleteObjects } from "../../actions/data-objects";
import { addObjectsAttributes, addObjectsDataFromBackend } from "../../reducers/data/objects";
// import { setEditedObject, setObjectsEditSaveFetchState } from "../../actions/objects-edit";

// import { validateObject, serializeObjectAttributesAndTagsForAddFetch, serializeObjectAttributesAndTagsForUpdateFetch,
//     serializeObjectData, modifyObjectDataPostSave } from "../../store/state-util/objects";
// import { ObjectsSelectors } from "../../store/selectors/data/objects/objects";

import type { Dispatch, GetState } from "../../util/types/common";
import type { ObjectsViewFetchResult } from "../types/data/objects";


/**
 * Fetches backend to retrieve objects attributes for provided `objectIDs` and object data for `objectDataIDs`.
 * 
 * Adds the objects and data to the state in case of success.
 * 
 * Fetches non-cached tags, if object attributes were fetched for at least one object.
 * 
 * Returns the arrays of object attributes and data returned by backend or an object with `error` attribute containing error message in case of failure.
 */
export const objectsViewFetch = (objectIDs: (string | number)[] = [], objectDataIDs: (string | number)[] = []) => {
    return async (dispatch: Dispatch, getState: GetState): Promise<ObjectsViewFetchResult> => {
        // Exit if both ID lists are empty
        const objectIDsLength = objectIDs.length;
        const objectDataIDsLength = objectDataIDs.length;
        if (objectIDsLength === 0 && objectDataIDsLength === 0) return FetchResult.fetchNotRun();

        // Fetch backend
        const body: { object_ids?: number[], object_data_ids?: number[] } = {};
        if (objectIDsLength > 0) body.object_ids = objectIDs.map(id => parseInt(id as string));
        if (objectDataIDsLength > 0) body.object_data_ids = objectDataIDs.map(id => parseInt(id as string));
        
        const runner = new FetchRunner("/objects/view", { method: "POST", body });
        let result: ObjectsViewFetchResult = await runner.run();

        // Handle response
        switch (result.status) {
            case 200:
                const data = objectsViewResponseSchema.parse(result.json);
                result.objects = data.objects;
                result.object_data = data.object_data;

                // Add objects data
                if (data["object_data"].length > 0) dispatch(addObjectsDataFromBackend(data["object_data"]));

                // Set object attributes & fetch non-cached tags
                if (data["objects"].length > 0) {
                    dispatch(addObjectsAttributes(data["objects"]));
                    dispatch(addObjectsTags(data["objects"]));
                    
                    // Fetch non cached tags
                    let allObjectsTags: Set<number> = new Set();
                    data["objects"].forEach(object => object.current_tag_ids.forEach(tagID => allObjectsTags.add(tagID)));
                    const fetchMissingTagsResult = await dispatch(fetchMissingTags([...allObjectsTags]));

                    // Handle tag fetch errors
                    if (fetchMissingTagsResult.failed) return fetchMissingTagsResult;
                }

                return result;
            case 404:
                result.error = Math.max(objectIDs.length, objectDataIDs.length) > 1 ? "Objects not found." : "Object not found.";
                return result;
            default:
                return result;
        }
    }; 
};