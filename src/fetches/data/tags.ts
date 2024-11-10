import { FetchRunner, FetchResult, FetchErrorType } from "../fetch-runner";

import { tag } from "../../store/types/data/tags";
import { TagsSelectors } from "../../store/selectors/data/tags";


import { addTags, deleteTags } from "../../reducers/data/tags";
import { updateObjectsTags } from "../../reducers/data/objects-tags";
import { addObjects } from "../../actions/data-objects";
import { deselectTags } from "../../reducers/ui/tags-list";
import { resetEditedObjectsTags } from "../../actions/objects-edit";

import { checkIfTagNameExists } from "../../store/state-util/tags";

import { tagsAddTagSchema, tagsUpdateTagSchema, tagsViewResponseSchema } from "../types/data/tags";

import type { TagsAddTagSchema, TagsUpdateTagSchema } from "../types/data/tags";
import type { Dispatch, GetState } from "../../util/types/common";


/**
 * Fetches backend to add provided `tagAttributes` as a new tag. 
 * 
 * Adds the new tag to the state in case of success.
 */
export const tagsAddFetch = (tagAttributes: TagsAddTagSchema) => {
    return async (dispatch: Dispatch, getState: GetState) => {
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
 * 
 */
export const updateTagFetch = (tagAttributes: TagsUpdateTagSchema) => {
    return async (dispatch: Dispatch, getState: GetState) => {
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
export const viewTagsFetch = (tagIDs: (string | number)[]) => {
    return async (dispatch: Dispatch, getState: GetState) => {
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
export const getNonCachedTags = (tagIDs: (string | number)[]) => {
    return async (dispatch: Dispatch, getState: GetState) => {
        const { tags } = getState();
        const nonCachedTags = tagIDs.filter(id => !(id in tags) && !isNaN(id as number));
        if (nonCachedTags.length !== 0) return await dispatch(viewTagsFetch(nonCachedTags));
        return FetchResult.fetchNotRun();
    };
};


/**
 * Fetches backend to delete tags with provided `tagIDs`.
 * 
 * Deletes the tags from the state in case of success.
 */
export const deleteTagsFetch = (tagIDs: (string | number)[]) => {
    return async (dispatch: Dispatch, getState: GetState) => {
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