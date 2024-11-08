import { z } from "zod";
import { nameString, positiveInt, positiveIntIndex, timestampString } from "../../../util/types/common";
import { NumericUserLevel } from "./auth";


/** Minimal set of user attributes schema. */
export const userMin = z.object({
    user_id: positiveInt,
    registered_at: timestampString,
    username: nameString
});


const _registeredUserLevel = Object.keys(NumericUserLevel).filter(k => isNaN(k as any) && k != "anonymous") as [string, ...string[]];
/** "admin" | "user" */
export const registeredUserLevel = z.enum(_registeredUserLevel);


/** Full set of user attributes schema. */
export const userFull = userMin.extend({
    user_level: registeredUserLevel,
    can_login: z.boolean(),
    can_edit_objects: z.boolean()
});


/** Schema of partial user attributes with a required `user_id`. */
export const partialUserExceptID = userFull.omit({ user_id: true }).partial().extend({ user_id: positiveInt });


/** User data schema. */
export const user = userMin.or(userFull);
/** User data type. */
export type User = z.infer<typeof user>;
/** Users' store schema. */
export const users = z.record(positiveIntIndex, user);
/** Users' store type. */
export type Users = z.infer<typeof users>;
