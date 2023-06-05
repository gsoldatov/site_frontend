import { createStore, applyMiddleware } from "redux";
import thunkMiddleware from "redux-thunk";

import { LocalStorageManager } from "./local-storage-manager";
import getRootReducer from "../reducers/root";


/**
 * Accepts an optional `config` object with configuration override.
 * If omitted, uses configuration from the `config.json` file.
 */
const createStoreFunc = config => {
    const manager = new LocalStorageManager(config);
    const store = createStore(
        getRootReducer(config),
        manager.loadState(),
        applyMiddleware(
            thunkMiddleware
        )
    );

    store.subscribe(() => manager.saveState(store));

    return store;
}

export default createStoreFunc;
