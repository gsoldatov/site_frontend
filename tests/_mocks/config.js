import { setConfig } from "../../src/config";
import { deepCopy } from "../../src/util/copy";


/**
 * Returns a copy of test configuration object, including server configuration.
 */
export const getFullTestConfig = () => deepCopy(testConfig);


/**
 * Resets app configuration to default test values.
 */
export const resetTestConfig = () => { setConfig(getFullTestConfig().app); };


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
