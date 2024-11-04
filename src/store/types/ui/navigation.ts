import { z } from "zod";


/** Navigation bar UI state schema. */
export const navigationUI = z.object({
    isFetching: z.boolean()
});
