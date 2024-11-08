import type { UserLevel } from "./users";


export interface AuthData {
    user_id: number,
    user_level: UserLevel,
    access_token: string,
    access_token_expiration_time: string
};


/**
 * Auth data generator class.
 */
export class AuthGenerator {
    /**
     * Generates response body for a successful request on /auth/login route.
     * Custom values for any attribute can be passed in the `customValues` argument.
     */
    login(customValues?: { auth: Partial<AuthData> }): { auth: AuthData } {
        let { auth = {} } = customValues || {};
        let { user_id, user_level, access_token, access_token_expiration_time } = auth;

        user_id = user_id || 1;

        if (!access_token_expiration_time) {
            let expirationTime = new Date();
            expirationTime.setDate(expirationTime.getDate() + 7);
            access_token_expiration_time = expirationTime.toISOString();
        }

        return {
            auth: {
                user_id,
                user_level: user_level || "admin",
                access_token: access_token || `user ${user_id} token`,
                access_token_expiration_time
            }
        };
    }
}
