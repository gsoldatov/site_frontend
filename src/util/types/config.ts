import { z } from "zod";


/** App config schema */
export const appConfigSchema = z.object({
    backendURL: z.string().url(),
    compositeChapters: z.object({
        maxHierarchyDepth: z.number().int().min(1).max(6)
    }),
    useLocalStorage: z.boolean(),
    debugLogging: z.boolean(),
    localStorageSaveTimeout: z.number().int().min(0)
});

/** Full config schema */
export const configSchema = z.object({
    app: appConfigSchema,
    server: z.object({
        port: z.number().int().min(1024).max(65536)
    })
});

export type AppConfig = z.infer<typeof appConfigSchema>;
