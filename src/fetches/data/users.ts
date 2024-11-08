import { FetchResult, FetchRunner } from "../fetch-runner";
import { addUsers, updateUser } from "../../reducers/data/users";

import { usersViewMinResponseSchema, usersViewFullResponseSchema, updateUsersFetchData, 
    getUpdateUsersFetchValidationErrors, updateUsersFetchValidationErrors } from "../types/data/users";
import { getUpdatedUserValues } from "../../store/selectors/data/users";

import {  partialUserExceptID, userFull, userMin } from "../../store/types/data/users";
import type {Dispatch, GetState, InferNonNullablePartial } from "../../util/types/common";
import type { UpdateUsersFetchData, UpdateUsersFetchValidationErrors } from "../types/data/users";


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


/**
 * Fetches user data updates to backend.
 */
export const updateUsersFetch = (updates: UpdateUsersFetchData) => {
    return async (dispatch: Dispatch, getState: GetState): Promise<UpdateUsersFetchValidationErrors> => {
        // Validate user data
        const parseResult = updateUsersFetchData.safeParse(updates);
        if (!parseResult.success) return getUpdateUsersFetchValidationErrors(parseResult.error);

        // Get modified values & exit if no updates were made
        const user = getUpdatedUserValues(getState(), updates);
        if (Object.keys(user).length === 0) return { message: { type: "info", content: "Nothing was updated." }};
        user.user_id = parseResult.data.user_id;
        const { token_owner_password } = parseResult.data;

        // Fetch backend
        const runner = new FetchRunner("/users/update", 
            { method: "PUT", body: { user, token_owner_password }},
        );
        let result = await runner.run();

        // Handle response
        switch (result.status) {
            case 200:
                const userUpdates = partialUserExceptID.parse(user) as InferNonNullablePartial<typeof partialUserExceptID>;
                dispatch(updateUser(userUpdates));
                return { message: { type: "success", content: "User data was successfully updated." }};
            case 401:
                return {};  // Special case for component unmounting due to redirect
            default:
                // const errorJSON = await getErrorFromResponse(response);
                // Attribute backend error messages to specific form fields
                const errors = {} as any;
                let match = result.error!.match(/Submitted (\w+) already exists./);
                if (match && ["login", "username"].includes(match[1])) errors[match[1]] = match[0];
                
                if (result.error!.indexOf("Token owner password is incorrect.") > -1) errors.token_owner_password = "Incorrect password.";
                
                if (Object.keys(errors).length > 0) return updateUsersFetchValidationErrors.parse({ errors });

                // Return an unattributed error message otherwise
                return { message: { "type": "error", content: result.error! }};
        }
    };
};
