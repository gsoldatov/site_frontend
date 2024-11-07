import { FetchResult, FetchRunner } from "../fetch-runner";
import { addUsers } from "../../reducers/data/users";

import { usersViewMinResponseSchema, usersViewFullResponseSchema } from "../types/data/users";
import {  userFull, userMin } from "../../store/types/data/users";
import type {Dispatch, GetState } from "../../util/types/common";


/**
 * Fetches user data for provided `user_ids` with the provided `full_view_mode`.
 */
export const viewUsersFetch = (user_ids: (number | string)[], full_view_mode: boolean) => {
    return async (dispatch: Dispatch, getState: GetState) => {
        user_ids = user_ids.map(id => {
            const intID = parseInt(id as string);
            if (isNaN(intID)) throw Error(`Failed to parse user_id '${id}' in viewUsersFetch.`)
            return intID;
        });

        // Fetch backend
        const runner = new FetchRunner("/users/view", 
            { method: "POST", body: JSON.stringify({ user_ids, full_view_mode }) },
        );
        let result = await runner.run();

        switch (result.status) {
            case 200:
                const responseSchema = full_view_mode ? usersViewFullResponseSchema : usersViewMinResponseSchema;
                const { users } = responseSchema.parse(result.json);
                dispatch(addUsers(users));
                return result;
            default:
                return result;
        }
    };
};


/**
 * Fetches missing user data for provided `user_ids`. Required user attributes in the store are based on `full_view_mode` flag.
 */
export const getNonCachedUsers = (user_ids: (number | string)[], full_view_mode: boolean) => {
    return async (dispatch: Dispatch, getState: GetState) => {
        const state = getState();
        const schema = full_view_mode ? userFull : userMin;

        user_ids = user_ids.filter(user_id => !schema.safeParse(state.users[user_id as number]).success);
        if (user_ids.length !== 0) return await dispatch(viewUsersFetch(user_ids, full_view_mode));
        return FetchResult.fetchNotRun();
    }
};
