import { setConfig } from "../../src/config";
import { deepCopy, deepMerge } from "../../src/util/copy";


/**
 * Returns a test configuration object with custom values speicifed in `configProps`.
 * 
 * Sets generated test config as app's config in `document.app.config`.
 */
export const getTestConfig = (configProps = {}) => {
    const config = deepMerge(deepCopy(testConfig), configProps);
    setConfig(config.app);
    return config;
};


const testConfig = {
    "app": {
        "backendURL": "http://localhost:42002",
        "compositeChapters": {
            "maxHierarchyDepth": 6
        },

        "useLocalStorage": false,
        "debugLogging": false,
        "localStorageSaveTimeout": 50
    },

    "server": {
        "port": 5000
    }
};
