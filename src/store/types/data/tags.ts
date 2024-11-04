import { z } from "zod"

import { nameString, positiveInt, positiveIntIndex, timestampString } from "../../../util/types/common"


/** Tag schema. */
export const tag = z.object({
    tag_id: positiveInt,
    created_at: timestampString,
    modified_at: timestampString,
    tag_name: nameString,
    tag_description: z.string(),
    is_published: z.boolean()
});

/** Tags' store schema. */
export const tags = z.record(positiveIntIndex, tag);
