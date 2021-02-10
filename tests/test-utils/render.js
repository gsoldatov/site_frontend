import React from "react";
import { Router } from "react-router-dom";
import { Provider } from "react-redux";
import { createMemoryHistory } from "history";
import { render } from "@testing-library/react";

import { HTML5Backend } from "react-dnd-html5-backend";
import { DndProvider } from "react-dnd";

import createStore from "../../src/store/create-store";


export function renderWithWrappersAndDnDProvider(ui, params) {
    const { store, history } = getRenderParams(params);
    function wrapper({ children }) {
        return (
            <Provider store={store}>
                <DndProvider backend={HTML5Backend}>
                    <Router history={history}>
                        {children}
                    </Router>
                </DndProvider>
            </Provider>
        );
    }

    return { 
        ...render(ui, { wrapper }),
        history,
        store
    };
}


export function renderWithWrappers(ui, params) {
    const { store, history } = getRenderParams(params);
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
        ...render(ui, { wrapper }),
        history,
        store
    };
}


const getRenderParams = (params = {}) => {
    const store = params.store || createStore({ useLocalStorage: false, enableDebugLogging: false }),
          route = params.route || "/";
    const history = createMemoryHistory({ initialEntries: [route] });
    return { store, history };
};