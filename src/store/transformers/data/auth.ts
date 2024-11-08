import { BackendAuth } from "../../../fetches/types/data/auth"
import { Auth, auth, NumericUserLevel } from "../../types/data/auth"


export class AuthTransformer {
    /** Converts backend auth data returned on login to its state representation. */
    static fromBackendResponse(backendAuth: BackendAuth): Auth {
        return auth.parse({
            ...backendAuth,
            numeric_user_level: NumericUserLevel[backendAuth.user_level]
        })
    }
}
