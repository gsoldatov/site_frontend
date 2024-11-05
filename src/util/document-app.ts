import type { AppStore } from "./types/common";
import type { AppConfig } from "./types/config";


/***************************************************
 * document.app store typing & management functions
 ***************************************************/


export type DocumentApp = {
    config: AppConfig,
    store: AppStore,
    updateConfig: (newProps: Partial<AppConfig>) => void        // config.ts -> `updateConfig` function signature
}

if (!("app" in document)) (document as any).app = {};

/**
 * Sets `newProps` to document.app object.
 */
export const setDocumentApp = (newProps: Partial<DocumentApp>): void => {
    const d = document as any as { app: DocumentApp };
    d.app = { ...d.app, ...newProps };
};


/**
 * Gets `prop` from document.app and narrows its type
 */
export const getFromDocumentApp = <T extends keyof DocumentApp>(prop: T): DocumentApp[T] => {
    const d = document as any as { app: DocumentApp };
    if (d.app[prop] === undefined) throw Error(`'${prop}' is missing in document.app.`);
    return d.app[prop];
};
