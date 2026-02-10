import { createStore as createStoreRedux, applyMiddleware, type Reducer } from "redux";
import { thunk } from "redux-thunk";
import { setGlobalDevModeChecks } from "reselect";

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
        manager.loadInitialState(),
        applyMiddleware(
            thunk
        )
    );

    store.subscribe(() => manager.onStateChangeCallback(store));
    manager.store = store;  // NOTE: setting reference to the store is required for handling storage events

    // Save references to store & storage event listeners
    // NOTE: the latter is only required in tests for proper clean up of events between tests,
    // as long as a single store is used for the entire lifetime of the document
    const storageListeners = ((document as any).app?.storageListeners || []).concat([manager.storageEventHandler]);
    setDocumentApp({ store, storageListeners });

    return store;
};


// Disable reselect v5 warnings in dev mode
setGlobalDevModeChecks({ inputStabilityCheck: "never", identityFunctionCheck: "never" });
