import { MockBackend, getBackend } from "../../../../_mock-backend/mock-backend";
import { createTestStore } from "../../../../_util/create-test-store";
import { resetTestConfig } from "../../../../_mocks/config";

import { SubobjectDeleteMode } from "../../../../../src/types/store/data/composite";


/*
    Tests for object IDs, which are upserted, fully deleted & remove from state after a new object's upsert on the /objects/edit/:id page.
*/
beforeEach(() => {
    // Set test app configuration
    resetTestConfig();
    
    global.backend = new MockBackend();
    global.fetch = global.backend.fetch;

    // // Add a stub for method absent in test env
    // window.HTMLElement.prototype.scrollTo = () => {};
});


test("Non-composite object", async () => {
    // Add a new object & set required attributes
    const storeManager = createTestStore(), { store } = storeManager;
    storeManager.objectsEdit.loadObjectsEditNewPage();
    storeManager.editedObjects.updateForUpsert(0);

    // Add new & 2 existing subobjects + existing subobject data => modify 1 existing subobject
    for (let objectID of [2, 3]) {
        storeManager.objects.add(objectID);
        storeManager.editedObjects.reset([objectID]);
    }
    storeManager.editedObjects.updateEditedComposite(0, { command: "addNewSubobject", column: 0, row: 0 });
    storeManager.editedObjects.updateEditedComposite(0, { command: "addExistingSubobject", subobjectID: 2, column: 0, row: 1 });
    storeManager.editedObjects.updateEditedComposite(0, { command: "addExistingSubobject", subobjectID: 3, column: 0, row: 2 });

    storeManager.editedObjects.update(3, { object_name: "modified name" });

    // Run upsert fetch
    await storeManager.objectsEdit.save();

    // Check if correct object IDs were passed into fetch
    const backend = getBackend();
    const requests = backend.history.getMatchingRequests("/objects/bulk_upsert");
    expect(requests.length).toEqual(1);
    const { body } = requests[0].requestContext;

    expect(body["objects"].map(o => o["object_id"])).toEqual([0]);
    expect(body["deleted_object_ids"]).toEqual([]);

    // Check if main new object, new subobject & unmodified existing subobject were removed from state
    for (let objectID of [0, -1, 2]) {
        expect(store.getState()).not.toHaveProperty(`objects.${objectID}`);
        expect(store.getState()).not.toHaveProperty(`editedObjects.${objectID}`);
    }

    // Check if upserted object & modified existing subobject remain in state
    const mappedObjectID = requests[0].response.body["new_object_ids_map"][0];
    for (let objectID of [mappedObjectID, 3]) {
        expect(store.getState()).toHaveProperty(`objects.${objectID}`);
        expect(store.getState()).toHaveProperty(`editedObjects.${objectID}`);
    }
});


test("Composite object", async () => {
    // Add a new composite object
    const storeManager = createTestStore(), { store } = storeManager;
    storeManager.objectsEdit.loadObjectsEditNewPage();
    storeManager.editedObjects.updateForUpsert(0, "composite");

    // Add a new subobject & fill its required attributes
    storeManager.editedObjects.updateEditedComposite(0, { command: "addNewSubobject", column: 0, row: 0 });
    storeManager.editedObjects.updateForUpsert(-1);

    // Add a new subobject & mark it for removal
    storeManager.editedObjects.updateEditedComposite(0, { command: "addNewSubobject", column: 0, row: 1 });
    storeManager.editedObjects.updateEditedComposite(0, { command: "updateSubobject", subobjectID: -2, deleteMode: SubobjectDeleteMode.subobjectOnly });

    // Add a new subobject & mark it for full deletion
    storeManager.editedObjects.updateEditedComposite(0, { command: "addNewSubobject", column: 0, row: 2 });
    storeManager.editedObjects.updateEditedComposite(0, { command: "updateSubobject", subobjectID: -3, deleteMode: SubobjectDeleteMode.full });

    // Add an unmodified existing subobject
    storeManager.objects.add(1);
    storeManager.editedObjects.reset([1]);
    storeManager.editedObjects.updateEditedComposite(0, { command: "addExistingSubobject", subobjectID: 1, column: 1, row: 0 });

    // Add a modified existing subobject
    storeManager.objects.add(2);
    storeManager.editedObjects.reset([2]);
    storeManager.editedObjects.update(2, { object_name: "modified name" });
    storeManager.editedObjects.updateEditedComposite(0, { command: "addExistingSubobject", subobjectID: 2, column: 1, row: 1 });

    // Add an unmodified existing subobject marked for removal
    storeManager.objects.add(3);
    storeManager.editedObjects.reset([3]);
    storeManager.editedObjects.updateEditedComposite(0, { command: "addExistingSubobject", subobjectID: 3, column: 1, row: 2 });
    storeManager.editedObjects.updateEditedComposite(0, { command: "updateSubobject", subobjectID: 3, deleteMode: SubobjectDeleteMode.subobjectOnly });

    // Add a modified existing subobject marked for removal
    storeManager.objects.add(4);
    storeManager.editedObjects.reset([4]);
    storeManager.editedObjects.update(4, { object_name: "modified name" });
    storeManager.editedObjects.updateEditedComposite(0, { command: "addExistingSubobject", subobjectID: 4, column: 1, row: 3 });
    storeManager.editedObjects.updateEditedComposite(0, { command: "updateSubobject", subobjectID: 4, deleteMode: SubobjectDeleteMode.subobjectOnly });

    // Add an unmodified existing subobject marked for full deletion
    storeManager.objects.add(5);
    storeManager.editedObjects.reset([5]);
    storeManager.editedObjects.updateEditedComposite(0, { command: "addExistingSubobject", subobjectID: 5, column: 1, row: 4 });
    storeManager.editedObjects.updateEditedComposite(0, { command: "updateSubobject", subobjectID: 5, deleteMode: SubobjectDeleteMode.full });

    // Add a modified existing subobject marked for full deletion
    storeManager.objects.add(6);
    storeManager.editedObjects.reset([6]);
    storeManager.editedObjects.update(6, { object_name: "modified name" });
    storeManager.editedObjects.updateEditedComposite(0, { command: "addExistingSubobject", subobjectID: 6, column: 1, row: 5 });
    storeManager.editedObjects.updateEditedComposite(0, { command: "updateSubobject", subobjectID: 6, deleteMode: SubobjectDeleteMode.full });

    // Run upsert fetch
    await storeManager.objectsEdit.save();

    // Check objects passed for upsert
    const backend = getBackend();
    const requests = backend.history.getMatchingRequests("/objects/bulk_upsert");
    expect(requests.length).toEqual(1);
    const { body } = requests[0].requestContext;

    expect(body["objects"].map(o => o["object_id"]).sort()).toEqual([
        -1, // new subobject
        0,  // main object
        2,  // modified existing subobject
        4   // modified existing subobject marked for removal
    ]);

    // Check subobjects passed for upsert
    const mainObject = body["objects"].filter(o => o["object_id"] === 0)[0];
    expect(
        mainObject["object_data"]["subobjects"]
        .map(so => parseInt(so["subobject_id"]))
        .sort((a, b) => a - b)
    ).toEqual([-1, 1, 2]);    // new, unmodified existiing, modified existing
    
    // Check objects passed for full deletion
    expect(
        body["deleted_object_ids"]
        .sort((a, b) => a - b)
    ).toEqual([5, 6]);  // unmodified & modified existing marked for full deletion
    
    // Check objects, which were deleted from the state
    for (let objectID of [-2, -1, 0, 3, 4, 5, 6]) { // all new objects & existing marked for removal or full deletion
        expect(store.getState()).not.toHaveProperty(`objects.${objectID}`);
        expect(store.getState()).not.toHaveProperty(`editedObjects.${objectID}`);
    }

    // Check objects, which remain in the state
    const objectIDMap = requests[0].response.body["new_object_ids_map"];
    for (let objectID of [
        objectIDMap[0],     // existing object created for main object
        objectIDMap[-1],    // existing object created for the new subobject
        1, 2                // unmodified & modified existing subobjects
    ]) {
        expect(store.getState()).toHaveProperty(`objects.${objectID}`);
        expect(store.getState()).toHaveProperty(`editedObjects.${objectID}`);
    }
});


test("Composite hierarchy", async () => {
    // Add a new composite object
    const storeManager = createTestStore(), { store } = storeManager;
    storeManager.objectsEdit.loadObjectsEditNewPage();
    storeManager.editedObjects.updateForUpsert(0, "composite");

    // Add an existing composite subobject
    storeManager.objects.add(100, { attributes: { object_type: "composite" }, data: { subobjects: [] }});
    storeManager.editedObjects.reset([100]);
    storeManager.editedObjects.updateEditedComposite(0, { command: "addExistingSubobject", subobjectID: 100, column: 0, row: 0 });

    // Add sub-subobjects 
    // // Add a new subobject & fill its required attributes
    storeManager.editedObjects.updateEditedComposite(100, { command: "addNewSubobject", column: 0, row: 0 });
    storeManager.editedObjects.updateForUpsert(-1);

    // // Add a new subobject & mark it for removal
    storeManager.editedObjects.updateEditedComposite(100, { command: "addNewSubobject", column: 0, row: 1 });
    storeManager.editedObjects.updateEditedComposite(100, { command: "updateSubobject", subobjectID: -2, deleteMode: SubobjectDeleteMode.subobjectOnly });

    // // Add a new subobject & mark it for full deletion
    storeManager.editedObjects.updateEditedComposite(100, { command: "addNewSubobject", column: 0, row: 2 });
    storeManager.editedObjects.updateEditedComposite(100, { command: "updateSubobject", subobjectID: -3, deleteMode: SubobjectDeleteMode.full });

    // // Add an unmodified existing subobject
    storeManager.objects.add(1);
    storeManager.editedObjects.reset([1]);
    storeManager.editedObjects.updateEditedComposite(100, { command: "addExistingSubobject", subobjectID: 1, column: 1, row: 0 });

    // // Add a modified existing subobject
    storeManager.objects.add(2);
    storeManager.editedObjects.reset([2]);
    storeManager.editedObjects.update(2, { object_name: "modified name" });
    storeManager.editedObjects.updateEditedComposite(100, { command: "addExistingSubobject", subobjectID: 2, column: 1, row: 1 });

    // // Add an unmodified existing subobject marked for removal
    storeManager.objects.add(3);
    storeManager.editedObjects.reset([3]);
    storeManager.editedObjects.updateEditedComposite(100, { command: "addExistingSubobject", subobjectID: 3, column: 1, row: 2 });
    storeManager.editedObjects.updateEditedComposite(100, { command: "updateSubobject", subobjectID: 3, deleteMode: SubobjectDeleteMode.subobjectOnly });

    // // Add a modified existing subobject marked for removal
    storeManager.objects.add(4);
    storeManager.editedObjects.reset([4]);
    storeManager.editedObjects.update(4, { object_name: "modified name" });
    storeManager.editedObjects.updateEditedComposite(100, { command: "addExistingSubobject", subobjectID: 4, column: 1, row: 3 });
    storeManager.editedObjects.updateEditedComposite(100, { command: "updateSubobject", subobjectID: 4, deleteMode: SubobjectDeleteMode.subobjectOnly });

    // // Add an unmodified existing subobject marked for full deletion
    storeManager.objects.add(5);
    storeManager.editedObjects.reset([5]);
    storeManager.editedObjects.updateEditedComposite(100, { command: "addExistingSubobject", subobjectID: 5, column: 1, row: 4 });
    storeManager.editedObjects.updateEditedComposite(100, { command: "updateSubobject", subobjectID: 5, deleteMode: SubobjectDeleteMode.full });

    // // Add a modified existing subobject marked for full deletion
    storeManager.objects.add(6);
    storeManager.editedObjects.reset([6]);
    storeManager.editedObjects.update(6, { object_name: "modified name" });
    storeManager.editedObjects.updateEditedComposite(100, { command: "addExistingSubobject", subobjectID: 6, column: 1, row: 5 });
    storeManager.editedObjects.updateEditedComposite(100, { command: "updateSubobject", subobjectID: 6, deleteMode: SubobjectDeleteMode.full });

    // Run upsert fetch
    await storeManager.objectsEdit.save();

    // Check objects passed for upsert
    const backend = getBackend();
    const requests = backend.history.getMatchingRequests("/objects/bulk_upsert");
    expect(requests.length).toEqual(1);
    const { body } = requests[0].requestContext;
    expect(
        body["objects"].map(o => o["object_id"])
        .sort((a, b) => a - b)
    ).toEqual([
        -1, // new sub-subobject
        0,  // main object
        2,  // modified existing sub-subobject
        4,  // modified existing sub-subobject marked for removal
        100 // composite subobject of main object
    ]);

    // Check subobjects passed for upsert
    const mainObject = body["objects"].filter(o => o["object_id"] === 0)[0];
    expect(
        mainObject["object_data"]["subobjects"]
        .map(so => parseInt(so["subobject_id"]))
        .sort((a, b) => a - b)
    ).toEqual([100]);    // composite subobject
    
    const compositeSubobject = body["objects"].filter(o => o["object_id"] === 100)[0];
    expect(
        compositeSubobject["object_data"]["subobjects"]
        .map(so => parseInt(so["subobject_id"]))
        .sort((a, b) => a - b)
    ).toEqual([-1, 1, 2]);    // composite subobject 100
    
    // Check objects passed for full deletion
    expect(
        body["deleted_object_ids"]
        .sort((a, b) => a - b)
    ).toEqual([5, 6]);  // unmodified & modified existing marked for full deletion
    
    // Check objects, which were deleted from the state
    for (let objectID of [-2, -1, 0, 1, 2, 3, 4, 5, 6]) { // all new & existing sub-subobjects
        expect(store.getState()).not.toHaveProperty(`objects.${objectID}`);
        expect(store.getState()).not.toHaveProperty(`editedObjects.${objectID}`);
    }

    // Check objects, which remain in the state
    const objectIDMap = requests[0].response.body["new_object_ids_map"];
    for (let objectID of [
        objectIDMap[0],     // existing object created for main object
        100                 // composite subobject
    ]) {
        expect(store.getState()).toHaveProperty(`objects.${objectID}`);
        expect(store.getState()).toHaveProperty(`editedObjects.${objectID}`);
    }
});


test("Composite hierarchy with a loop", async () => {
    // Add a new composite object
    const storeManager = createTestStore(), { store } = storeManager;
    storeManager.objectsEdit.loadObjectsEditNewPage();
    storeManager.editedObjects.updateForUpsert(0, "composite");

    // Add existing composite objects, which have each other as subobjects
    for (let [objectID, subobject_id] of [[1, 2], [2, 1]]) {
        storeManager.objects.add(objectID, {
            attributes: { object_type: "composite" }, 
            data: { subobjects: [{ subobject_id }] }
        });
        storeManager.editedObjects.reset([objectID]);
    }

    // Modify one existing composite object
    storeManager.editedObjects.update(1, { object_name: "modified name" });
    
    // Add existing objects as subobjects
    for (let subobjectID of [1, 2]) storeManager.editedObjects.updateEditedComposite(
        0, { command: "addExistingSubobject", subobjectID, column: 0, row: subobjectID - 1 });

    // Run upsert fetch
    await storeManager.objectsEdit.save();

    // Check if main object & modified subobject were upserted
    const backend = getBackend();
    const requests = backend.history.getMatchingRequests("/objects/bulk_upsert");
    expect(requests.length).toEqual(1);
    const { body } = requests[0].requestContext;
    expect(
        body["objects"].map(o => o["object_id"])
        .sort((a, b) => a - b)
    ).toEqual([0, 1]);

    // Check if new object was removed from the state
    for (let objectID of [0]) {
        expect(store.getState()).not.toHaveProperty(`objects.${objectID}`);
        expect(store.getState()).not.toHaveProperty(`editedObjects.${objectID}`);
    }

    // Check if created object and its subobjects are present in the state
    const objectIDMap = requests[0].response.body["new_object_ids_map"];
    for (let objectID of [objectIDMap[0], 1, 2]) {
        expect(store.getState()).toHaveProperty(`objects.${objectID}`);
        expect(store.getState()).toHaveProperty(`editedObjects.${objectID}`);
    }
});
