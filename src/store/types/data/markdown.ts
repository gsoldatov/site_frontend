import { z } from "zod";
import { positiveInt } from "../../../util/types/common";


/** A single markdown object's data schema. */
export const markdown = z.object({
    raw_text: z.string(),
    parsed: z.string()
});

/** Markdown objects' data store schema. */
export const markdownStore = z.record(positiveInt, markdown);
