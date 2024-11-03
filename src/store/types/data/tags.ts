import { z } from "zod"

import { nameString, positiveInt, timestampString } from "../../../util/types/common"


export const tag = z.object({
    tag_id: positiveInt,
    created_at: timestampString,
    modified_at: timestampString,
    tag_name: nameString,
    tag_description: z.string(),
    is_published: z.boolean()
});

export const tags = z.record(positiveInt, tag);
