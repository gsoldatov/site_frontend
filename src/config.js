import { deepCopy, deepMerge } from "./util/copy";

import originalConfig from "./config.json";
import { useCallback, useEffect, useState } from "react";
import { useMountedState } from "./util/use-mounted-state";


export const getConfig = () => {
    return document.app.config;
};


/**
 * Replaces app config with `newConfig`.
 */
export const setConfig = newConfig => {
    document.app.config = newConfig;
    runCallbacks();
};


/**
 * Replaces props in app config with `newProps`
 */
export const updateConfig = newProps => {
    document.app.config = deepMerge(document.app.config, newProps);
    runCallbacks();
};


/**
 * Resets config to default state from `config.json`.
 */
export const resetConfig = () => {
    document.app.config = deepCopy(originalConfig.app);
    runCallbacks();
};


/**
 * Adds a callback function to be called on config change via change functions.
 */
export const addCallback = callback => {
    configStateChangeCallbacks.add(callback);
};


const runCallbacks = () => {
    configStateChangeCallbacks.forEach(callback => { 
        callback(document.app.config);
    });
};


/**
 * Subscribes component to the property of app's config (stored in `document.app.config`).
 * 
 * `selector` - is a function, which selects a specific config property value.
 */
export const useConfigState = selector => {
    const [value, setValue] = useState(selector(document.app.config));

    const isMounted = useMountedState();

    // Callback function to be called on config change
    const callback = useCallback(config => {
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


if (!document.app) document.app = {};
document.app.config = deepCopy(originalConfig.app);
document.app.updateConfig = updateConfig;
const configStateChangeCallbacks = new Set();
