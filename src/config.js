import { deepCopy } from "./util/copy";

import originalConfig from "./config.json";


export let config = deepCopy(originalConfig.app);
export const setConfig = newConfig => { config = newConfig; };
export const resetConfig = () => { config = deepCopy(originalConfig.app); };
