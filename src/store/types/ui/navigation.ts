import { z } from "zod";


/** Navigation bar UI state schema. */
export const navigationUI = z.object({
    isFetching: z.boolean()
});

/** Navigation bar UI state type. */
export type NavigationUI = z.infer<typeof navigationUI>;
