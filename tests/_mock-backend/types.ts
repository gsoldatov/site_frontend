import { z } from "zod";

import { int } from "../../src/util/types/common";


/** Arguments passed to `fetch`, which are used by mock backend */
export type FetchArgs = { method?: string, headers?: Record<string, string>, body?: string };

/** Mock backend's response object schema for route handlers */
export const routeHandlerResponse = z.object({
    status: int,
    body: z.record(z.string(), z.any()).optional()
});

/** Response type returned by mock backend's route handlers. */
export type RouteHandlerResponse = z.infer<typeof routeHandlerResponse>;

/** Response type returned by mock fetch */
export type Response = RouteHandlerResponse & {
    headers: {
        get: (header: string) => string | null
    },
    clone: () => Response,

    text: () => Promise<string>,
    json: () => Promise<Record<string, any>>
}
