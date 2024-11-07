import { z } from "zod";
import { int, timestampString } from "../../../util/types/common";


/**********************************
 * General auth data from response
 **********************************/


/** `response.auth` object data schema. */
export const backendAuth = z.object({
    user_id: int,
    user_level: z.enum(["anonymous", "user", "admin"]),
    access_token: z.string(),
    access_token_expiration_time: timestampString
});

/** `response.auth` object data type. */
export type BackendAuth = z.infer<typeof backendAuth>;


/*************************************************
 * /auth/register & /auth/login types & validation
 *************************************************/
const login = z.string().min(1, { message: "Login is required." }).max(255, "Login is too long.");
const password = z.string().min(8, { message: "Password is too short." }).max(72, "Password is too long.");
const username = z.string().min(1, { message: "Username is required." }).max(255, "Username is too long.");


/** `registerFetch` request data schema. */
export const registerFetchData = z.object({
    login,
    password,
    password_repeat: z.string(),    //.min(8).max(72),
    username
}).refine(data => data.password === data.password_repeat, { path: ["password_repeat"], message: "Password must be repeated correctly." });


/** `loginFetch` request data schema. */
export const loginFetchData = z.object({
    login,
    password
});


/** Schema of errors returned by login & register fetches. */
export const authFetchValidationErrors = z.object({
    errors: z.object({
        form: z.string().optional(),
        login: z.string().optional(),
        password: z.string().optional(),
        password_repeat: z.string().optional(),
        username: z.string().optional()
    }).optional()  
});


export type AuthFetchValidationErrors = z.infer<typeof authFetchValidationErrors>;


/** Processes validation errors of login & register fetches into data used by login & register components to display the errors. */
export const getAuthFetchValidationErrors = (e: z.ZodError): AuthFetchValidationErrors => {
    const errors = {} as any;
    for (let issue of e.issues) {
        const field = issue.path[0];
        errors[field] = issue.message;
    }
    return authFetchValidationErrors.parse({ errors });
};
