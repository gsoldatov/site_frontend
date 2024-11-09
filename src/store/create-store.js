import { createStore, applyMiddleware } from "redux";
import thunkMiddleware from "redux-thunk";

import { LocalStorageManager } from "./local-storage-manager";
import getRootReducer from "../reducers/root";
import { setDocumentApp } from "../util/document-app";


/**
 * Uses configuration from the `document.app.config`.
 */
const createStoreFunc = () => {
    const manager = new LocalStorageManager();
    const store = createStore(
        getRootReducer(),
        manager.loadState(),
        applyMiddleware(
            thunkMiddleware
        )
    );

    store.subscribe(() => manager.saveState(store));

    setDocumentApp({ store });

    return store;
}

export default createStoreFunc;
