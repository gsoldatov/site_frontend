import { MockBackend, getBackend } from "../../../../_mock-backend/mock-backend";
import { createTestStore } from "../../../../_util/create-test-store";
import { resetTestConfig } from "../../../../_mocks/config";

/*
    Tests for existing object's attributes, tags & data being correctly processed during /objects/edit/:id page upsert.
*/
beforeEach(() => {
    // Set test app configuration
    resetTestConfig();
    
    global.backend = new MockBackend();
    global.fetch = global.backend.fetch;

    // // Add a stub for method absent in test env
    // window.HTMLElement.prototype.scrollTo = () => {};
});


test("Object attributes", async () => {
    // Load an existing object & update its attributes
    const storeManager = createTestStore(), { store } = storeManager;
    await storeManager.objectsEdit.loadObjectsEditExistingPage(1);

    const attributes = {
        object_id: 1,
        object_type: "link",
        object_name: "updated object name",
        object_description: "updated object description",
        is_published: true,
        display_in_feed: true,
        feed_timestamp: (new Date()).toISOString(),
        show_description: false,
        owner_id: 999
    };
    storeManager.editedObjects.update(1, attributes);

    // Run upsert fetch
    await storeManager.objectsEdit.save();

    // Check if correct data was passed to backend
    const backend = getBackend();
    const requests = backend.history.getMatchingRequests("/objects/bulk_upsert");
    expect(requests.length).toEqual(1);
    const requestObject = requests[0].requestContext.body["objects"][0];
    for (let attr in attributes) 
        expect(attributes[attr]).toEqual(requestObject[attr]);
    
    // Check attributes were correctly added to the state
    for (let attr in attributes) {
        expect(store.getState()).toHaveProperty(`objects.1.${attr}`, attributes[attr]);
        expect(store.getState()).toHaveProperty(`editedObjects.1.${attr}`, attributes[attr]);
    }
});


test("Object's tags", async () => {
    // Set default tags of the object to be loaded
    const backend = getBackend();
    backend.cache.objects.update(1, { current_tag_ids: [1, 2, 3] });

    // Load an existing object & update its tags
    const storeManager = createTestStore(), { store } = storeManager;
    await storeManager.objectsEdit.loadObjectsEditExistingPage(1);
    const addedTags = [4, 5, 6, "new tag 1", "new tag 2"];
    const removedTagIDs = [1, 2];
    storeManager.editedObjects.update(1, { addedTags, removedTagIDs });

    // Run upsert fetch
    await storeManager.objectsEdit.save();

    // Check if correct tags were passed to backend
    const requests = backend.history.getMatchingRequests("/objects/bulk_upsert");
    expect(requests.length).toEqual(1);
    const requestObject = requests[0].requestContext.body["objects"][0];

    expect(requestObject["added_tags"]).toEqual(addedTags);
    expect(requestObject["removed_tag_ids"]).toEqual(removedTagIDs);

    // Check if tags were correctly added to state
    const returnedTagIDs = requests[0].response.body["objects_attributes_and_tags"][0]["current_tag_ids"];
    expect(store.getState()).toHaveProperty("objectsTags.1", returnedTagIDs);
    expect(store.getState()).toHaveProperty("editedObjects.1.currentTagIDs", returnedTagIDs);

    // Check if added & removed tags were reset
    expect(store.getState()).toHaveProperty(`editedObjects.1.addedTags`, []);
    expect(store.getState()).toHaveProperty(`editedObjects.1.removedTagIDs`, []);

    // Check if missing tag attributes were fetched
    for (let tagID of returnedTagIDs) expect(store.getState()).toHaveProperty(`tags.${tagID}`);
});


test("Link object data", async () => {
    // Load an existing object & update its object data
    const storeManager = createTestStore(), { store } = storeManager;
    await storeManager.objectsEdit.loadObjectsEditExistingPage(1);
    const link = { link: "http://updated.link.com", show_description_as_link: false };
    storeManager.editedObjects.update(1, { link });

    // Run upsert fetch
    await storeManager.objectsEdit.save();

    // Check if correct data passed to backend
    const backend = getBackend();
    const requests = backend.history.getMatchingRequests("/objects/bulk_upsert");
    expect(requests.length).toEqual(1);
    const requestObject = requests[0].requestContext.body["objects"][0];

    for (let attr in link) expect(requestObject["object_data"][attr]).toEqual(link[attr]);

    // Check if tags were correctly added to state
    for (let attr in link) {
        expect(store.getState()).toHaveProperty(`links.1.${attr}`, link[attr]);
        expect(store.getState()).toHaveProperty(`editedObjects.1.link.${attr}`, link[attr]);
    }
});


test("Markdown object data", async () => {
    // Set data of the object to be loaded
    const backend = getBackend();
    backend.cache.objects.update(1, { object_type: "markdown" });

    // Load an existing object & update its object data
    const storeManager = createTestStore(), { store } = storeManager;
    await storeManager.objectsEdit.loadObjectsEditExistingPage(1);
    const markdown = { raw_text: "updated markdown" };
    storeManager.editedObjects.update(1, { markdown });

    // Run upsert fetch
    await storeManager.objectsEdit.save();

    // Check if correct data passed to backend
    const requests = backend.history.getMatchingRequests("/objects/bulk_upsert");
    expect(requests.length).toEqual(1);
    const requestObject = requests[0].requestContext.body["objects"][0];

    for (let attr in markdown) expect(requestObject["object_data"][attr]).toEqual(markdown[attr]);

    // Check if data was correctly added to state
    for (let attr in markdown) {
        expect(store.getState()).toHaveProperty(`markdown.1.${attr}`, markdown[attr]);
        expect(store.getState()).toHaveProperty(`editedObjects.1.markdown.${attr}`, markdown[attr]);
    }
});


test("To-do list object data", async () => {
    // Set data of the object to be loaded
    const backend = getBackend();
    backend.cache.objects.update(1, { object_type: "to_do_list" }, { sort_type: "default", items: [] });

    // Load an existing object & update its object data
    const storeManager = createTestStore(), { store } = storeManager;
    await storeManager.objectsEdit.loadObjectsEditExistingPage(1);
    const toDoList = { sort_type: "state" };
    storeManager.editedObjects.update(1, { toDoList });

    // Add 2 items
    const firstItem = storeManager.generator.object.toDoListDataItem(1, 
        { item_number: 0, item_state: "active", item_text: "first", commentary: "first commentary", indent: 0, is_expanded: true });
    const secondItem = storeManager.generator.object.toDoListDataItem(1, 
        { item_number: 1, item_state: "completed", item_text: "second", commentary: "second commentary", indent: 1, is_expanded: false });
    storeManager.editedObjects.updateEditedToDoList(1, { command: "addItem", position: 0, ...firstItem });
    storeManager.editedObjects.updateEditedToDoList(1, { command: "addItem", position: 1, ...secondItem });

    // Run upsert fetch
    await storeManager.objectsEdit.save();

    // Check top-level attrs passed in request
    const requests = backend.history.getMatchingRequests("/objects/bulk_upsert");
    expect(requests.length).toEqual(1);
    const requestObject = requests[0].requestContext.body["objects"][0];
    for (let attr in toDoList) expect(requestObject["object_data"][attr]).toEqual(toDoList[attr]);

    // Check to-do list items passed in request
    expect(requestObject["object_data"]["items"].length).toEqual(2);
    for (let item of requestObject["object_data"]["items"]) {
        const expectedItem = item["item_number"] === 0 ? firstItem : secondItem;
        for (let attr in expectedItem) {
            expect(item[attr]).toEqual(expectedItem[attr]);
        }
    }

    // Check top-level attrs added to state
    for (let attr in toDoList) {
        expect(store.getState()).toHaveProperty(`toDoLists.1.${attr}`, toDoList[attr]);
        expect(store.getState()).toHaveProperty(`editedObjects.1.toDoList.${attr}`, toDoList[attr]);
    }

    // Check to-do list items added to state
    for (let attr in firstItem) {
        if (attr === "item_number") continue;
        expect(store.getState()).toHaveProperty(`toDoLists.1.items.0.${attr}`, firstItem[attr]);
        expect(store.getState()).toHaveProperty(`editedObjects.1.toDoList.items.0.${attr}`, firstItem[attr]);
    }
    for (let attr in secondItem) {
        if (attr === "item_number") continue;
        expect(store.getState()).toHaveProperty(`toDoLists.1.items.1.${attr}`, secondItem[attr]);
        expect(store.getState()).toHaveProperty(`editedObjects.1.toDoList.items.1.${attr}`, secondItem[attr]);
    }
});


test("Composite object data", async () => {
    // Set data of the object to be loaded
    const backend = getBackend();
    backend.cache.objects.update(1, { object_type: "composite" }, { display_mode: "basic", numerate_chapters: false, subobjects: [] });

    // Load an existing object & update its object data
    const storeManager = createTestStore(), { store } = storeManager;
    await storeManager.objectsEdit.loadObjectsEditExistingPage(1);
    const composite = { display_mode: "chapters", numerate_chapters: true };
    storeManager.editedObjects.update(1, { composite });
    storeManager.editedObjects.updateEditedComposite(1, { command: "addNewSubobject", column: 0, row: 0 });
    storeManager.editedObjects.updateForUpsert(-1);
    const subobject = store.getState().editedObjects[1].composite.subobjects[-1];

    // Run upsert fetch
    await storeManager.objectsEdit.save();

    // Check top-level attrs passed in request
    const requests = backend.history.getMatchingRequests("/objects/bulk_upsert");
    expect(requests.length).toEqual(1);
    const requestObjects = requests[0].requestContext.body["objects"].reduce((result, curr) => {
        result[curr.object_id] = curr;
        return result;
    }, {});
    
    for (let attr in composite) expect(requestObjects[1]["object_data"][attr]).toEqual(composite[attr]);

    // Check subobject passed in request
    expect(requestObjects[1]["object_data"]["subobjects"].length).toEqual(1);
    expect(requestObjects[1]["object_data"]["subobjects"][0]["subobject_id"]).toEqual(-1);
    for (let attr in subobject) {
        if (["fetchError", "deleteMode"].includes(attr)) continue;
        expect(requestObjects[1]["object_data"]["subobjects"][0][attr]).toEqual(subobject[attr]);
    }

    // Check top-level attrs added to state
    for (let attr in composite) {
        expect(store.getState()).toHaveProperty(`composite.1.${attr}`, composite[attr]);
        expect(store.getState()).toHaveProperty(`editedObjects.1.composite.${attr}`, composite[attr]);
    }

    // Check subobjects added to state
    const mappedSubobjectID = requests[0].response.body["new_object_ids_map"][-1];
    for (let attr in subobject) {
        if (["fetchError", "deleteMode"].includes(attr)) continue;
        expect(store.getState()).toHaveProperty(`composite.1.subobjects.${mappedSubobjectID}.${attr}`, subobject[attr]);
        expect(store.getState()).toHaveProperty(`editedObjects.1.composite.subobjects.${mappedSubobjectID}.${attr}`, subobject[attr]);
    }
});
