import { createStore, applyMiddleware } from "redux";
import thunkMiddleware from "redux-thunk";

import { LocalStorageProxy } from "./local-storage";
import getRootReducer from "../reducers/root";

const createStoreFunc = ({
    enableDebugLogging = false
} = {}) => {
    const proxy = new LocalStorageProxy(enableDebugLogging);
    const store = createStore(
        getRootReducer(enableDebugLogging),
        proxy.loadState(),
        applyMiddleware(
            thunkMiddleware
        )
    );
    
    store.subscribe(() => proxy.saveState(store));

    return store;
}

export default createStoreFunc;
