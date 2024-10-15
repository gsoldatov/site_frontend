/**
 * settings data generator class.
 */
export class SettingsGenerator {
    /**
     * Generates response body for a successful request on /settings/view route.
     */
    settings(customValues = {}) {
        return {
            non_admin_registration_allowed: true,
            ...customValues
        };
    }
}
