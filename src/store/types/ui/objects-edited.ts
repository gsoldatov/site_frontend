import { z } from "zod";

import { int } from "../../../util/types/common";


/** /objects/edited page UI state schema. */
export const objectsEditedUI = z.object({
    selectedObjectIDs: z.set(int)
});
