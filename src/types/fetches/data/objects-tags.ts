import { z } from "zod";

import { positiveIntArray, timestampString } from "../../common";


/** /objects/update_tags response schema */
export const objectsUpdateTagsResponseSchema = z.object({
    tag_updates: z.object({
        added_tag_ids: positiveIntArray.optional(),
        removed_tag_ids: positiveIntArray.optional()
    }),
    modified_at: timestampString
});
