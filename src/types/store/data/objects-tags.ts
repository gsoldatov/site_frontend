import { z } from "zod";

import { positiveIntArray, positiveIntIndex } from "../../common";


/** Objects' tags store schema. */
export const objectsTags = z.record(positiveIntIndex, positiveIntArray);
/** Objects' tags store type */
export type ObjectsTags = z.infer<typeof objectsTags>;
