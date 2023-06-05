import { deepCopy } from "./util/copy";

import originalConfig from "./config.json";


document.appConfig = deepCopy(originalConfig.app);

export const getConfig = () => document.appConfig;
export const setConfig = newConfig => { document.appConfig = newConfig; };
export const resetConfig = () => { document.appConfig = deepCopy(originalConfig.app); };
