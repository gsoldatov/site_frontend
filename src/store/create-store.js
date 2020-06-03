import { createStore, applyMiddleware } from "redux";
import thunkMiddleware from "redux-thunk";

import { loadState, saveState } from "./local-storage";
import root from "../reducers/root";

const createStoreFunc = () => {
    const store = createStore(
        root,
        loadState(),
        applyMiddleware(
            thunkMiddleware
        )
    );

    store.subscribe(() => saveState(store));

    return store;
}

export default createStoreFunc;
