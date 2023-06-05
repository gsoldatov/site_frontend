import { deepCopy } from "./util/copy";

import originalConfig from "./config.json";

if (!document.app) document.app = {};
document.app.config = deepCopy(originalConfig.app);

export const getConfig = () => document.app.config;
export const setConfig = newConfig => { document.app.config = newConfig; };
export const resetConfig = () => { document.app.config = deepCopy(originalConfig.app); };
