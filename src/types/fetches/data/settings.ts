import { z } from "zod";

import type { FetchResult } from "../../../fetches/fetch-runner";


/** /settings/view response body schema */
export const settingsViewResponseBody = z.object({
    settings: z.object({
        non_admin_registration_allowed: z.boolean().optional()
    })
});


/** /settings/view respones body schema with `view_all` set to true. */
export const settingsViewAllResponsebody = z.object({
    settings: settingsViewResponseBody.shape.settings.required()
})


/** Full record with backend settings, returned with `view_all` set to true. */
export type Settings = z.infer<typeof settingsViewAllResponsebody.shape.settings>;


/** Return type of `settingsViewAllFetch` */
export type SettingsViewAllFetchResult = FetchResult & { settings?: Settings };


/** Possible settings names, which can be fetched via `settingsViewFetch` thunk. */
export type SettingNames = keyof z.infer<typeof settingsViewResponseBody>["settings"];
