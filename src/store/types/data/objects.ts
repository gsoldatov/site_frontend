import { z } from "zod";
import { nameString, positiveInt, positiveIntIndex, timestampOrEmptyString, timestampString } from "../../../util/types/common";


/** Object types schema */
export const objectTypes = z.enum(["link", "markdown", "to_do_list", "composite"]);


/** state.objects schema for object attributes. */
export const object = z.object({
    object_id: positiveInt,
    object_type: objectTypes,
    created_at: timestampString,
    modified_at: timestampString,
    object_name: nameString,
    object_description: z.string(),
    is_published: z.boolean(),
    display_in_feed: z.boolean(),
    feed_timestamp: timestampOrEmptyString,
    show_description: z.boolean(),
    owner_id: positiveInt
});


/** Objects' attributes store schema. */
export const objects = z.record(positiveIntIndex, object);
