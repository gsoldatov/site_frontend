import { z } from "zod"

import { nonNegativeInt, positiveIntArray } from "../../../util/types/common"


/** /tags/get_page_tag_ids response schema. */
export const tagsGetPageTagIDsResponseSchema = z.object({
    total_items: nonNegativeInt,
    tag_ids: positiveIntArray
});
