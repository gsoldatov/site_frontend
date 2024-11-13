import { z } from "zod";
import { positiveIntIndex } from "../../../util/types/common";


/** Link object's data schema for state.links & state.editedObjects. */
export const link = z.object({
    link: z.string(),
    show_description_as_link: z.boolean()
});


/** state.links data store schema. */
export const links = z.record(positiveIntIndex, link);


/** Link object's data type for state.links & state.editedObjects. */
export type Link = z.infer<typeof link>;
