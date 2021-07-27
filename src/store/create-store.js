import { createStore, applyMiddleware } from "redux";
import thunkMiddleware from "redux-thunk";

import { LocalStorageManager } from "./local-storage-manager";
import getRootReducer from "../reducers/root";


const createStoreFunc = ({ useLocalStorage = false, enableDebugLogging = false, saveTimeout = 1000 } = {}) => {
    const manager = new LocalStorageManager({ useLocalStorage, enableDebugLogging, saveTimeout });
    const store = createStore(
        getRootReducer(enableDebugLogging),
        manager.loadState(),
        applyMiddleware(
            thunkMiddleware
        )
    );

    if (useLocalStorage) {
        store.subscribe(() => manager.saveState(store));
    }

    return store;
}

export default createStoreFunc;
