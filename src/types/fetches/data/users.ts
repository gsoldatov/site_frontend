import { z } from "zod";
import { userMin, userFull, registeredUserLevel } from "../../store/data/users";
import { intIndex } from "../../common";


/*******************
 * /users/view types
 *******************/

/**`usersViewFetch` response body schema without `full_view_mode`. */
export const usersViewMinResponseSchema = z.object({
    users: userMin.array()
});


/**`usersViewFetch` response body schema with `full_view_mode`. */
export const usersViewFullResponseSchema = z.object({
    users: userFull.array()
});


/**********************************
 * /users/update types & validation
 **********************************/
const optionalLogin = z.string().max(255, { error: "Login is too long." });

const _passwordTooShortError = "Password must be at least 8 characters long."
const optionalPassword = z.string()     // replaced type union version for zod v4, since it no longer displays correct error messages
    .max(72, "Password must be at most 72 characters long.")
    .refine(
        value => value.length == 0 || value.length >= 8
        , { error: _passwordTooShortError }
    );
const password = optionalPassword.refine(
    value => value.length >= 8
    , { error: _passwordTooShortError }
);

const optionalUsername = z.string().max(255, "Username is too long.");


/** `usersUpdateFetch` request data schema. */
export const usersUpdateFetchData = z.object({
    user_id: intIndex,
    login: optionalLogin,
    password: optionalPassword,
    password_repeat: z.string(),    //.min(8).max(72),
    username: optionalUsername,
    user_level: registeredUserLevel,
    can_login: z.boolean(),
    can_edit_objects: z.boolean(),
    token_owner_password: password
}).refine(data => data.password === data.password_repeat, { path: ["password_repeat"], error: "Password must be repeated correctly." });


/** Schema of errors returned by `usersUpdateFetch`. */
export const usersUpdateFetchValidationErrors = z.object({
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
export const getUsersUpdateFetchValidationErrors = (e: z.ZodError): UsersUpdateFetchValidationErrors => {
    const errors = {} as any;
    for (let issue of e.issues) {
        const field = issue.path[0];
        errors[field] = issue.message;
    }
    
    return usersUpdateFetchValidationErrors.parse({ errors });
};


export type UsersUpdateFetchData = z.infer<typeof usersUpdateFetchData>;
export type UsersUpdateFetchValidationErrors = z.infer<typeof usersUpdateFetchValidationErrors>;
