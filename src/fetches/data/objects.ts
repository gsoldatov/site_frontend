import { ZodError } from "zod";

import { FetchRunner, FetchResult, FetchErrorType } from "../fetch-runner";

import { fetchMissingTags } from "../data/tags";

import { addObjectsTags } from "../../reducers/data/objects-tags";
import { deleteObjects } from "../../reducers/data/objects";
import { addObjectsAttributes, addObjectsDataFromBackend } from "../../reducers/data/objects";

import { EditedObjectsTransformers } from "../../store/transformers/data/edited-objects";
import { ObjectsSelectors } from "../../store/selectors/data/objects/objects";
import { parseObjectsBulkUpsertZodValidationErrors } from "../../util/errors/objects-edit";

import type { Dispatch, GetState } from "../../types/store/store";
import type { EditedObject } from "../../types/store/data/edited-objects";
import {
    objectsGetPageObjectIDsResponseSchema, objectsPaginationInfo, objectsSearchResponseSchema, 
    objectsViewCompositeHierarchyElementsResponseSchema, objectsViewResponseSchema, 
    type ObjectsViewFetchResult, type ObjectsSearchFetchResult, type ObjectsGetPageObjectIDsFetchResult, 
    type ObjectsPaginationInfo, type ObjectsViewCompositeHierarchyElementsFetchResult
} from "../../types/fetches/data/objects/general";
import { objectsBulkUpsertRequestBody, objectsBulkUpsertResponseSchema,
    type ObjectsBulkUpsertFetchResult } from "../../types/fetches/data/objects/bulk_upsert";


/**
 * Upserts data of `editedObjects` to backend.
 * 
 * Adds their attributes, tags and data to the store.
 */
export const objectsBulkUpsertFetch = (editedObjects: EditedObject[], deleted_object_ids: number[]) => {
    return async (dispatch: Dispatch, getState: GetState): Promise<ObjectsBulkUpsertFetchResult> => {
        if (editedObjects.length === 0) return FetchResult.fetchNotRun({ errorType: FetchErrorType.general, error: "No objects were provided for upsert." });
        let body;

        try {
            // Validate and serialize edited objects
            const objects = editedObjects.map(eo => EditedObjectsTransformers.toObjectsBulkUpsertBody(eo));
            body = objectsBulkUpsertRequestBody.parse({ objects, deleted_object_ids });
        } catch (e) {
            // Handle validation errors
            if (e instanceof ZodError) {
                const { currentObjectID } = getState().objectsEditUI;
                const error = parseObjectsBulkUpsertZodValidationErrors(e, editedObjects, currentObjectID);
                return FetchResult.fetchNotRun({ errorType: FetchErrorType.general, error });
            }
            throw e;
        }

        // Fetch backend
        const runner = new FetchRunner("/objects/bulk_upsert", { method: "POST", body });
        const result = await runner.run();
        
            // Handle response
        switch (result.status) {
            case 200:
                const data = objectsBulkUpsertResponseSchema.parse(result.json);

                // Add attributes, tags & data
                dispatch(addObjectsAttributes(data.objects_attributes_and_tags));
                dispatch(addObjectsTags(data.objects_attributes_and_tags));
                dispatch(addObjectsDataFromBackend(data.objects_data));

                // Return fetch result
                return result.withCustomProps({ response: data });
            default:
                return result;
        }
    };
};


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
        const body = {
            object_ids: objectIDsLength > 0 ? objectIDs.map(id => parseInt(id as string)) : [],
            object_data_ids: objectDataIDsLength > 0 ? objectDataIDs.map(id => parseInt(id as string)) : []
        };
        
        const runner = new FetchRunner("/objects/view", { method: "POST", body });
        const result = await runner.run();

        // Handle response
        switch (result.status) {
            case 200:
                const data = objectsViewResponseSchema.parse(result.json);

                // Add objects data
                if (data["objects_data"].length > 0) dispatch(addObjectsDataFromBackend(data["objects_data"]));

                // Set object attributes & fetch non-cached tags
                if (data["objects_attributes_and_tags"].length > 0) {
                    dispatch(addObjectsAttributes(data["objects_attributes_and_tags"]));
                    dispatch(addObjectsTags(data["objects_attributes_and_tags"]));
                    
                    // Fetch non cached tags
                    let allObjectsTags: Set<number> = new Set();
                    data["objects_attributes_and_tags"].forEach(object => object.current_tag_ids.forEach(tagID => allObjectsTags.add(tagID)));
                    const fetchMissingTagsResult = await dispatch(fetchMissingTags([...allObjectsTags]));

                    // Handle tag fetch errors
                    if (fetchMissingTagsResult.failed) return fetchMissingTagsResult;
                }
                
                const { objects_attributes_and_tags, objects_data } = data;
                return result.withCustomProps({ objects_attributes_and_tags, objects_data });
            case 404:
                result.error = Math.max(objectIDs.length, objectDataIDs.length) > 1 ? "Objects not found." : "Object not found.";
                return result;
            default:
                return result;
        }
    }; 
};


/**
 * Fetches missing information for a list of provided `objectIDs`.
 * 
 * Types of missing information (attributes, tags, data) are specified in the `storages` argument.
 */
export const fetchMissingObjects = (objectIDs: (string | number)[], storages: { attributes?: boolean, tags?: boolean, data?: boolean } = {}) => {
    return async (dispatch: Dispatch, getState: GetState): Promise<ObjectsViewFetchResult> => {
        // Set checked storages
        const { attributes, tags, data } = storages;

        // Get objects with missing attributes or tags
        const state = getState();
        let objectIDsWithNonCachedAttributesOrTags: (string | number)[] = [];
        if (attributes) objectIDsWithNonCachedAttributesOrTags = objectIDs.filter(objectID => !(objectID in state.objects));
        if (tags) objectIDsWithNonCachedAttributesOrTags.concat(objectIDs.filter(objectID => !(objectID in state.objectsTags)));

        // Get objects with missing data
        let objectIDsWithNonCachedData: (string | number)[] = [];
        if (data) objectIDsWithNonCachedData = objectIDs.filter(objectID => !ObjectsSelectors.dataIsPresent(state, objectID as number));

        // Fetch missing information
        return await dispatch(objectsViewFetch(objectIDsWithNonCachedAttributesOrTags, objectIDsWithNonCachedData));
    };
};


/**
 * Fetches backend to delete objects with provided `object_ids`.
 * 
 * Deletes the objects from the state in case of success or if objects are not found.
 * 
 * If `delete_subobjects` is true, deletes all subobjects of composite objects in `object_ids` on backend and in local state.
 */
export const objectsDeleteFetch = (object_ids: (string | number)[], delete_subobjects: boolean) => {
    return async (dispatch: Dispatch, getState: GetState): Promise<FetchResult> => {
        // Fetch backend
        object_ids = object_ids.map(id => parseInt(id as string));
        const runner = new FetchRunner("/objects/delete", { method: "DELETE", body: { object_ids, delete_subobjects }});
        const result = await runner.run();

        // Handle response
        switch (result.status) {
            case 200:
            case 404:   // Objects not present in the database should be deleted from state
                dispatch(deleteObjects(object_ids as number[], delete_subobjects));
                return result.withCustomProps({ errorType: FetchErrorType.none });
            default:
                return result;
        }
    }; 
};


/**
 * Fetches backend to get objects which match provided `query_text` and are not present in `existing_ids`.
 * 
 * Fetches non-cached objects' attributes & tags in case of success.
 * 
 * Returns the array of matching object IDs, if successful.
 */
export const objectsSearchFetch = (query_text: string, existing_ids: number[]) => {
    return async (dispatch: Dispatch, getState: GetState): Promise<ObjectsSearchFetchResult> => {
        // Validate params
        if (query_text.length === 0 || query_text.length > 255) 
            return FetchResult.fetchNotRun({ errorType: FetchErrorType.general, error: "Query text is empty or too long." });
        if (existing_ids.length > 1000) 
            return FetchResult.fetchNotRun({ errorType: FetchErrorType.general, error: "Existing IDs list is too long." });

        // Fetch backend
        const body = { query: { query_text, existing_ids, maximum_values: 10 }};
        const runner = new FetchRunner("/objects/search", { method: "POST", body });
        const searchResult = await runner.run();
        
        // Handle response
        switch (searchResult.status) {
            case 200:
                const { object_ids } = objectsSearchResponseSchema.parse(searchResult.json);

                // Fetch non-cached objects
                const missingObjectsResult = await dispatch(fetchMissingObjects(object_ids, { attributes: true, tags: true }));
                if (missingObjectsResult.failed) return missingObjectsResult;   // Stop if nested fetch failed

                // Successfully end fetch
                return searchResult.withCustomProps({ object_ids });
            case 404:
                // Consider 404 response to be a successful fetch result
                return searchResult.withCustomProps({ errorType: FetchErrorType.none, object_ids: [] });
            default:
                return searchResult;
        }
    };
};


/**
 * Fetches backend for IDs of the objects which correspond to the provided `paginantionInfo` object.
 * 
 * Returns the list of `object_ids` for the current page and `total_items` number of objects matching the query.
 */
export const objectsGetPageObjectIDs = (pagination_info: ObjectsPaginationInfo) => {
    return async (dispatch: Dispatch, getState: GetState): Promise<ObjectsGetPageObjectIDsFetchResult> => {
        // Validate pagination_info
        pagination_info = objectsPaginationInfo.parse(pagination_info);

        // Fetch backend
        const runner = new FetchRunner("/objects/get_page_object_ids", { method: "POST", body: { pagination_info } });
        const result = await runner.run();

        // Handle response
        switch (result.status) {
            case 200:
                const { object_ids, total_items } = objectsGetPageObjectIDsResponseSchema.parse(result.json).pagination_info;
                return result.withCustomProps({ object_ids, total_items });
            default:
                return result;
        }
    };
};


/**
 * Fetches backend to retrieve composite and non-composite objects in the composite hierarchy for the provided `objectID`.
 * 
 * Returns the arrays of composite & non-composite object IDs in the hierarchy, if successful.
 */
export const objectsViewCompositeHierarchyElements = (object_id: number) => {
    return async (dispatch: Dispatch, getState: GetState): Promise<ObjectsViewCompositeHierarchyElementsFetchResult> => {
        // Fetch backend
        const runner = new FetchRunner("/objects/view_composite_hierarchy_elements", { method: "POST", body: { object_id } });
        let result = await runner.run();

        // Handle response
        switch (result.status) {
            case 200:
                const data = objectsViewCompositeHierarchyElementsResponseSchema.parse(result.json);
                return result.withCustomProps(data);
            default:
                return result;
        }
    }; 
};
