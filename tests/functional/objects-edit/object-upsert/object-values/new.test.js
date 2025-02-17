import { MockBackend, getBackend } from "../../../../_mock-backend/mock-backend";
import { createTestStore } from "../../../../_util/create-test-store";
import { resetTestConfig } from "../../../../_mocks/config";

/*
    Tests for new object's attributes, tags & data being correctly processed during /objects/edit/:id page upsert.
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
    // Add a new object with specified attributes
    const storeManager = createTestStore(), { store } = storeManager;
    storeManager.objectsEdit.loadObjectsEditNewPage();

    const attributes = {
        object_id: 0,
        object_type: "markdown",
        object_name: "object name",
        object_description: "object description",
        is_published: true,
        display_in_feed: true,
        feed_timestamp: (new Date()).toISOString(),
        show_description: false,
        owner_id: 999
    };
    storeManager.editedObjects.update(0, { ...attributes, markdown: { raw_text: "text", parsed: "text" }});

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
    const mappedObjectID = requests[0].response.body["new_object_ids_map"][0];
    for (let attr in attributes) {
        const expectedValue = attr === "object_id" ? 1000 : attributes[attr];
        expect(store.getState()).toHaveProperty(`objects.${mappedObjectID}.${attr}`, expectedValue);
        expect(store.getState()).toHaveProperty(`editedObjects.${mappedObjectID}.${attr}`, expectedValue);
    }
});


test("Object's tags", async () => {
    // Add a new object, update its tags & required attributes
    const storeManager = createTestStore(), { store } = storeManager;
    storeManager.objectsEdit.loadObjectsEditNewPage();
    const addedTags = [1, 2, 3, "new tag 1", "new tag 2"];
    storeManager.editedObjects.updateForUpsert(0, "link", { addedTags });

    // Run upsert fetch
    await storeManager.objectsEdit.save();

    // Check if correct tags were passed to backend
    const backend = getBackend();
    const requests = backend.history.getMatchingRequests("/objects/bulk_upsert");
    expect(requests.length).toEqual(1);
    const requestObject = requests[0].requestContext.body["objects"][0];

    expect(requestObject["added_tags"]).toEqual(addedTags);

    // Check if tags were correctly added to state
    const mappedObjectID = requests[0].response.body["new_object_ids_map"][0];
    const returnedTagIDs = requests[0].response.body["objects_attributes_and_tags"][0]["current_tag_ids"];
    expect(store.getState()).toHaveProperty(`objectsTags.${mappedObjectID}`, returnedTagIDs);
    expect(store.getState()).toHaveProperty(`editedObjects.${mappedObjectID}.currentTagIDs`, returnedTagIDs);

    // Check if added tags were reset
    expect(store.getState()).toHaveProperty(`editedObjects.${mappedObjectID}.addedTags`, []);


    // Check if missing tag attributes were fetched
    for (let tagID of returnedTagIDs) expect(store.getState()).toHaveProperty(`tags.${tagID}`);
});


test("Link object data", async () => {
    // Add a new object, update its data & required attributes
    const storeManager = createTestStore(), { store } = storeManager;
    storeManager.objectsEdit.loadObjectsEditNewPage();
    const link = { link: "http://test.link.com", show_description_as_link: false };
    storeManager.editedObjects.updateForUpsert(0, "link", { link });

    // Run upsert fetch
    await storeManager.objectsEdit.save();

    // Check if correct data passed to backend
    const backend = getBackend();
    const requests = backend.history.getMatchingRequests("/objects/bulk_upsert");
    expect(requests.length).toEqual(1);
    const requestObject = requests[0].requestContext.body["objects"][0];

    for (let attr in link) expect(requestObject["object_data"][attr]).toEqual(link[attr]);

    // Check if tags were correctly added to state
    const mappedObjectID = requests[0].response.body["new_object_ids_map"][0];
    for (let attr in link) {
        expect(store.getState()).toHaveProperty(`links.${mappedObjectID}.${attr}`, link[attr]);
        expect(store.getState()).toHaveProperty(`editedObjects.${mappedObjectID}.link.${attr}`, link[attr]);
    }
});


test("Markdown object data", async () => {
    // Add a new object, update its data & required attributes
    const storeManager = createTestStore(), { store } = storeManager;
    storeManager.objectsEdit.loadObjectsEditNewPage();
    const markdown = { raw_text: "some text" };
    storeManager.editedObjects.updateForUpsert(0, "markdown", { markdown });

    // Run upsert fetch
    await storeManager.objectsEdit.save();

    // Check if correct data passed to backend
    const backend = getBackend();
    const requests = backend.history.getMatchingRequests("/objects/bulk_upsert");
    expect(requests.length).toEqual(1);
    const requestObject = requests[0].requestContext.body["objects"][0];

    for (let attr in markdown) expect(requestObject["object_data"][attr]).toEqual(markdown[attr]);

    // Check if data was correctly added to state
    const mappedObjectID = requests[0].response.body["new_object_ids_map"][0];
    for (let attr in markdown) {
        expect(store.getState()).toHaveProperty(`markdown.${mappedObjectID}.${attr}`, markdown[attr]);
        expect(store.getState()).toHaveProperty(`editedObjects.${mappedObjectID}.markdown.${attr}`, markdown[attr]);
    }
});


test("To-do list object data", async () => {
    // Add a new object, update its data & required attributes
    const storeManager = createTestStore(), { store } = storeManager;
    storeManager.objectsEdit.loadObjectsEditNewPage();
    const toDoList = { sort_type: "state" };
    storeManager.editedObjects.updateForUpsert(0, "to_do_list", { toDoList });

    // Update first item & add a second
    const firstItem = storeManager.generator.object.toDoListDataItem(0, 
        { item_number: 0, item_state: "active", item_text: "first", commentary: "first commentary", indent: 0, is_expanded: true });
    const secondItem = storeManager.generator.object.toDoListDataItem(0, 
        { item_number: 1, item_state: "completed", item_text: "second", commentary: "second commentary", indent: 1, is_expanded: false });
    storeManager.editedObjects.updateEditedToDoList(0, { command: "updateItem", itemID: 0, ...firstItem });
    storeManager.editedObjects.updateEditedToDoList(0, { command: "addItem", position: 1, ...secondItem });

    // Run upsert fetch
    await storeManager.objectsEdit.save();

    // Check top-level attrs passed in request
    const backend = getBackend();
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
    const mappedObjectID = requests[0].response.body["new_object_ids_map"][0];
    for (let attr in toDoList) {
        expect(store.getState()).toHaveProperty(`toDoLists.${mappedObjectID}.${attr}`, toDoList[attr]);
        expect(store.getState()).toHaveProperty(`editedObjects.${mappedObjectID}.toDoList.${attr}`, toDoList[attr]);
    }

    // Check to-do list items added to state
    for (let attr in firstItem) {
        if (attr === "item_number") continue;
        expect(store.getState()).toHaveProperty(`toDoLists.${mappedObjectID}.items.0.${attr}`, firstItem[attr]);
        expect(store.getState()).toHaveProperty(`editedObjects.${mappedObjectID}.toDoList.items.0.${attr}`, firstItem[attr]);
    }
    for (let attr in secondItem) {
        if (attr === "item_number") continue;
        expect(store.getState()).toHaveProperty(`toDoLists.${mappedObjectID}.items.1.${attr}`, secondItem[attr]);
        expect(store.getState()).toHaveProperty(`editedObjects.${mappedObjectID}.toDoList.items.1.${attr}`, secondItem[attr]);
    }
});


test("Composite object data", async () => {
    // Add a new composite object with a new subobjects & fill required attributes
    const storeManager = createTestStore(), { store } = storeManager;
    storeManager.objectsEdit.loadObjectsEditNewPage();
    const composite = { display_mode: "chapters", numerate_chapters: true };
    storeManager.editedObjects.updateForUpsert(0, "composite", { composite });
    storeManager.editedObjects.updateEditedComposite(0, { command: "addNewSubobject", column: 0, row: 0 });
    storeManager.editedObjects.updateForUpsert(-1);
    const subobject = store.getState().editedObjects[0].composite.subobjects[-1];

    // Run upsert fetch
    await storeManager.objectsEdit.save();

    // Check top-level attrs passed in request
    const backend = getBackend();
    const requests = backend.history.getMatchingRequests("/objects/bulk_upsert");
    expect(requests.length).toEqual(1);
    const requestObjects = requests[0].requestContext.body["objects"].reduce((result, curr) => {
        result[curr.object_id] = curr;
        return result;
    }, {});
    
    for (let attr in composite) expect(requestObjects[0]["object_data"][attr]).toEqual(composite[attr]);

    // Check subobject passed in request
    expect(requestObjects[0]["object_data"]["subobjects"].length).toEqual(1);
    expect(requestObjects[0]["object_data"]["subobjects"][0]["subobject_id"]).toEqual(-1);
    for (let attr in subobject) {
        if (["fetchError", "deleteMode"].includes(attr)) continue;
        expect(requestObjects[0]["object_data"]["subobjects"][0][attr]).toEqual(subobject[attr]);
    }

    // Check top-level attrs added to state
    const mappedObjectID = requests[0].response.body["new_object_ids_map"][0];
    for (let attr in composite) {
        expect(store.getState()).toHaveProperty(`composite.${mappedObjectID}.${attr}`, composite[attr]);
        expect(store.getState()).toHaveProperty(`editedObjects.${mappedObjectID}.composite.${attr}`, composite[attr]);
    }

    // Check subobjects added to state
    const mappedSubobjectID = requests[0].response.body["new_object_ids_map"][-1];
    for (let attr in subobject) {
        if (["fetchError", "deleteMode"].includes(attr)) continue;
        expect(store.getState()).toHaveProperty(`composite.${mappedObjectID}.subobjects.${mappedSubobjectID}.${attr}`, subobject[attr]);
        expect(store.getState()).toHaveProperty(`editedObjects.${mappedObjectID}.composite.subobjects.${mappedSubobjectID}.${attr}`, subobject[attr]);
    }
});
