import { z } from "zod";
import { userMin, userFull, registeredUserLevel } from "../../../store/types/data/users";
import { intIndex } from "../../../util/types/common";


/*******************
 * /users/view types
 *******************/

/**`viewUsersFetch` response body schema without `full_view_mode`. */
export const usersViewMinResponseSchema = z.object({
    users: userMin.array()
});


/**`viewUsersFetch` response body schema with `full_view_mode`. */
export const usersViewFullResponseSchema = z.object({
    users: userFull.array()
});


/**********************************
 * /users/update types & validation
 **********************************/
const login = z.string().min(1, { message: "Login is required." }).max(255, "Login is too long.");
const password = z.string().min(8, { message: "Password is too short." }).max(72, "Password is too long.");
const username = z.string().min(1, { message: "Username is required." }).max(255, "Username is too long.");

const optionalLogin = login.or(z.string().max(0));
const optionalPassword = password.or(z.string().max(0));
const optionalUsername = username.or(z.string().max(0));


/** `updateUsersFetch` request data schema. */
export const updateUsersFetchData = z.object({
    user_id: intIndex,
    login: optionalLogin,
    password: optionalPassword,
    password_repeat: z.string(),    //.min(8).max(72),
    username: optionalUsername,
    user_level: registeredUserLevel,
    can_login: z.boolean(),
    can_edit_objects: z.boolean(),
    token_owner_password: password
}).refine(data => data.password === data.password_repeat, { path: ["password_repeat"], message: "Password must be repeated correctly." });


/** Schema of errors returned by `updateUsersFetch`. */
export const updateUsersFetchValidationErrors = z.object({
    message: z.object({
        type: z.string(),
        content: z.string()
    }).optional(),

    errors: z.object({
        login: z.string().optional(),
        password: z.string().optional(),
        password_repeat: z.string().optional(),
        username: z.string().optional(),
        token_owner_password: z.string().optional()
    }).optional()  
});


/** Processes validation errors of update users fetch into error data for the user update page component. */
export const getUpdateUsersFetchValidationErrors = (e: z.ZodError): UpdateUsersFetchValidationErrors => {
    const errors = {} as any;
    for (let issue of e.issues) {
        const field = issue.path[0];
        errors[field] = issue.message;
    }
    
    return updateUsersFetchValidationErrors.parse({ errors });
};


export type UpdateUsersFetchData = z.infer<typeof updateUsersFetchData>;
export type UpdateUsersFetchValidationErrors = z.infer<typeof updateUsersFetchValidationErrors>;
