import { z } from "zod";
import { positiveInt } from "../../../util/types/common";


export const link = z.object({
    link: z.string().url(),
    show_description_as_link: z.boolean()
});

export const links = z.record(positiveInt, link);
