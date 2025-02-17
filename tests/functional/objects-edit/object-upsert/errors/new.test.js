import React from "react";

import { MockBackend, getBackend } from "../../../../_mock-backend/mock-backend";
import { resetTestConfig } from "../../../../_mocks/config";
import { renderWithWrappers } from "../../../../_util/render";
import { getErrorResponse } from "../../../../_scenarios/backend-responses/fetch-failures";

/*
    Tests for error handling during new object's upsert on the /objects/edit/:id page.
*/
beforeEach(() => {
    // Set test app configuration
    resetTestConfig();
    
    global.backend = new MockBackend();
    global.fetch = global.backend.fetch;

    // // Add a stub for method absent in test env
    // window.HTMLElement.prototype.scrollTo = () => {};
});


test("Frontend validation error", async () => {
    // Get store & history managers
    let { store, storeManager, historyManager } = renderWithWrappers(<div />, {
        route: `/objects/edit/new`
    });

    // Add a new object without required params set
    storeManager.objectsEdit.loadObjectsEditNewPage();

    // Run upsert fetch
    await storeManager.objectsEdit.save();

    // Check if redirect did not occur
    historyManager.ensureCurrentURL("/objects/edit/new");

    // Check if new object remains in state
    expect(store.getState()).toHaveProperty("editedObjects.0");

    // Check if error text is set
    expect(store.getState().objectsEditUI.saveFetch.fetchError.length).toBeGreaterThan(0);
});


test("Backend fetch error", async () => {
    // Get store & history managers
    let { store, storeManager, historyManager } = renderWithWrappers(<div />, {
        route: `/objects/edit/new`
    });

    // Add a new object & set its required attributes
    storeManager.objectsEdit.loadObjectsEditNewPage();
    storeManager.editedObjects.updateForUpsert(0);

    // Add a mock response with a validation error for /objects/bulk_upsert
    const backend = getBackend();
    backend.routeHandlers.objects.bulkUpsert.customResponse = getErrorResponse(400, "Mock error");

    // Run upsert fetch
    await storeManager.objectsEdit.save();

    // Check if redirect did not occur
    historyManager.ensureCurrentURL("/objects/edit/new");

    // Check if new object remains in state
    expect(store.getState()).toHaveProperty("editedObjects.0");

    // Check if error text is set
    expect(store.getState().objectsEditUI.saveFetch.fetchError.length).toBeGreaterThan(0);
});
