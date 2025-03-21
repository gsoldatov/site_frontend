import { FetchRunner, FetchResult } from "../fetch-runner";

import { fetchMissingTags } from "./tags";

import { updateObjectsTags } from "../../reducers/data/objects-tags";
import { updateObjectsAttributes } from "../../reducers/data/objects";
import { loadEditedObjectsTags } from "../../reducers/data/edited-objects";

import { objectsUpdateTagsResponseSchema } from "../../types/fetches/data/objects-tags";
import type { Dispatch, GetState } from "../../types/store/store";


/**
 * Fetches backend update tags of objects with provided `object_ids` with `added_tags` and `removed_tag_ids`.
 * 
 * Fetches non-cached tags and updates objects' attributes and tags in case of success.
 * 
 */
export const objectsTagsUpdateFetch = (object_ids: number[], added_tags: (string | number)[], removed_tag_ids: number[]) => {
    return async (dispatch: Dispatch, getState: GetState): Promise<FetchResult> => {
        // Fetch backend
        const runner = new FetchRunner("/objects/update_tags", { method: "PUT", body: { object_ids, added_tags, removed_tag_ids }});
        const result = await runner.run();

        // Handle response
        switch (result.status) {
            case 200:
                // Parse response
                const { tag_updates, modified_at } = objectsUpdateTagsResponseSchema.parse(result.json);

                // Update modified_at attributes of the objects
                const objectUpdates = object_ids.map(object_id => ({ object_id, modified_at }));
                dispatch(updateObjectsAttributes(objectUpdates));

                // Update objects tags
                const { added_tag_ids = [], removed_tag_ids = [] } = tag_updates;
                dispatch(updateObjectsTags(object_ids, added_tag_ids, removed_tag_ids));

                // Reset all updated objects' tags and modified_at in state.editedObjects
                // NOTE: this is done after state.objectsTags is set
                dispatch(loadEditedObjectsTags(object_ids, modified_at));

                // Fetch non-cahced tags
                const fetchMissingTagsResult = await dispatch(fetchMissingTags(tag_updates.added_tag_ids || []));
                if (fetchMissingTagsResult.failed) return fetchMissingTagsResult;

                // Successfully end fetch
                return result;
            default:
                return result;
        }
    };
};
