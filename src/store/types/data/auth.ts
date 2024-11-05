import { z } from "zod";
import { nonNegativeInt, timestampOrEmptyString } from "../../../util/types/common";


/** User privilege level enumeration. */
export enum UserLevels {
    anonymous = 0,
    user = 10,
    admin = 20
};


/** User level data for <Select> components. */
export const userLevelInfo = [
    { key: 1, value: "admin", text: "Admin" },
    { key: 2, value: "user", text: "User" }
];


/** Auth data validation schema. */
export const auth = z.object({
    access_token: z.string(),
    access_token_expiration_time: timestampOrEmptyString,
    user_id: nonNegativeInt,
    numeric_user_level: z.nativeEnum(UserLevels)
});

/** State auth data type. */
export type Auth = z.infer<typeof auth>;


/** Returns default auth data object. */
export const getDefaultAuthState = () => {
    const state = {
        access_token: "",
        access_token_expiration_time: "",
        user_id: 0,
        numeric_user_level: UserLevels.anonymous
    };

    return auth.parse(state);
};
