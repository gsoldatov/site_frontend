import { z } from "zod";
import { nameString, positiveInt, positiveIntIndex, timestampString } from "../../../util/types/common";
import { UserLevels } from "./auth";


const userMin = z.object({
    user_id: positiveInt,
    registered_at: timestampString,
    username: nameString
});

const registeredUserLevels = Object.keys(UserLevels).filter(k => isNaN(k as any) && k != "anonymous") as [string, ...string[]];
export const userFull = userMin.extend({
    user_level: z.enum(registeredUserLevels),
    can_login: z.boolean(),
    can_edit_objects: z.boolean()
});

/** User schema. */
export const user = userMin.or(userFull);

/** Users' store schema. */
export const users = z.record(positiveIntIndex, user);
