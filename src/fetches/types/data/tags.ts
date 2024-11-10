import { z } from "zod";

import { tag } from "../../../store/types/data/tags";
import { nonEmptyPositiveIntArray, positiveInt } from "../../../util/types/common";

import type { FetchResult } from "../../fetch-runner";


/** Schema of new tag's attributes, which are sent to backend during tags add fetch. */
export const tagsAddTagSchema = z.object({
    tag_name: z.string(),
    tag_description: z.string(),
    is_published: z.boolean()
});


/** New tag's attributes, which are sent to backend during tags add fetch. */
export type TagsAddTagSchema = z.infer<typeof tagsAddTagSchema>;


/** Schema of existing tag's attributes, which are sent to backend during tags update fetch. */
export const tagsUpdateTagSchema = z.object({
    tag_id: positiveInt,
    tag_name: z.string(),
    tag_description: z.string(),
    is_published: z.boolean()
});


/** Existing tag's attributes, which are sent to backend during tags update fetch. */
export type TagsUpdateTagSchema = z.infer<typeof tagsUpdateTagSchema>;


/** /tags/view response schema. */
export const tagsViewResponseSchema = z.object({
    tags: tag.array()
});


/** /tags/search response schema. */
export const tagsSearchResponseSchema = z.object({
    tag_ids: nonEmptyPositiveIntArray
});


/** Result type of `tagsSearchFetch`. */
export type TagsSearchFetchResult = FetchResult & { tagIDs?: number[] };
