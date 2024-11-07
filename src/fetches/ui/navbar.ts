import { setNavigationUI } from "../../reducers/ui/navigation";
import { getNonCachedUsers } from "../data/users";

import { UserLevels } from "../../store/types/data/auth";
import type { Dispatch, GetState } from "../../util/types/common";



/**
 * Fetches basic information for user with user_id = state.auth.user_id if it's missing.
 */
 export const getCurrentUserData = () => {
    return async (dispatch: Dispatch, getState: GetState) => {
        const user_id = getState().auth.user_id;
        const fullViewMode = getState().auth.numeric_user_level === UserLevels.admin;

        dispatch(setNavigationUI({ isFetching: true }));
        await dispatch(getNonCachedUsers([user_id], fullViewMode));
        dispatch(setNavigationUI({ isFetching: false }));
    };
};
