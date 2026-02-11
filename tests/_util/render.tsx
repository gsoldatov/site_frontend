import React from "react";
import { Router } from "react-router-dom";
import { Provider } from "react-redux";
import { createMemoryHistory } from "history";
import { render } from "@testing-library/react";

import { HTML5Backend } from "react-dnd-html5-backend";
import { DndProvider } from "react-dnd";

import { updateConfig } from "../../src/config";
import { setDocumentApp } from "../../src/util/document-app";

import { HistoryManager } from "../_managers/history-manager";
import { createTestStore } from "./create-test-store";
import { StoreManager } from "../_managers/store-manager/store-manager";
import { getBackend } from "../_mock-backend/mock-backend";

import type { AppConfig } from "../../src/types/config";
import type { Store } from "redux";


export const renderWithWrappers = (ui: React.ReactElement, params: RenderParams) => {
    // Update config
    const { configProps } = params;
    if (configProps) updateConfig(configProps);

    // Store & manager
    const storeManager = params.storeManager || (params.store ? new StoreManager(params.store) : createTestStore());
    setDocumentApp({ store: storeManager.store });

    // History & manager
    const route = params.route || "/";
    const history = createMemoryHistory({ initialEntries: [route] });
    const historyManager = new HistoryManager(history);

    // Render & return results
const wrapper = ({ children }: React.PropsWithChildren<any>): React.ReactElement => {
        return (
            // stabilityCheck="never" disables Redux warnings for reducers, which return values with different references for the same args
            <Provider store={storeManager.store} stabilityCheck="never">
                <DndProvider backend={HTML5Backend}>
                    <Router history={history}>
                        {children}
                    </Router>
                </DndProvider>
            </Provider>
        );
    };

    return { 
    ...render(ui, { wrapper }),
        historyManager,
        store: storeManager.store, storeManager,
        backend: getBackend()
    };
};


type RenderParams = {
    configProps?: Partial<AppConfig>,
    storeManager?: StoreManager,
    store?: Store,
    route?: string
}