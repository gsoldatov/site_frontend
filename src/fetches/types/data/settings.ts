import { z } from "zod";


/** /settings/view response body schema */
export const settingsViewResponseBody = z.object({
    settings: z.object({
        non_admin_registration_allowed: z.boolean().optional()
    })
});

/** Possible settings names, which can be fetched via `settingsViewFetch` thunk. */
export type SettingNames = keyof z.infer<typeof settingsViewResponseBody>["settings"];
