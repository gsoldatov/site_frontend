import { FetchRunner, FetchResult, FetchErrorType } from "../fetch-runner";

import { addTags, deleteTags } from "../../reducers/data/tags";
import { deselectTags } from "../../reducers/ui/tags-list";
import { TagsSelectors } from "../../store/selectors/data/tags";

import { tag } from "../../store/types/data/tags";
import { tagsAddTagSchema, tagsSearchResponseSchema, tagsUpdateTagSchema, tagsViewResponseSchema } from "../types/data/tags";
import type { TagsAddTagSchema, TagsUpdateTagSchema } from "../types/data/tags";
import type { Dispatch, GetState } from "../../util/types/common";
import type { TagsAddFetchResult, TagsUpdateFetchResult, TagsSearchFetchResult } from "../types/data/tags";


/**
 * Fetches backend to add provided `tagAttributes` as a new tag. 
 * 
 * Adds the new tag to the state in case of success.
 */
export const tagsAddFetch = (tagAttributes: TagsAddTagSchema) => {
    return async (dispatch: Dispatch, getState: GetState): Promise<TagsAddFetchResult> => {
        // Ensure correct tag attributes
        tagAttributes = tagsAddTagSchema.parse(tagAttributes);

        // Check if tag_name already exists in local storage
        if (TagsSelectors.getTagIDByName(getState(), tagAttributes.tag_name) !== undefined)
            return FetchResult.fetchNotRun({ error: "Tag name already exists.", errorType: FetchErrorType.general });
        
        // Fetch backend
        const runner = new FetchRunner("/tags/add", { method: "POST", body: { tag: tagAttributes }});
        const result = await runner.run();

        // Handle response
        switch (result.status) {
            case 200:
                const tagFromResponse = tag.parse(result.json?.tag);
                dispatch(addTags([tagFromResponse]));
                (result as TagsAddFetchResult).tag = tagFromResponse;
                return result;
            default:
                return result;
        }
    };
};


/**
 * Fetches backend to update provided `tag` data.
 * 
 * Updates the tag in the state in case of success.
 */
export const tagsUpdateFetch = (tagAttributes: TagsUpdateTagSchema) => {
    return async (dispatch: Dispatch, getState: GetState): Promise<TagsUpdateFetchResult> => {
        // Ensure correct tag attributes
        tagAttributes = tagsUpdateTagSchema.parse(tagAttributes);

        // Check if tag_name already exists in local storage
        if (TagsSelectors.getTagIDByName(getState(), tagAttributes.tag_name, tagAttributes.tag_id) !== undefined)
            return FetchResult.fetchNotRun({ error: "Tag name already exists.", errorType: FetchErrorType.general });

        // Fetch backend
        const runner = new FetchRunner("/tags/update", { method: "PUT", body: { tag: tagAttributes }});
        const result = await runner.run();

        switch (result.status) {
            case 200:
                const tagFromResponse = tag.parse(result.json?.tag);
                dispatch(addTags([tagFromResponse]));
                (result as TagsUpdateFetchResult).tag = tagFromResponse;
                return result;
            case 404:
                result.error = "Tag nto found."
                return result;
            default:
                return result;
        }
    };
};


/**
 * Fetches backend to retrieve tags with provided `tagIDs`.
 * 
 * Adds the tags to the state in case of success.
 */
export const tagsViewFetch = (tagIDs: (string | number)[]) => {
    return async (dispatch: Dispatch, getState: GetState): Promise<FetchResult> => {
        const tag_ids = tagIDs.map(id => parseInt(id as string));

        // Fetch backend
        const runner = new FetchRunner("/tags/view", { method: "POST", body: { tag_ids }});
        const result = await runner.run();

        // Handle response
        switch (result.status) {
            case 200:
                const { tags } = tagsViewResponseSchema.parse(result.json);
                dispatch(addTags(tags));
                return result;
            case 404:
                result.error = tagIDs.length > 1 ? "Tags not found." : "Tag not found.";
                return result;
            default:
                return result;
        }
    }; 
};


/**
 * Fetches missing tags, ids of which are listed in `tagIDs`.
 * Filters out non-numeric IDs (new tag case).
 */
export const fetchMissingTags = (tagIDs: (string | number)[]) => {
    return async (dispatch: Dispatch, getState: GetState): Promise<FetchResult> => {
        const { tags } = getState();
        const nonCachedTags = tagIDs.filter(id => !(id in tags) && !isNaN(id as number));
        if (nonCachedTags.length !== 0) return await dispatch(tagsViewFetch(nonCachedTags));
        return FetchResult.fetchNotRun();
    };
};


/**
 * Fetches backend to delete tags with provided `tagIDs`.
 * 
 * Deletes the tags from the state in case of success.
 */
export const tagsDeleteFetch = (tagIDs: (string | number)[]) => {
    return async (dispatch: Dispatch, getState: GetState): Promise<FetchResult> => {
        const tag_ids = tagIDs.map(id => parseInt(id as string));
        
        // Fetch backend
        const runner = new FetchRunner("/tags/delete", { method: "DELETE", body: { tag_ids }});
        const result = await runner.run();

        switch (result.status) {
            case 200:
            case 404:   // Tags not present in the database should be deleted from state
                dispatch(deselectTags(tag_ids));
                dispatch(deleteTags(tag_ids));
                return result;
            default:
                return result;
        }
    }; 
};


/**
 * Fetches backend to get tags which match provided `query_text` and are not present in `existing_ids`.
 * 
 * Fetches non-cached tags in case of success.
 */
export const tagsSearchFetch = (query_text: string, existing_ids: number[]) => {
    return async (dispatch: Dispatch, getState: GetState): Promise<TagsSearchFetchResult> => {
        // Check params
        if (query_text.length === 0 || query_text.length > 255)
            return FetchResult.fetchNotRun({ errorType: FetchErrorType.general, error: "Query text is empty or too long." });
        if (existing_ids.length > 1000)
            return FetchResult.fetchNotRun({ errorType: FetchErrorType.general, error: "Existing IDs list is too long." });
        
        // Fetch backend
        const body = { query: { query_text, existing_ids, maximum_values: 10 }};
        const runner = new FetchRunner("/tags/search", { method: "POST", body });
        const result = await runner.run();

        switch (result.status) {
            case 200:
                const tagIDs = tagsSearchResponseSchema.parse(result.json).tag_ids;

                // Fetch non-cahced tags
                const fetchMissingTagsResult = await dispatch(fetchMissingTags(tagIDs));
                if (fetchMissingTagsResult.failed) return fetchMissingTagsResult;

                // Successfully finish the fetch
                (result as TagsSearchFetchResult).tagIDs = tagIDs;
                return result;
            case 404:
                (result as TagsSearchFetchResult).tagIDs = [];
                return result;
            default:
                return result;
        }
    };
};
