import { MockBackend, getBackend } from "../../../../_mock-backend/mock-backend";
import { createTestStore } from "../../../../_util/create-test-store";
import { resetTestConfig } from "../../../../_mocks/config";

import { SubobjectDeleteMode } from "../../../../../src/types/store/data/composite";


/*
    Tests for object IDs, which are upserted, fully deleted & removed from state after an existing object's upsert on the /objects/edit/:id page.

    NOTE: most of the logic relatedt to object ID selection is tested in the object tests.
    This file contains only tests cases specific to the upsert of an existing main object.
*/
beforeEach(() => {
    // Set test app configuration
    resetTestConfig();
    
    global.backend = new MockBackend();
    global.fetch = global.backend.fetch;

    // // Add a stub for method absent in test env
    // window.HTMLElement.prototype.scrollTo = () => {};
});


test("Unmodified existing object", async () => {
    // Load an existing object & update its attributes
    const storeManager = createTestStore(), { store } = storeManager;
    await storeManager.objectsEdit.loadObjectsEditExistingPage(1);

    // Run upsert fetch
    await storeManager.objectsEdit.save();

    // Check if object was upserted and was not removed
    const backend = getBackend();
    const requests = backend.history.getMatchingRequests("/objects/bulk_upsert");
    expect(requests.length).toEqual(1);
    const { body } = requests[0].requestContext;

    expect(body["objects"].map(o => o["object_id"])).toEqual([1]);
    expect(body["deleted_object_ids"]).toEqual([]);

    // Check if object remains in the state
    expect(store.getState()).toHaveProperty("objects.1");
    expect(store.getState()).toHaveProperty("editedObjects.1");
});



test("Modified existing object", async () => {
    // Load an existing object & update its attributes
    const storeManager = createTestStore(), { store } = storeManager;
    await storeManager.objectsEdit.loadObjectsEditExistingPage(1);
    storeManager.editedObjects.update(1, { object_name: "Modified name" });

    // Run upsert fetch
    await storeManager.objectsEdit.save();

    // Check if object was upserted and was not removed
    const backend = getBackend();
    const requests = backend.history.getMatchingRequests("/objects/bulk_upsert");
    expect(requests.length).toEqual(1);
    const { body } = requests[0].requestContext;

    expect(body["objects"].map(o => o["object_id"])).toEqual([1]);
    expect(body["deleted_object_ids"]).toEqual([]);

    // Check if object remains in the state
    expect(store.getState()).toHaveProperty("objects.1");
    expect(store.getState()).toHaveProperty("editedObjects.1");
});
