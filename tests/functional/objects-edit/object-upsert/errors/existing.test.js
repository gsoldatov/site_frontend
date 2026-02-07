import { MockBackend, getBackend } from "../../../../_mock-backend/mock-backend";
import { resetTestConfig } from "../../../../_mocks/config";
import { createTestStore } from "../../../../_util/create-test-store";
import { getErrorResponse } from "../../../../_scenarios/backend-responses/common";

import { SubobjectDeleteMode } from "../../../../../src/types/store/data/composite";


/*
    Tests for error handling during existing object's upsert on the /objects/edit/:id page.
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
    // Add an existing object & set incorrect attributes
    const storeManager = createTestStore(), { store } = storeManager;
        await storeManager.objectsEdit.loadObjectsEditExistingPage(1);
    const { object_name } = store.getState().objects[1];
    storeManager.editedObjects.update(1, { object_name: "" });

    // Run upsert fetch
    await storeManager.objectsEdit.save();

    // Check if object change was not passed to the attributes store
    expect(store.getState()).toHaveProperty("objects.1.object_name", object_name);

    // Check if error text is set
    expect(store.getState().objectsEditUI.saveFetch.fetchError.length).toBeGreaterThan(0);
});


test("Backend fetch error", async () => {
    // Add an existing object & update its name
    const storeManager = createTestStore(), { store } = storeManager;
    await storeManager.objectsEdit.loadObjectsEditExistingPage(1);
    const { object_name } = store.getState().objects[1];
    storeManager.editedObjects.update(1, { object_name: "update name" });

    // Add a mock response with a validation error for /objects/bulk_upsert
    const backend = getBackend();
    backend.routeHandlers.objects.bulkUpsert.customResponse = getErrorResponse(400, "Mock error");

    // Run upsert fetch
    await storeManager.objectsEdit.save();

    // Check if object change was not passed to the attributes store
    expect(store.getState()).toHaveProperty("objects.1.object_name", object_name);

    // Check if error text is set
    expect(store.getState().objectsEditUI.saveFetch.fetchError.length).toBeGreaterThan(0);
});


test("Current edited object is marked for full deletion", async () => {
    // Set object values
    const backend = getBackend();
    backend.cache.objects.update(1, { object_type: "composite" }, 
        { subobjects: [backend.data.generator.object.compositeDataSubobject({ subobject_id: 2 })] });

    // Load an existing composite & its subobject
    const storeManager = createTestStore(), { store } = storeManager;
    await storeManager.objectsEdit.loadObjectsEditExistingPage(1);
    storeManager.objects.add(2, { attributes: { object_type: "composite" }, data: { subobjects: [] }});
    storeManager.editedObjects.reset([2]);
    
    // Add the composite as a subobject's subobject & mark it for full deletion
    storeManager.editedObjects.updateEditedComposite(2, { command: "addExistingSubobject", subobjectID: 1, column: 0, row: 0 });
    storeManager.editedObjects.updateEditedComposite(2, { command: "updateSubobject", subobjectID: 1, deleteMode: SubobjectDeleteMode.full });

    // Run upsert fetch
    await storeManager.objectsEdit.save();

    // Check if object change was not passed to the attributes store
    expect(store.getState()).toHaveProperty("composite.2.subobjects");
    expect(store.getState()).not.toHaveProperty("composite.2.subobjects.1");

    // Check if error text is set
    expect(store.getState().objectsEditUI.saveFetch.fetchError.length).toBeGreaterThan(0);
});
