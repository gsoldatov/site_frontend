import { z } from "zod";
import { userMin, userFull } from "../../../store/types/data/users";


/**`viewUsersFetch` response body schema without `full_view_mode`. */
export const usersViewMinResponseSchema = z.object({
    users: userMin.array()
});


/**`viewUsersFetch` response body schema with `full_view_mode`. */
export const usersViewFullResponseSchema = z.object({
    users: userFull.array()
});
