import { createStore, applyMiddleware } from "redux";
import thunkMiddleware from "redux-thunk";

import { LocalStorageProxy } from "./local-storage";
import getRootReducer from "../reducers/root";

const createStoreFunc = ({
    useLocalStorage = true,
    enableDebugLogging = false
} = {}) => {
    const proxy = new LocalStorageProxy(useLocalStorage, enableDebugLogging);
    const store = createStore(
        getRootReducer(enableDebugLogging),
        proxy.loadState(),
        applyMiddleware(
            thunkMiddleware
        )
    );

    if (useLocalStorage) {
        store.subscribe(() => proxy.saveState(store));
    }

    return store;
}

export default createStoreFunc;
