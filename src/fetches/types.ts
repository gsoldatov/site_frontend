import { z } from "zod";
import { int, timestampString } from "../util/types/common";


// TODO move to fetch-runner or login type?
/** `response.auth` object data schema. */
export const backendAuth = z.object({
    user_id: int,
    user_level: z.enum(["anonymous", "user", "admin"]),
    access_token: z.string(),
    access_token_expiration_time: timestampString
});

/** `response.auth` object data type. */
export type BackendAuth = z.infer<typeof backendAuth>;
