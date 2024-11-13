import { z } from "zod";
import { positiveIntIndex } from "../../../util/types/common";


/** Markdown object's data schema for state.markdown & state.editedObjects. */
export const markdown = z.object({
    raw_text: z.string(),
    parsed: z.string()
});

/** state.markdown data store schema. */
export const markdownStore = z.record(positiveIntIndex, markdown);


/** Markdown object's data type for state.markdown & state.editedObjects. */
export type Markdown = z.infer<typeof markdown>;
