import { deepCopy } from "./util/copy";


const originalConfig = {
    backendURL: "http://localhost:42002",
    compositeChapters: {
        maxHierarchyDepth: 6,   // including root element;
    }
};


export let config = deepCopy(originalConfig);


export const setConfig = newConfig => {
    config = newConfig;
};


export const resetConfig = () => {
    config = deepCopy(originalConfig);
};
