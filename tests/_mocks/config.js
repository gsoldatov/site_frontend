import { deepCopy, deepMerge } from "../../src/util/copy";


/**
 * Returns a test configuration object with custom values speicifed in `configProps`.
 */
export const getTestConfig = (configProps = {}) => {
    return deepMerge(deepCopy(testConfig), configProps);
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
