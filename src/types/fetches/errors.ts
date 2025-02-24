import { z } from "zod";


/** Schema for Pydantic errors returned by backend. */
export const pydanticErrorsSchema = z.object({
    type: z.string(),
    loc: z.coerce.string().array(),
    msg: z.string(),
    input: z.unknown(),
    ctx: z.unknown().optional()
}).array().min(1);


export type PydanticErrorsSchema = z.infer<typeof pydanticErrorsSchema>;
