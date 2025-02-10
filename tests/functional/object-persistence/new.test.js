import { createTestStore } from "../../_util/create-test-store";
import { resetTestConfig } from "../../_mocks/config";

import { clearUnchangedEditedObjects } from "../../../src/reducers/data/edited-objects";


/*
    Tests for new object's persistence after /objects/edit/... page leave.
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
    test("Unchanged new object is removed", () => {
        const storeManager = createTestStore(), { store } = storeManager;
        storeManager.editedObjects.reset([0]);
        expect(store.getState()).toHaveProperty("editedObjects.0");

        store.dispatch(clearUnchangedEditedObjects(0));
        expect(store.getState()).not.toHaveProperty("editedObjects.0");
    });


    test("Attribute changes are persisted", () => {
        for (let [attr, value] of [
            // object_id: -1,
            ["object_type", "markdown"],
            ["object_name", "new name"],
            ["object_description", "new description"],
            ["created_at", (new Date()).toISOString()],
            ["modified_at", (new Date()).toISOString()],
            ["is_published", true],
            ["display_in_feed", false],
            ["feed_timestamp", (new Date()).toISOString()],
            ["show_description", false],
            ["owner_id", 999],
        ]) {
            // Add a default new object, update its prop & check if update persists after object is cleaned
            const storeManager = createTestStore(), { store } = storeManager;
            storeManager.editedObjects.reset([0]);
            expect(store.getState()).not.toHaveProperty(`editedObjects.0.${attr}`, value);
            storeManager.editedObjects.update(0, { [attr]: value });
            expect(store.getState()).toHaveProperty(`editedObjects.0.${attr}`, value);

            store.dispatch(clearUnchangedEditedObjects(0));
            expect(store.getState()).toHaveProperty(`editedObjects.0.${attr}`, value);
        }
    });


    test("Tag changes are persisted", () => {
        for (let tag of [1, "tag name"]) {
            // Add a default new object, add a tag & check if update persists after object is cleaned
            const storeManager = createTestStore(), { store } = storeManager;
            storeManager.tags.add({ tag_id: 1 });   // tags store is used when adding a numeric tag
            storeManager.editedObjects.reset([0]);
            expect(store.getState()).toHaveProperty(`editedObjects.0.addedTags`, []);
            storeManager.editedObjects.updateTags(0, { added: [tag] });
            expect(store.getState()).toHaveProperty(`editedObjects.0.addedTags`, [tag]);

            store.dispatch(clearUnchangedEditedObjects(0));
            expect(store.getState()).toHaveProperty("editedObjects.0.addedTags", [tag]);
        }
    });
});


describe("Data", () => {
    test("Link changes are persisted", () => {
        for (let [attr, value] of [
            ["link", "new link value"],
            ["show_description_as_link", true],
        ]) {
            // Add a default object, update its link attribute & check if update persists
            const storeManager = createTestStore(), { store } = storeManager;
            storeManager.editedObjects.reset([0]);
            expect(store.getState()).not.toHaveProperty(`editedObjects.0.link.${attr}`, value);

            storeManager.editedObjects.update(0, { link: { [attr]: value }});
            expect(store.getState()).toHaveProperty(`editedObjects.0.link.${attr}`, value);

            store.dispatch(clearUnchangedEditedObjects(0));
            expect(store.getState()).toHaveProperty(`editedObjects.0.link.${attr}`, value);
        }
    });


    test("Markdown changes", () => {
        for (let [attr, value, expectedToPersist] of [
            ["raw_text", "raw text", true],
            ["parsed", "parsed text", false],
        ]) {
            // Add a default object, update its markdown attribute & check if update persists (or not)
            const storeManager = createTestStore(), { store } = storeManager;
            storeManager.editedObjects.reset([0]);
            expect(store.getState()).not.toHaveProperty(`editedObjects.0.markdown.${attr}`, value);

            storeManager.editedObjects.update(0, { markdown: { [attr]: value }});
            expect(store.getState()).toHaveProperty(`editedObjects.0.markdown.${attr}`, value);

            store.dispatch(clearUnchangedEditedObjects(0));
            if (expectedToPersist) expect(store.getState()).toHaveProperty(`editedObjects.0.markdown.${attr}`, value);
            else expect(store.getState()).not.toHaveProperty("editedObjects.0");
        }
    });


    test("To-do list (top-level attributes)", () => {
        for (let [attr, value] of [
            ["sort_type", "state"],
        ]) {
            // Add a default object, update its to-do list attribute & check if update persists
            const storeManager = createTestStore(), { store } = storeManager;
            storeManager.editedObjects.reset([0]);
            expect(store.getState()).not.toHaveProperty(`editedObjects.0.toDoList.${attr}`, value);

            storeManager.editedObjects.update(0, { toDoList: { [attr]: value }});
            expect(store.getState()).toHaveProperty(`editedObjects.0.toDoList.${attr}`, value);

            store.dispatch(clearUnchangedEditedObjects(0));
            expect(store.getState()).toHaveProperty(`editedObjects.0.toDoList.${attr}`, value);
        }
    });


    test("To-do list (add a new item)", () => {
        // Add a default object, add a to-do list item & check if update persists
        const storeManager = createTestStore(), { store } = storeManager;
        storeManager.editedObjects.reset([0]);
        expect(store.getState()).not.toHaveProperty("editedObjects.0.toDoList.items.0");

        storeManager.editedObjects.updateEditedToDoList(0, { command: "addItem", position: 0 });
        expect(store.getState()).toHaveProperty("editedObjects.0.toDoList.items.0");

        store.dispatch(clearUnchangedEditedObjects(0));
        expect(store.getState()).toHaveProperty("editedObjects.0.toDoList.items.0");
    });


    test("Composite (top-level attributes)", () => {
        for (let [attr, value] of [
            ["display_mode", "chapters"],
            ["numerate_chapters", true],
        ]) {
            // Add a default object, update its composite attribute & check if update persists
            const storeManager = createTestStore(), { store } = storeManager;
            storeManager.editedObjects.reset([0]);
            expect(store.getState()).not.toHaveProperty(`editedObjects.0.composite.${attr}`, value);

            storeManager.editedObjects.update(0, { composite: { [attr]: value }});
            expect(store.getState()).toHaveProperty(`editedObjects.0.composite.${attr}`, value);

            store.dispatch(clearUnchangedEditedObjects(0));
            expect(store.getState()).toHaveProperty(`editedObjects.0.composite.${attr}`, value);
        }
    });


    test("Composite (add a new subobject)", () => {
        // Add a default object, add a new subobject & check if update persists
        const storeManager = createTestStore(), { store } = storeManager;
        storeManager.editedObjects.reset([0]);
        expect(store.getState()).not.toHaveProperty("editedObjects.0.composite.subobjects", "-1");

        storeManager.editedObjects.updateEditedComposite(0, { command: "addNewSubobject", column: 0, row: 0 });
        expect(store.getState()).toHaveProperty("editedObjects.-1");
        expect(store.getState()).toHaveProperty("editedObjects.0.composite.subobjects.-1");

        store.dispatch(clearUnchangedEditedObjects(0));
        // expect(store.getState()).toHaveProperty("editedObjects.-1");     // checked in a separate test
        expect(store.getState()).toHaveProperty("editedObjects.0.composite.subobjects.-1");
    });


    test("Composite (add an existing subobject)", () => {
        // Add a default object, add a to-do list item & check if update persists
        const storeManager = createTestStore(), { store } = storeManager;
        storeManager.editedObjects.reset([0]);
        expect(store.getState()).not.toHaveProperty("editedObjects.0.composite.subobjects", 1);

        storeManager.editedObjects.updateEditedComposite(0, { command: "addExistingSubobject", subobjectID: 1, column: 0, row: 0 });
        // expect(store.getState()).toHaveProperty("editedObjects.1");      // edited object is loaded separately (when its card renders)
        expect(store.getState()).toHaveProperty("editedObjects.0.composite.subobjects.1");

        store.dispatch(clearUnchangedEditedObjects(0));
        // expect(store.getState()).not.toHaveProperty("editedObjects.1");     // checked in a separate test
        expect(store.getState()).toHaveProperty("editedObjects.0.composite.subobjects.1");
    });
});


describe("Composite subobjects", () => {
    test("New modified/unmodified subobjects are persisted", () => {
        // Add a composite object with 2 new subobjects, update one of them
        const storeManager = createTestStore(), { store } = storeManager;

        storeManager.editedObjects.reset([0]);
        // storeManager.editedObjects.update(0, { object_type: "composite" });      // don't update type, so that edge case for non-composite root is checked

        storeManager.editedObjects.updateEditedComposite(0, { command: "addNewSubobject", column: 0, row: 0 });
        storeManager.editedObjects.updateEditedComposite(0, { command: "addNewSubobject", column: 0, row: 1 });
        for (let i of [-1, -2]) {
            expect(store.getState()).toHaveProperty(`editedObjects.${i}`);
            expect(store.getState()).toHaveProperty(`editedObjects.0.composite.subobjects.${i}`);
        }
        
        const subobjectName = "modified subobject name";
        storeManager.editedObjects.update(-2, { object_name: subobjectName });
        expect(store.getState()).toHaveProperty("editedObjects.-2.object_name", subobjectName);

        // Check if object & both subobjects persist the clear
        store.dispatch(clearUnchangedEditedObjects(0));
        for (let i of [0, -1, -2])
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

        // Add a new composite object & add existing composite as its subobject
        storeManager.editedObjects.reset([0]);
        // storeManager.editedObjects.update(0, { object_type: "composite" });      // don't update type, so that edge case for non-composite root is checked
        storeManager.editedObjects.updateEditedComposite(0, { command: "addExistingSubobject", subobjectID: 100, column: 0, row: 0 });
        expect(store.getState()).toHaveProperty("editedObjects.0.composite.subobjects.100");

        // Check if new object, its composite subobject & new subobject of the latter persist the clear
        store.dispatch(clearUnchangedEditedObjects(0));
        for (let i of [0, 100, -1, -2])
            expect(store.getState()).toHaveProperty(`editedObjects.${i}`);
    });


    test("Existing subobjects of a composite object", () => {
        // Add a new composite with 2 existing subobjects
        const storeManager = createTestStore(), { store } = storeManager;
        for (let i of [101, 102]) storeManager.objects.add(i);
        storeManager.editedObjects.reset([0, 101, 102]);
        for (let i of [0, 101, 102]) expect(store.getState()).toHaveProperty(`editedObjects.${i}`);

        storeManager.editedObjects.updateEditedComposite(0, { command: "addExistingSubobject", subobjectID: 101, column: 0, row: 0 });
        storeManager.editedObjects.updateEditedComposite(0, { command: "addExistingSubobject", subobjectID: 102, column: 0, row: 1 });
        for (let i of [101, 102]) expect(store.getState()).toHaveProperty(`editedObjects.${i}`);

        // Update one of subobjects of existing composite
        const subobjectName = "modified subobject name";
        storeManager.editedObjects.update(102, { object_name: subobjectName });
        expect(store.getState()).toHaveProperty("editedObjects.102.object_name", subobjectName);

        // Check if new object & modified subobject of the latter persist the clear
        store.dispatch(clearUnchangedEditedObjects(0));
        for (let i of [0, 102]) expect(store.getState()).toHaveProperty(`editedObjects.${i}`);

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

        // Add a new composite object & add existing composite as its subobject
        storeManager.editedObjects.reset([0]);
        // storeManager.editedObjects.update(0, { object_type: "composite" });      // don't update type, so that edge case for non-composite root is checked
        storeManager.editedObjects.updateEditedComposite(0, { command: "addExistingSubobject", subobjectID: 100, column: 0, row: 0 });
        expect(store.getState()).toHaveProperty("editedObjects.0.composite.subobjects.100");

        // Check if new object & its modified sub-subobject persist the clear
        store.dispatch(clearUnchangedEditedObjects(0));
        for (let i of [0, 102]) expect(store.getState()).toHaveProperty(`editedObjects.${i}`);

        // Check if existing composite & its unmodified subobject were removed
        for (let i of [100, 101]) expect(store.getState()).not.toHaveProperty(`editedObjects.${i}`);
    });
});


describe("Exclusions from removal", () => {
    test("Unmodified subobject persists, if it's excluded", () => {
        // Add a new composite with 3 existing subobjects
        const storeManager = createTestStore(), { store } = storeManager;
        for (let i of [101, 102, 103]) storeManager.objects.add(i);
        storeManager.editedObjects.reset([0, 101, 102, 103]);
        for (let i of [0, 101, 102, 103]) expect(store.getState()).toHaveProperty(`editedObjects.${i}`);

        for (let i of [0, 1, 2]) {
            const subobjectID = 101 + i;
            storeManager.editedObjects.updateEditedComposite(0, { command: "addExistingSubobject", subobjectID, column: 0, row: i });
            expect(store.getState()).toHaveProperty(`editedObjects.${subobjectID}`);
        }

        // Modify one subobject
        const subobjectName = "modified subobject name";
        storeManager.editedObjects.update(102, { object_name: subobjectName });
        expect(store.getState()).toHaveProperty("editedObjects.102.object_name", subobjectName);

        // Check if composite, its modified & unmodified excluded persist the clear
        store.dispatch(clearUnchangedEditedObjects(0, 103));
        for (let i of [0, 102, 103]) expect(store.getState()).toHaveProperty(`editedObjects.${i}`);

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

        // Add a new composite with 3 existing subobjects
        for (let i of [101, 102, 103]) storeManager.objects.add(i);
        storeManager.editedObjects.reset([0, 101, 102, 103]);
        for (let i of [0, 101, 102, 103]) expect(store.getState()).toHaveProperty(`editedObjects.${i}`);

        for (let i of [0, 1, 2]) {
            const subobjectID = 101 + i;
            storeManager.editedObjects.updateEditedComposite(0, { command: "addExistingSubobject", subobjectID, column: 0, row: i });
            expect(store.getState()).toHaveProperty(`editedObjects.${subobjectID}`);
        }

        // Modify one subobject
        const subobjectName = "modified subobject name";
        storeManager.editedObjects.update(102, { object_name: subobjectName });
        expect(store.getState()).toHaveProperty("editedObjects.102.object_name", subobjectName);

        // Check if new composite, its modified subobject, existing excluded composite and its subobject
        // persist the clear
        store.dispatch(clearUnchangedEditedObjects(0, 100));
        for (let i of [0, 102, 100, 103]) expect(store.getState()).toHaveProperty(`editedObjects.${i}`);

        // Check if unmodified unexcluded subobject is removed
        for (let i of [101]) expect(store.getState()).not.toHaveProperty(`editedObjects.${i}`);
    });
});
