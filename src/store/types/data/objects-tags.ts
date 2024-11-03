import { z } from "zod";

import { positiveInt, positiveIntArray } from "../../../util/types/common";


export const objectsTags = z.record(positiveInt, positiveIntArray);
