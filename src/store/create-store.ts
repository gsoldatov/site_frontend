import { createStore as createStoreRedux, applyMiddleware, type Reducer } from "redux";
import thunkMiddleware from "redux-thunk";

import { LocalStorageManager } from "./local-storage-manager";
import { getRootReducer } from "../reducers/root";
import { setDocumentApp } from "../util/document-app";


/**
 * Creates Redux store for the app, configures its local storage usage & adds it to the `documents.app`.
 * 
 * Uses configuration from the `document.app.config`.
 */
export const createStore = () => {
    const manager = new LocalStorageManager();
    const store = createStoreRedux(
        getRootReducer() as Reducer,
        manager.loadState(),
        applyMiddleware(
            thunkMiddleware
        )
    );

    store.subscribe(() => manager.saveState(store));

    setDocumentApp({ store });

    return store;
};
