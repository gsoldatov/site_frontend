import { z } from "zod";
import { nameString, positiveInt, positiveIntIndex, timestampOrEmptyString, timestampString } from "../../../util/types/common";


export const objectTypeValues: [string, ...string[]] = ["link", "markdown", "to_do_list", "composite"];

/** Object type enum schema */
export const objectType = z.enum(objectTypeValues);


/** state.objects schema for object attributes. */
export const object = z.object({
    object_id: positiveInt,
    object_type: objectType,
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


/** state.objects store value type. */
export type ObjectAttributes = z.infer<typeof object>;

/** Objects' attributes store schema. */
export const objects = z.record(positiveIntIndex, object);

/** Objects' attributes store type. */
export type Objects = z.infer<typeof objects>;
