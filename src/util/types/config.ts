import { z } from "zod";

import { int, nonNegativeInt } from "./common";


/** App config schema */
export const appConfigSchema = z.object({
    backendURL: z.string().url(),
    compositeChapters: z.object({
        maxHierarchyDepth: int.min(1).max(6)
    }),
    useLocalStorage: z.boolean(),
    debugLogging: z.boolean(),
    localStorageSaveTimeout: nonNegativeInt
});

/** Full config schema */
export const configSchema = z.object({
    app: appConfigSchema,
    server: z.object({
        port: int.min(1024).max(65536)
    })
});

export type AppConfig = z.infer<typeof appConfigSchema>;
