export interface Settings {
    non_admin_registration_allowed: boolean
}
export type SettingsNames = keyof Settings;


/**
 * settings data generator class.
 */
export class SettingsGenerator {
    /**
     * Generates response body for a successful request on /settings/view route.
     */
    settings(customValues?: Partial<Settings>): Settings {
        return {
            non_admin_registration_allowed: true,
            ...(customValues || {})
        };
    }
}
