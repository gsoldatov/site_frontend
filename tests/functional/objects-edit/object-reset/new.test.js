import { createTestStore } from "../../../_util/create-test-store";
import { resetTestConfig } from "../../../_mocks/config";

import { loadObjectsEditNewPage, resetCurrentEditedObject } from "../../../../src/reducers/ui/objects-edit";
import { clearUnchangedEditedObjects } from "../../../../src/reducers/data/edited-objects";


/*
    Tests for new object's reset on the /objects/edit/... pages.
*/
beforeEach(() => {
    // Set test app configuration
    resetTestConfig();
    
    // global.backend = new MockBackend();
    // global.fetch = global.backend.fetch;

    // // Add a stub for method absent in test env
    // window.HTMLElement.prototype.scrollTo = () => {};
});


describe("Attributes, tags & data", () => {
    test("Attributes and tags", () => {
        // Create a store and simulate navigating to the /objects/edit/new page
        // (which also adds an object with object_id = 0)
        const storeManager = createTestStore(), { store } = storeManager;
        store.dispatch(loadObjectsEditNewPage());
        expect(store.getState()).toHaveProperty("editedObjects.0");

        // Modify object's attributes & tags
        const update = {
            // object_id: -1,
            object_type: "markdown",
            object_name: "new name",
            object_description: "new description",
            created_at: (new Date()).toISOString(),
            modified_at: (new Date()).toISOString(),
            is_published: true,
            display_in_feed: false,
            feed_timestamp: (new Date()).toISOString(),
            show_description: false,
            owner_id: 999,
            
            addedTags: ["new tag", 1]
        }
        for (let attr of Object.keys(update)) expect(store.getState()).not.toHaveProperty(`editedObjects.0.${attr}`, update[attr]);
        storeManager.editedObjects.update(0, update);
        for (let attr of Object.keys(update)) expect(store.getState()).toHaveProperty(`editedObjects.0.${attr}`, update[attr]);

        // Reset object and check if it can be cleared
        store.dispatch(resetCurrentEditedObject(false));
        store.dispatch(clearUnchangedEditedObjects(0));
        expect(store.getState()).not.toHaveProperty("editedObjects.0");
    });


    test("Link object data", () => {
        // Create a store and simulate navigating to the /objects/edit/new page
        // (which also adds an object with object_id = 0)
        const storeManager = createTestStore(), { store } = storeManager;
        store.dispatch(loadObjectsEditNewPage());
        expect(store.getState()).toHaveProperty("editedObjects.0");

        // Modify link object's data
        const update = {
            object_type: "link",
            link: { link: "modified link", show_description_as_link: true }
        }
        for (let attr of Object.keys(update.link)) expect(store.getState()).not.toHaveProperty(`editedObjects.0.link.${attr}`, update.link[attr]);
        storeManager.editedObjects.update(0, update);
        for (let attr of Object.keys(update.link)) expect(store.getState()).toHaveProperty(`editedObjects.0.link.${attr}`, update.link[attr]);

        // Reset object and check if it can be cleared
        store.dispatch(resetCurrentEditedObject(false));
        store.dispatch(clearUnchangedEditedObjects(0));
        expect(store.getState()).not.toHaveProperty("editedObjects.0");
    });


    test("Markdown object data", () => {
        // Create a store and simulate navigating to the /objects/edit/new page
        // (which also adds an object with object_id = 0)
        const storeManager = createTestStore(), { store } = storeManager;
        store.dispatch(loadObjectsEditNewPage());
        expect(store.getState()).toHaveProperty("editedObjects.0");

        // Modify markdown object's data
        const update = {
            object_type: "markdown",
            markdown: { raw_text: "modified raw_text", parsed: "modified parsed text" }
        }
        for (let attr of Object.keys(update.markdown)) expect(store.getState()).not.toHaveProperty(`editedObjects.0.markdown.${attr}`, update.markdown[attr]);
        storeManager.editedObjects.update(0, update);
        for (let attr of Object.keys(update.markdown)) expect(store.getState()).toHaveProperty(`editedObjects.0.markdown.${attr}`, update.markdown[attr]);

        // Reset object and check if it can be cleared
        store.dispatch(resetCurrentEditedObject(false));
        expect(store.getState()).toHaveProperty("editedObjects.0.markdown.parsed", "");     // check if parsed text was reset separately,
                                                                                            // since it's ignored in the persistence check
        store.dispatch(clearUnchangedEditedObjects(0));
        expect(store.getState()).not.toHaveProperty("editedObjects.0");
    });


    test("To-do list object data", () => {
        // Create a store and simulate navigating to the /objects/edit/new page
        // (which also adds an object with object_id = 0)
        const storeManager = createTestStore(), { store, generator } = storeManager;
        store.dispatch(loadObjectsEditNewPage());
        expect(store.getState()).toHaveProperty("editedObjects.0");

        // Modify to-do list object's data
        const update = {
            object_type: "to_do_list",
            toDoList: {
                // Basic props
                sort_type: "state",
                items: generator.editedObject.toDoListItems(0),
                
                // Frontend-only props
                itemOrder: [999],
                setFocusOnID: 999,
                caretPositionOnFocus: 999,
                newItemInputIndent: 5,
                draggedParent: 999,
                draggedChildren: [999],
                draggedOver: 999,
                dropIndent: 5
            }
        };
        for (let attr of Object.keys(update.toDoList))
            if (attr !== "items") expect(store.getState()).not.toHaveProperty(`editedObjects.0.toDoList.${attr}`, update.toDoList[attr]);
        expect(Object.keys(store.getState().editedObjects[0].toDoList.items)).toEqual([]);
        storeManager.editedObjects.update(0, update);
        for (let attr of Object.keys(update.toDoList))
            if (attr !== "items") expect(store.getState()).toHaveProperty(`editedObjects.0.toDoList.${attr}`, update.toDoList[attr]);
        expect(Object.keys(store.getState().editedObjects[0].toDoList.items)).toEqual(["0"]);

        // Reset object and check if it can be cleared
        store.dispatch(resetCurrentEditedObject(false));
        store.dispatch(clearUnchangedEditedObjects(0));
        expect(store.getState()).not.toHaveProperty("editedObjects.0");
    });


    test("Composite object data", () => {
        // Create a store and simulate navigating to the /objects/edit/new page
        // (which also adds an object with object_id = 0)
        const storeManager = createTestStore(), { store, generator } = storeManager;
        store.dispatch(loadObjectsEditNewPage());
        expect(store.getState()).toHaveProperty("editedObjects.0");

        // Modify composite object's data
        const update = {
            object_type: "composite",
            composite: {
                display_mode: "chapters",
                numerate_chapters: true,
                subobjects: generator.editedObject.subobjects([{ subobject_id: 1, column: 0, row: 0 }])
            }
        };
        for (let attr of Object.keys(update.composite))
            if (attr !== "subobjects") expect(store.getState()).not.toHaveProperty(`editedObjects.0.composite.${attr}`, update.composite[attr]);
        expect(Object.keys(store.getState().editedObjects[0].composite.subobjects)).toEqual([]);
        storeManager.editedObjects.update(0, update);
        for (let attr of Object.keys(update.composite))
            if (attr !== "subobjects") expect(store.getState()).toHaveProperty(`editedObjects.0.composite.${attr}`, update.composite[attr]);
        expect(Object.keys(store.getState().editedObjects[0].composite.subobjects)).toEqual(["1"]);

        // Reset object and check if it can be cleared
        store.dispatch(resetCurrentEditedObject(false));
        store.dispatch(clearUnchangedEditedObjects(0));
        expect(store.getState()).not.toHaveProperty("editedObjects.0");
    });
});


describe("Composite subobjects", () => {
    test("Non-composite subobjects without subobject reset", () => {
        // Create a store and simulate navigating to the /objects/edit/new page
        // (which also adds an object with object_id = 0)
        const storeManager = createTestStore(), { store, generator } = storeManager;
        store.dispatch(loadObjectsEditNewPage());
        
        // Add an existing object to act as a subobject & modfiy it
        storeManager.objects.add(1);
        storeManager.editedObjects.reset([1]);
        for (let i of [0, 1]) expect(store.getState()).toHaveProperty(`editedObjects.${i}`);

        const object_name = "modified name";
        storeManager.editedObjects.update(1, { object_name });

        // Add a new & an existing subobject & modify the latter
        // (don't change object type to check subobject reset in composite objects)
        storeManager.editedObjects.updateEditedComposite(0, { command: "addNewSubobject", column: 0, row: 0 });
        storeManager.editedObjects.updateEditedComposite(0, { command: "addExistingSubobject", subobjectID: 1, column: 0, row: 1 });

        // Reset object without subobjects & check if new subobject was removed
        // and changes on existing remain
        store.dispatch(resetCurrentEditedObject(false));
        expect(store.getState()).not.toHaveProperty("editedObjects.-1");
        expect(store.getState()).toHaveProperty(`editedObjects.1.object_name`, object_name);
    });
    

    test("Non-composite subobjects with subobject reset", () => {
        // Create a store and simulate navigating to the /objects/edit/new page
        // (which also adds an object with object_id = 0)
        const storeManager = createTestStore(), { store, generator } = storeManager;
        store.dispatch(loadObjectsEditNewPage());
        
        // Add an existing object to act as a subobject & modfiy it
        storeManager.objects.add(1);
        storeManager.editedObjects.reset([1]);
        for (let i of [0, 1]) expect(store.getState()).toHaveProperty(`editedObjects.${i}`);

        storeManager.editedObjects.update(1, { object_name: "modified name" });

        // Add a new & an existing subobject & modify the latter
        // (don't change object type to check subobject reset in composite objects)
        storeManager.editedObjects.updateEditedComposite(0, { command: "addNewSubobject", column: 0, row: 0 });
        storeManager.editedObjects.updateEditedComposite(0, { command: "addExistingSubobject", subobjectID: 1, column: 0, row: 1 });

        // Reset object with subobjects & check if new & existing subobjects were removed
        store.dispatch(resetCurrentEditedObject(true));
        for (let i of [-1, 1]) expect(store.getState()).not.toHaveProperty(`editedObjects.${i}`);
    });


    test("Subobjects of composite type with subobject reset", () => {
        // Create a store and simulate navigating to the /objects/edit/new page
        // (which also adds an object with object_id = 0)
        const storeManager = createTestStore(), { store, generator } = storeManager;
        store.dispatch(loadObjectsEditNewPage());
        
        // Add an existing composite object & a new & modified existing subobjects
        storeManager.objects.add(100, { 
            attributes: { object_type: "composite" },
            data: { subobjects: []}
        });
        storeManager.objects.add(101);
        storeManager.editedObjects.reset([100, 101]);
        for (let i of [100, 101]) expect(store.getState()).toHaveProperty(`editedObjects.${i}`);
        
        const object_name = "modified name";
        storeManager.editedObjects.update(101, { object_name });

        storeManager.editedObjects.updateEditedComposite(100, { command: "addNewSubobject", column: 0, row: 0 });
        storeManager.editedObjects.updateEditedComposite(100, { command: "addExistingSubobject", subobjectID: 101, column: 0, row: 1 });

        // Add a new composite object & add existing composite as its subobject
        storeManager.editedObjects.reset([0]);
        storeManager.editedObjects.update(0, { object_type: "composite" });
        expect(store.getState()).toHaveProperty("editedObjects.0.object_type", "composite");

        storeManager.editedObjects.updateEditedComposite(0, { command: "addExistingSubobject", subobjectID: 100, column: 0, row: 0 });

        // Reset object with subobjects & check if:
        // 1) existing composite was removed
        // 2) new subobject of existing composite was removed
        // 3) existing modified subobject of existing composite was not reset
        store.dispatch(resetCurrentEditedObject(true));
        expect(store.getState()).not.toHaveProperty("editedObjects.100");
        expect(store.getState()).not.toHaveProperty("editedObjects.-1");
        expect(store.getState()).toHaveProperty(`editedObjects.101.object_name`, object_name);
    });
});
