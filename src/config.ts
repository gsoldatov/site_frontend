import { useCallback, useEffect, useState } from "react";

import { deepMerge } from "./util/copy";

import originalConfig from "./config.json";

import { useMountedState } from "./util/hooks/use-mounted-state";
import { getFromDocumentApp, setDocumentApp } from "./util/document-app";
import { config } from "./util/types/config";

import type { AppConfig } from "./util/types/config";


/***************************************************
 * App configuration management & access functions.
 ***************************************************/


type ConfigOnChangeCallback = (config: AppConfig) => void;


/**
 * Returns current app config.
 */
export const getConfig = (): AppConfig => {
    return getFromDocumentApp("config");
};


/**
 * Replaces app config with `newConfig`.
 */
export const setConfig = (config: AppConfig) => {
    setDocumentApp({ config });
    runCallbacks();
};


/**
 * Replaces props in app config with `newProps`
 */
export const updateConfig = (newProps: Partial<AppConfig>): void => {
    const config = deepMerge(getFromDocumentApp("config"), newProps) as AppConfig;
    setDocumentApp({ config });
    runCallbacks();
};


/**
 * Resets app config to default state from `config.json`.
 */
export const resetConfig = (): void => {
    const c = config.parse(originalConfig).app;
    setDocumentApp({ config: c });
    runCallbacks();
};


/**
 * Adds a callback function to be called on app config change via change functions.
 */
export const addCallback = (callback: ConfigOnChangeCallback): void => {
    configStateChangeCallbacks.add(callback);
};


const runCallbacks = (): void => {
    configStateChangeCallbacks.forEach(callback => { 
        callback(getFromDocumentApp("config"));
    });
};


/**
 * Subscribes component to the property of app's config (stored in `document.app.config`).
 * 
 * `selector` - is a function, which selects a specific config property value.
 */
export const useConfigState = (selector: (config: AppConfig) => any): any => {
    const [value, setValue] = useState(selector(getFromDocumentApp("config")));

    const isMounted = useMountedState();

    // Callback function to be called on config change
    const callback = useCallback((config: AppConfig): void => {
        if (isMounted()) {
            const newValue = selector(config);
            setValue(newValue);
        }
    }, [selector]);

    // Subscribe & unsubscribe component to config value
    useEffect(() => {
        configStateChangeCallbacks.add(callback);

        return () => {
            configStateChangeCallbacks.delete(callback);
        };
    }, [selector]);

    return value;
};


// Add default config & updater to document.app store
const c = config.parse(originalConfig).app;
setDocumentApp({ config: c, updateConfig });

/** Store for callback, which are run on config change */
const configStateChangeCallbacks: Set<ConfigOnChangeCallback> = new Set();
