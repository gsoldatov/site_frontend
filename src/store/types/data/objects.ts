import { z } from "zod";
import { nameString, positiveInt, timestampOrEmptyString, timestampString } from "../../../util/types/common";


export const object = z.object({
    object_id: positiveInt,
    object_type: z.enum(["link", "markdown", "to_do_list", "composite"]),
    created_at: timestampString,
    modifiat_at: timestampString,
    object_name: nameString,
    object_description: z.string(),
    is_published: z.boolean(),
    display_in_feed: z.boolean(),
    feed_timestamp: timestampOrEmptyString,
    show_description: z.boolean(),
    owner_id: positiveInt
});


export const objects = z.record(positiveInt, object);
