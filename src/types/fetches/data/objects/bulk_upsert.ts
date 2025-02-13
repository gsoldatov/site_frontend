import { z } from "zod"

import { type FetchResult } from "../../../../fetches/fetch-runner";
import { int, intIndex, positiveInt } from "../../../common"
import { objectsUpdateAttributes, linkData, markdownData, toDoListData, 
    compositeDataAddUpdate, compositeSubobject } from "./update"
import { objectsViewResponseSchema } from "./general";


/** Object attributes in the /objects/bulk_upsert request format. */
const objectsBulkUpsertAttributes = objectsUpdateAttributes
    .omit({ object_id: true })
    .merge(z.object({ object_id: int }));


/** `object_data` of a composite object in the /objects/bulk_upser request format. */
const compositeData = compositeDataAddUpdate
    .omit({ subobjects: true, deleted_subobjects: true })
    .merge(z.object({ subobjects: compositeSubobject.array() }));


/** `object_data` of any possible type in the /objects/bulk_upsert request format. */
export type ObjectsBulkUpsertObjectData = z.infer<typeof linkData>
    | z.infer<typeof markdownData>
    | z.infer<typeof toDoListData>
    | z.infer<typeof compositeData>
;


// Object type + data options
const linkObjectTypeAndData = z.object({ object_type: z.literal("link"), object_data: linkData });
const markdownObjectTypeAndData = z.object({ object_type: z.literal("markdown"), object_data: markdownData });
const toDoListObjectTypeAndData = z.object({ object_type: z.literal("to_do_list"), object_data: toDoListData });
const compositeObjectTypeAndData = z.object({ object_type: z.literal("composite"), object_data: compositeData });


/** Object's attributes, tags & data in the /objects/bulk_upsert format. */
const upsertedObject = objectsBulkUpsertAttributes.merge(linkObjectTypeAndData)
    .or(objectsBulkUpsertAttributes.merge(markdownObjectTypeAndData))
    .or(objectsBulkUpsertAttributes.merge(toDoListObjectTypeAndData))
    .or(objectsBulkUpsertAttributes.merge(compositeObjectTypeAndData));


/** /objects/bulk_upsert request body schema. */
export const objectsBulkUpsertRequestBody = z.object({
    objects: upsertedObject.array().min(1).max(100),
    fully_deleted_subobject_ids: positiveInt.array().max(1000)
})


/** /objects/bulk_upser response body schema. */
export const objectsBulkUpsertResponseSchema = objectsViewResponseSchema
    .merge(z.object({
        new_object_ids_map: z.record(intIndex, positiveInt)
    }));


export type ObjectsBulkUpsertFetchResult = FetchResult
    | FetchResult & { 
        response: z.infer<typeof objectsBulkUpsertResponseSchema>
        fully_deleted_subobject_ids: z.infer<typeof objectsBulkUpsertRequestBody.shape.fully_deleted_subobject_ids>     // TODO delete if unused
    };
