import { z } from "zod";


/**
 * Schema of new tag's attributes, which are sent to backend on tag add.
 */
export const addTagsTagSchema = z.object({
    tag_name: z.string(),
    tag_description: z.string(),
    is_published: z.boolean()
});


export type AddTagsTagSchema = z.infer<typeof addTagsTagSchema>;
