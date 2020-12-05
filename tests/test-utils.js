import React from "react";
import { Router } from "react-router-dom";
import { Provider } from "react-redux";
import { createMemoryHistory } from "history";
import { render } from "@testing-library/react";


import createStore from "../src/store/create-store";

export function renderWithWrappers(ui, {
    store = createStore({ enableDebugLogging: false }),
    route = "/",
    history = createMemoryHistory({ initialEntries: [route] })
} = {}
) {
    function wrapper({ children }) {
        return (
            <Provider store={store}>
                <Router history={history}>
                    {children}
                </Router>
            </Provider>
        );
    }

    return { 
        ...render(ui, { wrapper: wrapper }),
        history,
        store
    };
}


export function compareArrays(a, b) {
    if (!(a instanceof Array && b instanceof Array)) throw new Exception("compareArrays received a non-array argument");
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++)
        if (a[i] !== b[i]) return false;
    return true;
}
