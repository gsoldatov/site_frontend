import { deepCopy } from "../../util/copy";

import { enumUserLevels } from "../../util/enum-user-levels";


/**
 * Default auth state.
 */
const defaultAuthState = {
    "access_token": "",
    "access_token_expiration_time": "",
    "user_id": 0,
    "user_level": enumUserLevels.anonymous
};


/**
 * Returns a copy of default auth state.
 */
export const getDefaultAuthState = () => deepCopy(defaultAuthState);
