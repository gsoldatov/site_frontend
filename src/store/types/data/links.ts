import { z } from "zod";
import { positiveIntIndex } from "../../../util/types/common";


/** A single link object's data schema. */
export const link = z.object({
    link: z.string(),
    show_description_as_link: z.boolean()
});


/** Link objects' data store schema. */
export const links = z.record(positiveIntIndex, link);
