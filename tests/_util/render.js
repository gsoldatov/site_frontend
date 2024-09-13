import React from "react";
import { Router } from "react-router-dom";
import { Provider } from "react-redux";
import { createMemoryHistory } from "history";
import { render } from "@testing-library/react";

import { HTML5Backend } from "react-dnd-html5-backend";
import { DndProvider } from "react-dnd";

import { HistoryManager } from "../_managers/history-manager";
import { createTestStore } from "./create-test-store";
import { StoreManager } from "../_managers/store-manager/store-manager";


export const renderWithWrappers = (ui, params) => {
    const storeManager = params.storeManager || (params.store ? new StoreManager(params.store) : createTestStore());
    const route = params.route || "/";
    const history = createMemoryHistory({ initialEntries: [route] });

    const wrapper = ({ children }) => {
        return (
            <Provider store={storeManager.store}>
                <DndProvider backend={HTML5Backend}>
                    <Router history={history}>
                        {children}
                    </Router>
                </DndProvider>
            </Provider>
        );
    };

    const historyManager = new HistoryManager(history);

    return { 
        ...render(ui, { wrapper }),
        historyManager,
        store: storeManager.store, storeManager
    };
};
