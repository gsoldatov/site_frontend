import { getConfig } from "../config";

import { getResponseErrorType } from "./common";
import { getNonCachedUsers } from "./data-users";

import { UserLevels } from "../store/types/data/auth";
import { enumResponseErrorType } from "../util/enums/enum-response-error-type";
import { setNavigationUI } from "../reducers/ui/navigation";


const backendURL = getConfig().backendURL;


/**
 * Fetches basic information for user with user_id = state.auth.user_id if it's missing.
 */
 export const getCurrentUserData = () => {
    return async (dispatch, getState) => {
        const user_id = getState().auth.user_id;
        const fullViewMode = getState().auth.numeric_user_level === UserLevels.admin;

        dispatch(setNavigationUI({ isFetching: true }));
        let result = await dispatch(getNonCachedUsers([user_id], fullViewMode));
        dispatch(setNavigationUI({ isFetching: false }));

        // Handle fetch errors
        const responseErrorType = getResponseErrorType(result);
        if (responseErrorType > enumResponseErrorType.none) return { errors: { form: "Failed to fetch user information." }};

        return {};
    };
};
