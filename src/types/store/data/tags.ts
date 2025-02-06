import { z } from "zod"

import { nameString, positiveInt, positiveIntIndex, timestampString } from "../../common"


/** Tag from state.tags schema. */
export const tag = z.object({
    tag_id: positiveInt,
    created_at: timestampString,
    modified_at: timestampString,
    tag_name: nameString,
    tag_description: z.string(),
    is_published: z.boolean()
});

/** Tag from state.tags type. */
export type Tag = z.infer<typeof tag>;


/** Tags' store schema. */
export const tags = z.record(positiveIntIndex, tag);

/** Tags' store type. */
export type Tags = z.infer<typeof tags>;
