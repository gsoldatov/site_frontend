import { createTestStore } from "../../../_util/create-test-store";
import { resetTestConfig } from "../../../_mocks/config";

import { loadObjectsEditExistingPage, resetCurrentEditedObject } from "../../../../src/reducers/ui/objects-edit";
import { clearUnchangedEditedObjects } from "../../../../src/reducers/data/edited-objects";
import { SubobjectDeleteMode } from "../../../../src/types/store/data/composite";


/*
    Tests for existing object's reset on the /objects/edit/... pages.
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
        // Set current edited object & load it to the state
        const storeManager = createTestStore(), { store } = storeManager;
        store.dispatch(loadObjectsEditExistingPage(1));
        storeManager.objects.add(1);
        storeManager.editedObjects.reset([1]);
        expect(store.getState()).toHaveProperty("editedObjects.1");

        // Modify object's attributes & tags
        const update = {
            // object_id: -1,
            // object_type: "markdown",
            object_name: "updated name",
            object_description: "updated description",
            created_at: (new Date()).toISOString(),
            modified_at: (new Date()).toISOString(),
            is_published: true,
            display_in_feed: true,
            feed_timestamp: (new Date()).toISOString(),
            show_description: true,
            owner_id: 999,
            
            addedTags: ["new tag", 6],
            removedTagIDs: [1]
        }
        for (let attr of Object.keys(update)) expect(store.getState()).not.toHaveProperty(`editedObjects.1.${attr}`, update[attr]);
        storeManager.editedObjects.update(1, update);
        for (let attr of Object.keys(update)) expect(store.getState()).toHaveProperty(`editedObjects.1.${attr}`, update[attr]);

        // Reset object and check if it can be cleared
        store.dispatch(resetCurrentEditedObject(false));
        store.dispatch(clearUnchangedEditedObjects(1));
        expect(store.getState()).not.toHaveProperty("editedObjects.1");
    });


    test("Link object data", () => {
        // Set current edited object & load it to the state
        const storeManager = createTestStore(), { store } = storeManager;
        store.dispatch(loadObjectsEditExistingPage(1));
        storeManager.objects.add(1);
        storeManager.editedObjects.reset([1]);
        expect(store.getState()).toHaveProperty("editedObjects.1");

        // Modify link object's data
        const update = {
            object_type: "link",
            link: { link: "modified link", show_description_as_link: true }
        }
        for (let attr of Object.keys(update.link)) expect(store.getState()).not.toHaveProperty(`editedObjects.1.link.${attr}`, update.link[attr]);
        storeManager.editedObjects.update(1, update);
        for (let attr of Object.keys(update.link)) expect(store.getState()).toHaveProperty(`editedObjects.1.link.${attr}`, update.link[attr]);

        // Reset object and check if it can be cleared
        store.dispatch(resetCurrentEditedObject(false));
        store.dispatch(clearUnchangedEditedObjects(1));
        expect(store.getState()).not.toHaveProperty("editedObjects.1");
    });


    test("Markdown object data", () => {
        // Set current edited object & load it to the state
        const storeManager = createTestStore(), { store } = storeManager;
        store.dispatch(loadObjectsEditExistingPage(1));
        storeManager.objects.add(1, { attributes: { object_type: "markdown" }});
        storeManager.editedObjects.reset([1]);
        expect(store.getState()).toHaveProperty("editedObjects.1");

        // Modify markdown object's data
        const update = {
            object_type: "markdown",
            markdown: { raw_text: "modified raw_text", parsed: "modified parsed text" }
        }
        for (let attr of Object.keys(update.markdown)) expect(store.getState()).not.toHaveProperty(`editedObjects.1.markdown.${attr}`, update.markdown[attr]);
        storeManager.editedObjects.update(1, update);
        for (let attr of Object.keys(update.markdown)) expect(store.getState()).toHaveProperty(`editedObjects.1.markdown.${attr}`, update.markdown[attr]);

        // Reset object and check if it can be cleared
        store.dispatch(resetCurrentEditedObject(false));
        expect(store.getState()).toHaveProperty("editedObjects.1.markdown.parsed", "");     // check if parsed text was reset separately,
                                                                                            // since it's ignored in the persistence check
        store.dispatch(clearUnchangedEditedObjects(1));
        expect(store.getState()).not.toHaveProperty("editedObjects.1");
    });


    test("To-do list object data", () => {
        // Set current edited object & load it to the state
        const storeManager = createTestStore(), { store, generator } = storeManager;
        store.dispatch(loadObjectsEditExistingPage(1));
        storeManager.objects.add(1, { 
            attributes: { object_type: "to_do_list" },
            data: { items: [{ item_number: 0 }, { item_number: 1 }]}
        });
        storeManager.editedObjects.reset([1]);
        expect(store.getState()).toHaveProperty("editedObjects.1");

        // Modify to-do list object's data
        const update = {
            object_type: "to_do_list",
            toDoList: {
                // Basic props
                sort_type: "state",
                items: generator.editedObject.toDoListItems(1, [
                    // Modify item 0
                    { item_number: 0, item_state: "cancelled", item_text: "modified text", commentary: "modified comment", indent: 2, is_expanded: false },
                    // Remove item 1 & add item 2
                    { item_number: 2 }
                ]),
                
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
            if (attr !== "items") expect(store.getState()).not.toHaveProperty(`editedObjects.1.toDoList.${attr}`, update.toDoList[attr]);
        expect(Object.keys(store.getState().editedObjects[1].toDoList.items).sort()).toEqual(["0", "1"]);
        storeManager.editedObjects.update(1, update);
        for (let attr of Object.keys(update.toDoList))
            if (attr !== "items") expect(store.getState()).toHaveProperty(`editedObjects.1.toDoList.${attr}`, update.toDoList[attr]);
        expect(Object.keys(store.getState().editedObjects[1].toDoList.items).sort()).toEqual(["0", "2"]);

        // Reset object and check if it can be cleared
        store.dispatch(resetCurrentEditedObject(false));
        store.dispatch(clearUnchangedEditedObjects(1));
        expect(store.getState()).not.toHaveProperty("editedObjects.1");
    });


    test("Composite object data", () => {
        // Set current edited object & load it to the state
        const storeManager = createTestStore(), { store, generator } = storeManager;
        store.dispatch(loadObjectsEditExistingPage(1));
        storeManager.objects.add(1, { 
            attributes: { object_type: "composite" },
            data: { subobjects: [{ subobject_id: 101, column: 0, row: 0 }]}
        });
        storeManager.editedObjects.reset([1]);
        expect(store.getState()).toHaveProperty("editedObjects.1");

        // Modify composite object's data
        const update = {
            object_type: "composite",
            composite: {
                display_mode: "chapters",
                numerate_chapters: true,
                subobjects: generator.editedObject.subobjects([
                    // Modify existing subobject
                    { 
                        subobject_id: 101, column: 1, row: 1, is_expanded: false, selected_tab: 2,
                        show_description_composite: "yes", show_description_as_link_composite: "yes",
                        fetchError: "error text", deleteMode: SubobjectDeleteMode.full
                    },
                    // Add a new subobject
                    { subobject_id: -1, column: 2, row: 2 }
                ])
            }
        };
        for (let attr of Object.keys(update.composite))
            if (attr !== "subobjects") expect(store.getState()).not.toHaveProperty(`editedObjects.1.composite.${attr}`, update.composite[attr]);
        expect(Object.keys(store.getState().editedObjects[1].composite.subobjects).sort()).toEqual(["101"]);
        storeManager.editedObjects.update(1, update);
        for (let attr of Object.keys(update.composite))
            if (attr !== "subobjects") expect(store.getState()).toHaveProperty(`editedObjects.1.composite.${attr}`, update.composite[attr]);
        expect(Object.keys(store.getState().editedObjects[1].composite.subobjects)).toEqual(["101", "-1"]);

        // Reset object and check if it can be cleared
        store.dispatch(resetCurrentEditedObject(false));
        store.dispatch(clearUnchangedEditedObjects(1));
        expect(store.getState()).not.toHaveProperty("editedObjects.1");
    });
});


describe("Composite subobjects", () => {
    test("Non-composite subobjects without subobject reset", () => {
        // Set current edited object & load it to the state
        const storeManager = createTestStore(), { store, generator } = storeManager;
        store.dispatch(loadObjectsEditExistingPage(1));
        storeManager.objects.add(1, { 
            attributes: { object_type: "composite" },
            // Composite has 1 subobject at the start
            data: { subobjects: [{ subobject_id: 101, column: 0, row: 0 }]}
        });
        storeManager.editedObjects.reset([1]);
        expect(store.getState()).toHaveProperty("editedObjects.1");
        
        // Add existing objects to act as subobjects & modfiy them
        const object_name = "modified name";

        for (let i of [101, 102]) {
            storeManager.objects.add(i);
            storeManager.editedObjects.reset([i]);
            expect(store.getState()).toHaveProperty(`editedObjects.${i}`);
            
            storeManager.editedObjects.update(i, { object_name });
        }

        // Add a new & an existing subobject & modify the latter
        // (don't change object type to check subobject reset in composite objects)
        storeManager.editedObjects.updateEditedComposite(1, { command: "addNewSubobject", column: 0, row: 1 });
        storeManager.editedObjects.updateEditedComposite(1, { command: "addExistingSubobject", subobjectID: 102, column: 0, row: 2 });

        // Reset object without subobjects & check if new subobject was removed
        // and changes on existing subobjects remain
        store.dispatch(resetCurrentEditedObject(false));
        expect(store.getState()).not.toHaveProperty("editedObjects.-1");
        for (let i of [101, 102]) expect(store.getState()).toHaveProperty(`editedObjects.${i}.object_name`, object_name);
    });


    test("Non-composite subobjects with subobject reset", () => {
        // Set current edited object & load it to the state
        const storeManager = createTestStore(), { store, generator } = storeManager;
        store.dispatch(loadObjectsEditExistingPage(1));
        storeManager.objects.add(1, { 
            attributes: { object_type: "composite" },
            // Composite has 1 subobject at the start
            data: { subobjects: [{ subobject_id: 101, column: 0, row: 0 }]}
        });
        storeManager.editedObjects.reset([1]);
        expect(store.getState()).toHaveProperty("editedObjects.1");
        
        // Add an existing object to act as a subobject & modfiy it
        // Add existing objects to act as subobjects & modfiy them
        const object_name = "unmodified name";
        for (let i of [101, 102]) {
            storeManager.objects.add(i, { attributes: { object_name }});
            storeManager.editedObjects.reset([i]);
            expect(store.getState()).toHaveProperty(`editedObjects.${i}`);
            
            storeManager.editedObjects.update(i, { object_name: "modified name" });
        }

        // Add a new & an existing subobject & modify the latter
        // (don't change object type to check subobject reset in composite objects)
        storeManager.editedObjects.updateEditedComposite(1, { command: "addNewSubobject", column: 0, row: 1 });
        storeManager.editedObjects.updateEditedComposite(1, { command: "addExistingSubobject", subobjectID: 102, column: 0, row: 2 });

        // Reset object with subobjects & check if
        // 1) new & existing added subobjects were removed
        // 2) existing subobject present from the start was reset, but not removed
        store.dispatch(resetCurrentEditedObject(true));
        for (let i of [-1, 102]) expect(store.getState()).not.toHaveProperty(`editedObjects.${i}`);
        expect(store.getState()).toHaveProperty("editedObjects.101.object_name", object_name);
    });


    test("Subobjects of composite type with subobject reset", () => {
        // Set current edited object & load it to the state
        const storeManager = createTestStore(), { store, generator } = storeManager;
        store.dispatch(loadObjectsEditExistingPage(1));
        storeManager.objects.add(1, { 
            attributes: { object_type: "composite" },
            // Composite has a composite subobject at the start
            data: { subobjects: [{ subobject_id: 100, column: 0, row: 0 }]}
        });
        storeManager.editedObjects.reset([1]);
        expect(store.getState()).toHaveProperty("editedObjects.1");
        
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

        // Reset object with subobjects & check if:
        // 1) existing composite was not removed (since it was added at the start), but was reset
        // 2) new subobject of existing composite was removed
        // 3) existing modified subobject of existing composite was not reset
        store.dispatch(resetCurrentEditedObject(true));
        expect(Object.keys(store.getState().editedObjects[100].composite.subobjects)).toEqual([]);
        expect(store.getState()).not.toHaveProperty("editedObjects.-1");
        expect(store.getState()).toHaveProperty(`editedObjects.101.object_name`, object_name);
    });
});
