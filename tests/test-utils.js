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