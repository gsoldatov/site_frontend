import { z } from "zod";

import { objectsUpdateAttributes, objectsUpdateData } from "./update";
import { objectType } from "../../../../store/types/data/objects";
import { intIndex, positiveInt, positiveIntArray, timestampString } from "../../../../util/types/common";
import { type FetchResult } from "../../../fetch-runner";


const objectsAddAttributes = objectsUpdateAttributes
                            .omit({ object_id: true, removed_tag_ids: true })
                            .merge(z.object({ object_type: objectType }))
;


/** /objects/update schema for `object` attribute of request body. */
export const objectsAddRequestBodyObject = objectsAddAttributes.merge(z.object({ object_data: objectsUpdateData }));

// export const objectsAddRequestBody = z.object({
//     object: 
//         objectsAddAttributes
//         .merge(z.object({ object_data: objectsUpdateData }))
// });


/** /objects/add response body schema */
export const objectsAddResponseSchema = z.object({
    object: objectsAddAttributes
    .omit({ added_tags: true })
    .merge(z.object({
        object_id: positiveInt,
        created_at: timestampString,
        modified_at: timestampString,
        owner_id: positiveInt,

        tag_updates: z.object({
            added_tag_ids: positiveIntArray.optional(),
            removed_tag_ids: positiveIntArray.optional()
        }),

        object_data: z.object({
            id_mapping: z.record(intIndex, positiveInt)
        }).optional()
    }))
});


export type ObjectsAddRequestObjectData = z.infer<typeof objectsAddRequestBodyObject.shape.object_data>;
export type ObjectsAddResponseBodyObject = z.infer<typeof objectsAddResponseSchema.shape.object>;
export type ObjectsAddFetchResult = FetchResult | FetchResult & { object_id: number };
