import { z } from "zod";
import { auth } from "./store/data/auth";
import { editedObjects } from "./store/data/edited-objects";


/** Validator for app state part, which is saved to `localStorage`. */
export const savedAppState = z.object({ auth, editedObjects });

/** State part, which is saved to `localStorage`. */
export type SavedAppState = z.infer<typeof savedAppState>;
