import { createTestStore } from "../../_util/create-test-store";
import { resetTestConfig } from "../../_mocks/config";

import { clearUnchangedEditedObjects } from "../../../src/reducers/data/edited-objects";
import { objectTypeValues } from "../../../src/types/store/data/objects";
import { SubobjectDeleteMode } from "../../../src/types/store/data/composite";


/*
    Tests for existing object's persistence after /objects/edit/... page leave.
*/
beforeEach(() => {
    // Set test app configuration
    resetTestConfig();
    
    // global.backend = new MockBackend();
    // global.fetch = global.backend.fetch;

    // // Add a stub for method absent in test env
    // window.HTMLElement.prototype.scrollTo = () => {};
});


describe("General, attributes & tags", () => {
    test("Unchanged existing object is removed", () => {
        for (let object_type of objectTypeValues) {
            const storeManager = createTestStore(), { store } = storeManager;
            storeManager.objects.add(1, { attributes: { object_type }});
            storeManager.editedObjects.reset([1]);
            expect(store.getState()).toHaveProperty("editedObjects.1");

            store.dispatch(clearUnchangedEditedObjects(1));
            expect(store.getState()).not.toHaveProperty("editedObjects.1");
        }
    });


    test("Unchanged existing object with missing data in store is persisted", () => {
        for (let [object_type, storeName] of [
            ["link", "objects"],
            ["link", "objectsTags"],
            ["link", "links"],
            ["markdown", "markdown"],
            ["to_do_list", "toDoLists"],
            ["composite", "composite"],
        ]) {
            // Add an existing edited object
            const storeManager = createTestStore(), { store } = storeManager;
            storeManager.objects.add(1, { attributes: { object_type }});
            storeManager.editedObjects.reset([1]);
            expect(store.getState()).toHaveProperty("editedObjects.1");

            // Remove part of object's data from the state
            const newStore = { ...store.getState()[storeName] };
            delete newStore[1];
            storeManager.updateState({ [storeName]: newStore });
            
            // Check if object persists the clear, if its modification can't be resolved
            store.dispatch(clearUnchangedEditedObjects(1));
            expect(store.getState()).toHaveProperty("editedObjects.1");
        }
    });


    test("Attribute changes are persisted", () => {
        for (let [attr, value] of [
            // object_id: -1,
            ["object_type", "markdown"],
            ["object_name", "updated name"],
            ["object_description", "updated description"],
            ["created_at", (new Date()).toISOString()],
            ["modified_at", (new Date()).toISOString()],
            ["is_published", true],
            ["display_in_feed", true],
            ["feed_timestamp", (new Date()).toISOString()],
            ["show_description", true],
            ["owner_id", 999],
        ]) {
            // Add an existing object
            const storeManager = createTestStore(), { store } = storeManager;
            storeManager.objects.add(1);
            storeManager.editedObjects.reset([1]);
            expect(store.getState()).not.toHaveProperty(`editedObjects.1.${attr}`, value);

            // Update a prop of the object
            storeManager.editedObjects.update(1, { [attr]: value });
            expect(store.getState()).toHaveProperty(`editedObjects.1.${attr}`, value);

            // Check if update persists after object is cleaned
            store.dispatch(clearUnchangedEditedObjects(1));
            expect(store.getState()).toHaveProperty(`editedObjects.1.${attr}`, value);
        }
    });


    test("Tag changes are persisted", () => {
        // Added tags
        for (let tag of [4, "tag name"]) {
            // Add an existing object
            const storeManager = createTestStore(), { store } = storeManager;
            storeManager.objects.add(1, { tagIDs: [1, 2, 3] });
            storeManager.tags.add({ tag_id: 4 });   // tags store is used when adding a numeric tag
            storeManager.editedObjects.reset([1]);
            expect(store.getState()).toHaveProperty(`editedObjects.1.addedTags`, []);

            // Add a tag
            storeManager.editedObjects.updateTags(1, { added: [tag] });
            expect(store.getState()).toHaveProperty(`editedObjects.1.addedTags`, [tag]);

            // Check if update persists after object is cleaned
            store.dispatch(clearUnchangedEditedObjects(1));
            expect(store.getState()).toHaveProperty("editedObjects.1.addedTags", [tag]);
        }

        // Removed tags
        // Add an existing object
        const storeManager = createTestStore(), { store } = storeManager;
        storeManager.objects.add(1, { tagIDs: [1, 2, 3] });
        storeManager.editedObjects.reset([1]);
        expect(store.getState()).toHaveProperty(`editedObjects.1.removedTagIDs`, []);

        // Add a tag
        storeManager.editedObjects.updateTags(1, { removed: [1] });
        expect(store.getState()).toHaveProperty(`editedObjects.1.removedTagIDs`, [1]);

        // Check if update persists after object is cleaned
        store.dispatch(clearUnchangedEditedObjects(1));
        expect(store.getState()).toHaveProperty("editedObjects.1.removedTagIDs", [1]);
    });
});


describe("Data", () => {
    test("Link changes are persisted", () => {
        for (let [attr, value] of [
            ["link", "updated link value"],
            ["show_description_as_link", true],
        ]) {
            // Add an existing object, update its link attribute & check if update persists
            const storeManager = createTestStore(), { store } = storeManager;
            storeManager.objects.add(1);
            storeManager.editedObjects.reset([1]);
            expect(store.getState()).not.toHaveProperty(`editedObjects.1.link.${attr}`, value);

            storeManager.editedObjects.update(1, { link: { [attr]: value }});
            expect(store.getState()).toHaveProperty(`editedObjects.1.link.${attr}`, value);

            store.dispatch(clearUnchangedEditedObjects(1));
            expect(store.getState()).toHaveProperty(`editedObjects.1.link.${attr}`, value);
        }
    });


    test("Markdown changes are persisted", () => {
        for (let [attr, value] of [
            ["raw_text", "raw text"],
            // ["parsed", "parsed text"],   // parsed text is ignored
        ]) {
            // Add an existing object, update its markdown attribute & check if update persists
            const storeManager = createTestStore(), { store } = storeManager;
            storeManager.objects.add(1, { attributes: { object_type: "markdown" }});
            storeManager.editedObjects.reset([1]);
            expect(store.getState()).not.toHaveProperty(`editedObjects.1.markdown.${attr}`, value);

            storeManager.editedObjects.update(1, { markdown: { [attr]: value }});
            expect(store.getState()).toHaveProperty(`editedObjects.1.markdown.${attr}`, value);

            store.dispatch(clearUnchangedEditedObjects(1));
            expect(store.getState()).toHaveProperty(`editedObjects.1.markdown.${attr}`, value);
        }
    });


    test("To-do list (top-level attributes)", () => {
        for (let [attr, value] of [
            ["sort_type", "state"],
        ]) {
            // Add an existing object, update its to-do list attribute & check if update persists
            const storeManager = createTestStore(), { store } = storeManager;
            storeManager.objects.add(1, { attributes: { object_type: "to_do_list" }});
            storeManager.editedObjects.reset([1]);
            expect(store.getState()).not.toHaveProperty(`editedObjects.1.toDoList.${attr}`, value);

            storeManager.editedObjects.update(1, { toDoList: { [attr]: value }});
            expect(store.getState()).toHaveProperty(`editedObjects.1.toDoList.${attr}`, value);

            store.dispatch(clearUnchangedEditedObjects(1));
            expect(store.getState()).toHaveProperty(`editedObjects.1.toDoList.${attr}`, value);
        }
    });


    test("To-do list (add a new item)", () => {
        // Add an existing object
        const storeManager = createTestStore(), { store } = storeManager;
        storeManager.objects.add(1, { 
            attributes: { object_type: "to_do_list" },
            data: { items: [{ item_number: 0 }] }
        });
        storeManager.editedObjects.reset([1]);
        expect(store.getState()).not.toHaveProperty("editedObjects.1.toDoList.items.1");

        // Add a to-do list item
        storeManager.editedObjects.updateEditedToDoList(1, { command: "addItem", position: 1 });
        expect(store.getState()).toHaveProperty("editedObjects.1.toDoList.items.1");

        // Check if update persists
        store.dispatch(clearUnchangedEditedObjects(1));
        expect(store.getState()).toHaveProperty("editedObjects.1.toDoList.items.1");
    });


    test("To-do list (remove an item)", () => {
        // Add an existing object
        const storeManager = createTestStore(), { store } = storeManager;
        storeManager.objects.add(1, { 
            attributes: { object_type: "to_do_list" },
            data: { items: [{ item_number: 0 }, { item_number: 1 }] }
        });
        storeManager.editedObjects.reset([1]);
        expect(store.getState()).toHaveProperty("editedObjects.1.toDoList.items.1");

        // Remove a to-do list item
        storeManager.editedObjects.updateEditedToDoList(1, { command: "deleteItem", itemID: 1 });
        expect(store.getState()).not.toHaveProperty("editedObjects.1.toDoList.items.1");

        // Check if update persists
        store.dispatch(clearUnchangedEditedObjects(1));
        expect(store.getState()).not.toHaveProperty("editedObjects.1.toDoList.items.1");
    });


    test("To-do list (modify an item)", () => {
        for (let [attr, value] of [
            // ["item_number", 5],
            ["item_state", "completed"],
            ["item_text", "updated item text"],
            ["commentary", "updated item commentary"],
            ["indent", 5],
            ["is_expanded", false]
        ]) {
            // Add an existing object
            const storeManager = createTestStore(), { store } = storeManager;
            storeManager.objects.add(1, { 
                attributes: { object_type: "to_do_list" },
                data: { items: [{ item_number: 0, item_state: "active", item_text: "", commentary: "", indent: 0, is_expanded: true }]}
            });
            storeManager.editedObjects.reset([1]);
            expect(store.getState()).not.toHaveProperty(`editedObjects.1.toDoList.items.0.${attr}`, value);

            // Update a prop
            storeManager.editedObjects.updateEditedToDoList(1, { command: "updateItem", itemID: 0, [attr]: value });
            expect(store.getState()).toHaveProperty(`editedObjects.1.toDoList.items.0.${attr}`, value);

            // Check if update persists
            store.dispatch(clearUnchangedEditedObjects(1));
            expect(store.getState()).toHaveProperty(`editedObjects.1.toDoList.items.0.${attr}`, value);
        }
    });


    test("Composite (top-level attributes)", () => {
        for (let [attr, value] of [
            ["display_mode", "chapters"],
            ["numerate_chapters", true],
        ]) {
            // Add an existing object
            const storeManager = createTestStore(), { store } = storeManager;
            storeManager.objects.add(1, { attributes: { object_type: "composite" }});
            storeManager.editedObjects.reset([1]);
            expect(store.getState()).not.toHaveProperty(`editedObjects.1.composite.${attr}`, value);

            // Update its composite attribute
            storeManager.editedObjects.update(1, { composite: { [attr]: value }});
            expect(store.getState()).toHaveProperty(`editedObjects.1.composite.${attr}`, value);

            // Check if update persists
            store.dispatch(clearUnchangedEditedObjects(1));
            expect(store.getState()).toHaveProperty(`editedObjects.1.composite.${attr}`, value);
        }
    });


    test("Composite (add a new subobject)", () => {
        // Add an existing object
        const storeManager = createTestStore(), { store } = storeManager;
        storeManager.objects.add(1, { attributes: { object_type: "composite" }});
        storeManager.editedObjects.reset([1]);
        expect(store.getState()).not.toHaveProperty("editedObjects.1.composite.subobjects", "-1");

        // Add a new subobject
        storeManager.editedObjects.updateEditedComposite(1, { command: "addNewSubobject", column: 0, row: 10 });
        expect(store.getState()).toHaveProperty("editedObjects.-1");
        expect(store.getState()).toHaveProperty("editedObjects.1.composite.subobjects.-1");

        // Check if update persists
        store.dispatch(clearUnchangedEditedObjects(1));
        // expect(store.getState()).toHaveProperty("editedObjects.-1");     // checked in a separate test
        expect(store.getState()).toHaveProperty("editedObjects.1.composite.subobjects.-1");
    });


    test("Composite (add an existing subobject)", () => {
        // Add an existing object
        const storeManager = createTestStore(), { store } = storeManager;
        storeManager.objects.add(1, { attributes: { object_type: "composite" }});
        storeManager.editedObjects.reset([1]);
        expect(store.getState()).not.toHaveProperty("editedObjects.1.composite.subobjects", 2);
        
        // Add an existing subobject to it
        storeManager.editedObjects.updateEditedComposite(1, { command: "addExistingSubobject", subobjectID: 2, column: 0, row: 10 });
        // expect(store.getState()).toHaveProperty("editedObjects.2");      // edited object is loaded separately (when its card renders)
        expect(store.getState()).toHaveProperty("editedObjects.1.composite.subobjects.2");

        // Check if update persists
        store.dispatch(clearUnchangedEditedObjects(1));
        // expect(store.getState()).not.toHaveProperty("editedObjects.2");     // checked in a separate test
        expect(store.getState()).toHaveProperty("editedObjects.1.composite.subobjects.2");
    });


    test("Composite (subobject props)", () => {
        for (let [attr, value, expectedToPersist] of [
            // backend + frontend attributes
            ["column", 5, true],
            ["row", 5, true],
            ["is_expanded", true, false],
            ["selected_tab", 1, false],
            ["show_description_composite", "no", true],
            ["show_description_as_link_composite", "no", true],
            
            // frontend-only attributes
            ["fetchError", "error", false],
            ["deleteMode", SubobjectDeleteMode.full, true]
        ]) {
            // Add an existing object
            const storeManager = createTestStore(), { store } = storeManager;
            storeManager.objects.add(1, { 
                attributes: { object_type: "composite" },
                data: { subobjects: [{ subobject_id: 2, column: 0, row: 0, is_expanded: false, selected_tab: 0,
                        show_description_composite: "yes", show_description_as_link_composite: "yes" }]}
            });
            storeManager.editedObjects.reset([1]);
            expect(store.getState()).not.toHaveProperty(`editedObjects.1.composite.subobjects.2.${attr}`, value);

            // Modify a subobejct attribute
            storeManager.editedObjects.updateEditedComposite(1, { command: "updateSubobject", subobjectID: 2, [attr]: value });
            expect(store.getState()).toHaveProperty(`editedObjects.1.composite.subobjects.2.${attr}`, value);

            // Check if update persists (or not)
            store.dispatch(clearUnchangedEditedObjects(1));
            if (expectedToPersist) expect(store.getState()).toHaveProperty(`editedObjects.1.composite.subobjects.2.${attr}`, value);
            else expect(store.getState()).not.toHaveProperty("editedObjects.1");
        }
    });
});


describe("Composite subobjects", () => {
    test("New modified/unmodified subobjects are persisted", () => {
        // Add a composite object with 2 new subobjects, update one of them
        const storeManager = createTestStore(), { store } = storeManager;

        storeManager.objects.add(1, {
            attributes: { object_type: "composite" },
            data: { subobjects: [{ subobject_id: 2, column: 0, row: 0 }]}
        })
        storeManager.editedObjects.reset([1]);

        storeManager.editedObjects.updateEditedComposite(1, { command: "addNewSubobject", column: 0, row: 1 });
        storeManager.editedObjects.updateEditedComposite(1, { command: "addNewSubobject", column: 0, row: 2 });
        for (let i of [-1, -2]) {
            expect(store.getState()).toHaveProperty(`editedObjects.${i}`);
            expect(store.getState()).toHaveProperty(`editedObjects.1.composite.subobjects.${i}`);
        }
        
        const subobjectName = "modified subobject name";
        storeManager.editedObjects.update(-2, { object_name: subobjectName });
        expect(store.getState()).toHaveProperty("editedObjects.-2.object_name", subobjectName);

        // Check if object & both subobjects persist the clear
        store.dispatch(clearUnchangedEditedObjects(0));
        for (let i of [1, -1, -2])
            expect(store.getState()).toHaveProperty(`editedObjects.${i}`);
    });


    test("New subobjects of a nested composite object are persisted", () => {
        // Add an existing composite with 2 new subobjects
        const storeManager = createTestStore(), { store } = storeManager;
        storeManager.objects.add(100, {
            attributes: { object_type: "composite" }, data: {subobjects: []}
        });
        storeManager.editedObjects.reset([100]);
        expect(store.getState()).toHaveProperty("editedObjects.100");

        storeManager.editedObjects.updateEditedComposite(100, { command: "addNewSubobject", column: 0, row: 0 });
        storeManager.editedObjects.updateEditedComposite(100, { command: "addNewSubobject", column: 0, row: 1 });
        for (let i of [-1, -2]) {
            expect(store.getState()).toHaveProperty(`editedObjects.${i}`);
            expect(store.getState()).toHaveProperty(`editedObjects.100.composite.subobjects.${i}`);
        }

        // Update one of new subobjects of existing composite
        const subobjectName = "modified subobject name";
        storeManager.editedObjects.update(-2, { object_name: subobjectName });
        expect(store.getState()).toHaveProperty("editedObjects.-2.object_name", subobjectName);

        // Add a second existing composite object & add the first one as its subobject
        storeManager.objects.add(1, {
            attributes: { object_type: "composite" },
            data: { subobjects: [{ subobject_id: 2, column: 0, row: 0 }]}
        })
        storeManager.editedObjects.reset([1]);
        storeManager.editedObjects.updateEditedComposite(1, { command: "addExistingSubobject", subobjectID: 100, column: 0, row: 1 });
        expect(store.getState()).toHaveProperty("editedObjects.1.composite.subobjects.100");

        // Check if new object, its composite subobject & new subobject of the latter persist the clear
        store.dispatch(clearUnchangedEditedObjects(1));
        for (let i of [1, 100, -1, -2])
            expect(store.getState()).toHaveProperty(`editedObjects.${i}`);
    });


    test("Existing subobjects of a composite object", () => {
        // Add an existing composite and add 2 existing subobjects to it
        const storeManager = createTestStore(), { store } = storeManager;
        storeManager.objects.add(100, {
            attributes: { object_type: "composite" }, data: { subobjects: []}
        });
        for (let i of [101, 102]) storeManager.objects.add(i);
        storeManager.editedObjects.reset([100, 101, 102]);
        for (let i of [100, 101, 102]) expect(store.getState()).toHaveProperty(`editedObjects.${i}`);

        storeManager.editedObjects.updateEditedComposite(100, { command: "addExistingSubobject", subobjectID: 101, column: 0, row: 0 });
        storeManager.editedObjects.updateEditedComposite(100, { command: "addExistingSubobject", subobjectID: 102, column: 0, row: 1 });
        for (let i of [101, 102]) expect(store.getState()).toHaveProperty(`editedObjects.${i}`);

        // Update one of subobjects
        const subobjectName = "modified subobject name";
        storeManager.editedObjects.update(102, { object_name: subobjectName });
        expect(store.getState()).toHaveProperty("editedObjects.102.object_name", subobjectName);

        // Check if composite object & modified subobject of the latter persist the clear
        store.dispatch(clearUnchangedEditedObjects(100));
        for (let i of [100, 102]) expect(store.getState()).toHaveProperty(`editedObjects.${i}`);

        // Check if unmodified subobject was removed
        for (let i of [101]) expect(store.getState()).not.toHaveProperty(`editedObjects.${i}`);
    });


    test("Existing subobjects of a nested composite object", () => {
        // Add an existing composite with 2 existing subobjects
        const storeManager = createTestStore(), { store } = storeManager;
        storeManager.objects.add(100, {
            attributes: { object_type: "composite" },
            data: {subobjects: [{ subobject_id: 101, row: 0 }, { subobject_id: 102, row: 1 }]}
        });
        for (let i of [101, 102]) storeManager.objects.add(i);
        storeManager.editedObjects.reset([100, 101, 102]);
        for (let i of [100, 101, 102]) expect(store.getState()).toHaveProperty(`editedObjects.${i}`);

        // Update one of subobjects of existing composite
        const subobjectName = "modified subobject name";
        storeManager.editedObjects.update(102, { object_name: subobjectName });
        expect(store.getState()).toHaveProperty("editedObjects.102.object_name", subobjectName);

        // Add a second existing composite object & add the first one as its subobject
        storeManager.objects.add(1, {
            attributes: { object_type: "composite" }, data: { subobjects: []}
        });
        storeManager.editedObjects.reset([1]);
        // storeManager.editedObjects.update(0, { object_type: "composite" });      // don't update type, so that edge case for non-composite root is checked
        storeManager.editedObjects.updateEditedComposite(1, { command: "addExistingSubobject", subobjectID: 100, column: 0, row: 0 });
        expect(store.getState()).toHaveProperty("editedObjects.1.composite.subobjects.100");

        // Check if the second composite object & its modified sub-subobject persist the clear
        store.dispatch(clearUnchangedEditedObjects(1));
        for (let i of [1, 102]) expect(store.getState()).toHaveProperty(`editedObjects.${i}`);

        // Check if first composite & its unmodified subobject were removed
        for (let i of [100, 101]) expect(store.getState()).not.toHaveProperty(`editedObjects.${i}`);
    });
});


describe("Exclusions from removal", () => {
    test("Unmodified subobject persists, if it's excluded", () => {
        // Add an existing composite with 3 existing subobjects
        const storeManager = createTestStore(), { store } = storeManager;
        storeManager.objects.add(100, {
            attributes: { object_type: "composite" }, data: {subobjects: []}
        });
        for (let i of [101, 102, 103]) storeManager.objects.add(i);
        storeManager.editedObjects.reset([100, 101, 102, 103]);
        for (let i of [100, 101, 102, 103]) expect(store.getState()).toHaveProperty(`editedObjects.${i}`);

        for (let i of [0, 1, 2]) {
            const subobjectID = 101 + i;
            storeManager.editedObjects.updateEditedComposite(100, { command: "addExistingSubobject", subobjectID, column: 0, row: i });
            expect(store.getState()).toHaveProperty(`editedObjects.${subobjectID}`);
        }

        // Modify one subobject
        const subobjectName = "modified subobject name";
        storeManager.editedObjects.update(102, { object_name: subobjectName });
        expect(store.getState()).toHaveProperty("editedObjects.102.object_name", subobjectName);

        // Check if composite, its modified & unmodified excluded persist the clear
        store.dispatch(clearUnchangedEditedObjects(100, 103));
        for (let i of [100, 102, 103]) expect(store.getState()).toHaveProperty(`editedObjects.${i}`);

        // Check if unmodified unexcluded subobject is removed
        for (let i of [101]) expect(store.getState()).not.toHaveProperty(`editedObjects.${i}`);
    });


    test("Unmodified subobject persists, if its other parent is excluded", () => {
        // Add an existing composite with an existing subobject
        const storeManager = createTestStore(), { store } = storeManager;
        storeManager.objects.add(100, {
            attributes: { object_type: "composite" }, data: { subobjects: [{ subobject_id: 103 }]}
        });
        storeManager.editedObjects.reset([100]);

        // Add a second existing composite with 3 existing subobjects
        storeManager.objects.add(1, {
            attributes: { object_type: "composite" }, 
            data: { subobjects: [{ subobject_id: 101, row: 0 }, { subobject_id: 102, row: 1 }, { subobject_id: 103, row: 2 }]}
        });
        for (let i of [101, 102, 103]) storeManager.objects.add(i);
        storeManager.editedObjects.reset([1, 101, 102, 103]);
        for (let i of [1, 101, 102, 103]) expect(store.getState()).toHaveProperty(`editedObjects.${i}`);

        // Modify one subobject
        const subobjectName = "modified subobject name";
        storeManager.editedObjects.update(102, { object_name: subobjectName });
        expect(store.getState()).toHaveProperty("editedObjects.102.object_name", subobjectName);

        // Check if modified subobject of second composite, first composite and its subobject
        // persist the clear
        store.dispatch(clearUnchangedEditedObjects(1, 100));
        for (let i of [102, 100, 103]) expect(store.getState()).toHaveProperty(`editedObjects.${i}`);

        // Check if second composite & unmodified unexcluded subobject of second composite are removed
        for (let i of [101]) expect(store.getState()).not.toHaveProperty(`editedObjects.${i}`);
    });
});
