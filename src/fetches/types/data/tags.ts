import { z } from "zod";
import { tag } from "../../../store/types/data/tags";


/** Schema of new tag's attributes, which are sent to backend on tag add. */
export const addTagsTagSchema = z.object({
    tag_name: z.string(),
    tag_description: z.string(),
    is_published: z.boolean()
});


/** New tag's attributes, which are sent to backend on tag add. */
export type AddTagsTagSchema = z.infer<typeof addTagsTagSchema>;


/** /tags/view response schema. */
export const tagsViewResponseSchema = z.object({
    tags: tag.array()
});
