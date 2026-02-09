import React from "react";

import { fireEvent } from "@testing-library/react";
import { getByText, getByTitle, waitFor, queryByText, queryAllByText, getByPlaceholderText } from "@testing-library/dom";

import { waitForFetch, checkObjectsDisplay, selectObjectTypeInFilter, deselectObjectTypeInFilter, searchTagInFilter, checkIfTagIsAddedToFilter } from "../../../_util/ui-objects-list";
import { getSideMenuDialogControls, getSideMenuItem } from "../../../_util/ui-common";
import { getInlineItem } from "../../../_util/ui-inline";
import { resetTestConfig } from "../../../_mocks/config";
import { renderWithWrappers } from "../../../_util/render";
import { getCurrentObject } from "../../../_util/ui-objects-edit";
import { createTestStore } from "../../../_util/create-test-store";
import { getStoreWithModifiedCompositeObject } from "../../../_mocks/data-composite";

import { App } from "../../../../src/components/app";
import { setObjectsListPaginationInfo } from "../../../../src/reducers/ui/objects-list";


/*
    /objects/list page tests.
*/
beforeEach(() => {
    // isolate fetch mock to avoid tests state collision because of cached data in fetch
    jest.isolateModules(() => {
        const { mockFetch, setFetchFail } = require("../../../_mocks/mock-fetch");
        const { paginationGetComputedStyle } = require("../../../_mocks/mock-get-computed-style");
        
        // Set test app configuration
        resetTestConfig();

        // reset fetch mocks
        jest.resetAllMocks();
        global.fetch = jest.fn(mockFetch);
        global.setFetchFail = jest.fn(setFetchFail);
        global.getComputedStyle = jest.fn(paginationGetComputedStyle);
    });
});



describe("Page load and pagination", () => {
    test("Load page with a fetch error", async () => {
        setFetchFail(true);
    
        // Route component is required for matching (getting :id part of the URL in the Object component)
        let { container } = renderWithWrappers(<App />, {
            route: "/objects/list"
        });
    
        // Check if error message if displayed
        await waitFor(() => getByText(container, "Failed to fetch data."));
    
        // Check if buttons are not enabled
        let editObjectButton = getSideMenuItem(container, "Edit Object");
        let deleteButton = getSideMenuItem(container, "Delete");
        expect(editObjectButton.classList.contains("disabled")).toBeTruthy(); // Semantic UI always adds onClick event to div elements, even if they are disabled (which does nothing in this case)
        // expect(editObjectButton.onclick).toBeNull();
        expect(deleteButton.classList.contains("disabled")).toBeTruthy(); // Semantic UI always adds onClick event to div elements, even if they are disabled (which does nothing in this case)
        // expect(deleteButton.onclick).toBeNull();
    
        // Check if pagination is not rendered
        expect(container.querySelector(".pagination")).toBeNull();
    });
    
    
    test("Load a page without pagination", async () => {
        let { store } = createTestStore();
        store.dispatch(setObjectsListPaginationInfo({itemsPerPage: 100}))
        
        // Route component is required for matching (getting :id part of the URL in the Object component)
        let { container } = renderWithWrappers(<App />, {
            route: "/objects/list", store
        });
    
        // Wait for the objects to be loaded
        await waitFor(() => getByText(container, "object #1"));
    
        // Check if pagination is not rendered
        expect(container.querySelector(".pagination")).toBeNull();
    });
    
    
    test("Load page 1 of 5 and click on page 5", async () => {
        let { store } = createTestStore();
        store.dispatch(setObjectsListPaginationInfo({itemsPerPage: 20}))
        
        // Route component is required for matching (getting :id part of the URL in the Object component)
        let { container } = renderWithWrappers(<App />, {
            route: "/objects/list", store
        });
    
        // Check if no pagination is rendered during fetch
        await waitFor(() => expect(
            store.getState().objectsListUI.fetch.isFetching === true
            && container.querySelector(".pagination") === null
        ).toBeTruthy());
    
        // Check if objects 1 to 20 are displayed on the page after fetch is complete
        await waitFor(() => getByText(container, "object #1"));
        getByText(container, "object #20");
        expect(queryByText(container, "object #21")).toBeNull();
    
        // Check if pagination is correctly rendered
        let paginationDiv = container.querySelector(".pagination");
        expect(paginationDiv).toBeTruthy();
        for (let btn of ["⟨", "1", "2", "3", "4", "5", "⟩"]) {
            getByText(paginationDiv, btn);
        }
        for (let btn of ["...", "6"]) {
            expect(queryByText(paginationDiv, btn)).toBeNull();
        }
    
        // Click on page five and wait for the data to be updated
        let pageFiveButton = getByText(paginationDiv, "5");
        fireEvent.click(pageFiveButton);
        await waitFor(() => getByText(container, "object #81"));
        getByText(container, "object #100");
        expect(queryByText(container, "object #101")).toBeNull();
    });
    
    
    test("Load page 1 of 10 and check pagination gaps", async () => {
        let { store } = createTestStore();
        store.dispatch(setObjectsListPaginationInfo({itemsPerPage: 10}));
        
        // Route component is required for matching (getting :id part of the URL in the Object component)
        let { container } = renderWithWrappers(<App />, {
            route: "/objects/list", store
        });
    
        // Wait for the objects to load
        await waitFor(() => getByText(container, "object #1"));
    
        // Check if pagination is correctly rendered (p 1 2 3 4 5 6 7 . 10 n)
        let paginationDiv = container.querySelector(".pagination");
        expect(paginationDiv).toBeTruthy();
        for (let btn of ["⟨", "1", "2", "3", "4", "5", "6", "7", "...", "10", "⟩"]) {
            getByText(paginationDiv, btn);
        }
        for (let btn of ["8", "9"]) {
            expect(queryByText(paginationDiv, btn)).toBeNull();
        }
    
        // Move to page 3 and check if pagination is correctly rendered (p 1 2 3 4 5 6 7 . 10 n)
        let pageThreeButton = getByText(paginationDiv, "3");
        fireEvent.click(pageThreeButton);
        await waitFor(() => getByText(container, "object #21"));
    
        paginationDiv = container.querySelector(".pagination");
        expect(paginationDiv).toBeTruthy();
        for (let btn of ["⟨", "1", "2", "3", "4", "5", "6", "7", "...", "10", "⟩"]) {
            getByText(paginationDiv, btn);
        }
        for (let btn of ["8", "9"]) {
            expect(queryByText(paginationDiv, btn)).toBeNull();
        }
    
        // Move to page 5 and check if pagination is correctly rendered (p 1 2 3 4 5 6 7 . 10 n)
        let pageFiveButton = getByText(paginationDiv, "5");
        fireEvent.click(pageFiveButton);
        await waitFor(() => getByText(container, "object #41"));
    
        paginationDiv = container.querySelector(".pagination");
        expect(paginationDiv).toBeTruthy();
        for (let btn of ["⟨", "1", "2", "3", "4", "5", "6", "7", "...", "10", "⟩"]) {
            getByText(paginationDiv, btn);
        }
        for (let btn of ["8", "9"]) {
            expect(queryByText(paginationDiv, btn)).toBeNull();
        }
    
        // Move to next page and check if pagination is correctly rendered (p 1 . 4 5 6 7 8 9 10 n)
        let nextPageButton = getByText(paginationDiv, "⟩");
        fireEvent.click(nextPageButton);
        await waitFor(() => getByText(container, "object #51"));
    
        paginationDiv = container.querySelector(".pagination");
        expect(paginationDiv).toBeTruthy();
        for (let btn of ["⟨", "1", "...", "4", "5", "6", "7", "8", "9", "10", "⟩"]) {
            getByText(paginationDiv, btn);
        }
        for (let btn of ["2", "3"]) {
            expect(queryByText(paginationDiv, btn)).toBeNull();
        }
    
        // Move to previous page and check if pagination is correctly rendered (p 1 2 3 4 5 6 7 . 10 n)
        let previousPageButton = getByText(paginationDiv, "⟨");
        fireEvent.click(previousPageButton);
        await waitFor(() => getByText(container, "object #41"));
    
        paginationDiv = container.querySelector(".pagination");
        expect(paginationDiv).toBeTruthy();
        for (let btn of ["⟨", "1", "2", "3", "4", "5", "6", "7", "...", "10", "⟩"]) {
            getByText(paginationDiv, btn);
        }
        for (let btn of ["8", "9"]) {
            expect(queryByText(paginationDiv, btn)).toBeNull();
        }
    
        // Move to page 10 and check if pagination is correctly rendered (p 1 . 4 5 6 7 8 9 10 n)
        let pageTenButton = getByText(paginationDiv, "10");
        fireEvent.click(pageTenButton);
        await waitFor(() => getByText(container, "object #91"));
    
        paginationDiv = container.querySelector(".pagination");
        expect(paginationDiv).toBeTruthy();
        for (let btn of ["⟨", "1", "...", "4", "5", "6", "7", "8", "9", "10", "⟩"]) {
            getByText(paginationDiv, btn);
        }
        for (let btn of ["2", "3"]) {
            expect(queryByText(paginationDiv, btn)).toBeNull();
        }
    });
});


describe("Side menu", () => {
    test("Buttons during fetch", async () => {
        let { store } = createTestStore();
        store.dispatch(setObjectsListPaginationInfo({itemsPerPage: 10}))
        
        // Route component is required for matching (getting :id part of the URL in the Object component)
        let { container } = renderWithWrappers(<App />, {
            route: "/objects/list", store
        });

        let addObjectButton = getSideMenuItem(container, "Add a New Object");
        let editObjectButton = getSideMenuItem(container, "Edit Object");
        let deleteObjectButton = getSideMenuItem(container, "Delete");

        // Check if buttons can't be clicked during fetch
        await waitFor(() => expect(
            store.getState().objectsListUI.fetch.isFetching === true
            && addObjectButton.classList.contains("disabled") // Semantic UI always adds onClick event to div elements, even if they are disabled (which does nothing in this case)
            && editObjectButton.classList.contains("disabled")
            && deleteObjectButton.classList.contains("disabled")
            // && addObjectButton.onclick === null
            // && editObjectButton.onclick === null
            // && deleteObjectButton.onclick === null
        ).toBeTruthy());
    });


    test("Add object button", async () => {
        let { store } = createTestStore();
        store.dispatch(setObjectsListPaginationInfo({itemsPerPage: 10}));
        
        // Route component is required for matching (getting :id part of the URL in the Object component)
        let { container, historyManager } = renderWithWrappers(<App />, {
            route: "/objects/list", store
        });

        // Wait for the objects to be loaded
        await waitFor(() => getByText(container, "object #1"));

        // Check if add button click redirects to add object page
        let addObjectButton = getSideMenuItem(container, "Add a New Object");
        fireEvent.click(addObjectButton);
        await historyManager.waitForCurrentURLToBe("/objects/edit/new");
    });


    test("Edit object button", async () => {
        let { store } = createTestStore();
        store.dispatch(setObjectsListPaginationInfo({itemsPerPage: 10}))
        
        // Route component is required for matching (getting :id part of the URL in the Object component)
        let { container, historyManager } = renderWithWrappers(<App />, {
            route: "/objects/list", store
        });

        // Wait for the objects to be loaded
        await waitFor(() => getByText(container, "object #1"));

        // Check if edit object button is disabled if a single object is not selected
        let editObjectButton = getSideMenuItem(container, "Edit Object");
        expect(editObjectButton.classList.contains("disabled")).toBeTruthy(); // Semantic UI always adds onClick event to div elements, even if they are disabled (which does nothing in this case)
        // expect(editObjectButton.onclick).toBeNull();

        // Get objects
        let objects = container.querySelector(".field-item-list").querySelectorAll(".field-item");
        let firstObjectCheckbox = objects.item(0).querySelector(".field-item-checkbox");
        let secondObjectCheckbox = objects.item(1).querySelector(".field-item-checkbox");

        // Select two objects and check if edit button is disabled
        fireEvent.click(firstObjectCheckbox);
        fireEvent.click(secondObjectCheckbox);
        await waitFor(() => expect(store.getState().objectsListUI.selectedObjectIDs).toEqual(expect.arrayContaining([1, 2])));
        fireEvent.click(editObjectButton);     // editObjectButton.onclick is not null after handler is added, although the button is not clickable, so checking onclick prop on being null is not viable
        historyManager.ensureCurrentURL("/objects/list");

        // Deselect a object, click edit object button and check if it redirected to /objects/edit/:id
        fireEvent.click(secondObjectCheckbox);
        await waitFor(() => expect(store.getState().objectsListUI.selectedObjectIDs).toEqual(expect.arrayContaining([1])));
        editObjectButton = getSideMenuItem(container, "Edit Object");   // get the element again to properly click it
        fireEvent.click(editObjectButton);
        await historyManager.waitForCurrentURLToBe("/objects/edit/1");
    });


    test("Delete button + edited objects removal", async () => {
        let { store } = createTestStore();
        store.dispatch(setObjectsListPaginationInfo({itemsPerPage: 10}));
        
        // Render an object with id = 1 page and modify it to keep it in the editedObjects storage, then click cancel button
        let { container } = renderWithWrappers(<App />, {
            route: "/objects/edit/1", store
        });
        await waitFor(() => getByText(container, "Object Information"));
        let objectNameInput = getByPlaceholderText(container, "Object name");
        const objectNameText = "modified name";
        fireEvent.change(objectNameInput, { target: { value: objectNameText } });
        await waitFor(() => expect(getCurrentObject(store.getState()).object_name).toBe(objectNameText));
        
        const cancelButton = getSideMenuItem(container, "Cancel");
        fireEvent.click(cancelButton);

        // Wait for the objects to be loaded
        await waitFor(() => getByText(container, "object #1"));

        // Check if edited object was not removed
        expect(Object.keys(store.getState().editedObjects).includes("1")).toBeTruthy();

        // Check if edit object button is disabled if a single object is not selected
        let deleteButton = getSideMenuItem(container, "Delete");
        expect(deleteButton.classList.contains("disabled")).toBeTruthy(); // Semantic UI always adds onClick event to div elements, even if they are disabled (which does nothing in this case)
        // expect(deleteButton.onclick).toBeNull();

        // Select two objects
        let mainObjectField = container.querySelector(".field-item-list");
        let objects = mainObjectField.querySelectorAll(".field-item");
        let firstObjectCheckbox = objects.item(0).querySelector(".field-item-checkbox");
        let secondObjectCheckbox = objects.item(1).querySelector(".field-item-checkbox");
        fireEvent.click(firstObjectCheckbox);
        fireEvent.click(secondObjectCheckbox);

        // Click delete button and check if a confirmation dialog appeared
        expect(deleteButton.onclick).toBeTruthy();
        fireEvent.click(deleteButton);

        // Click "No" button and check if dialog was closed
        expect(getSideMenuDialogControls(container).header.title).toEqual("Delete Selected Objects?");
        fireEvent.click(getSideMenuDialogControls(container).buttons["No"]);
        expect(getSideMenuDialogControls(container)).toBeNull();
        getByText(mainObjectField, "object #1");

        // Delete selected objects
        deleteButton = getSideMenuItem(container, "Delete");
        fireEvent.click(deleteButton);
        fireEvent.click(getSideMenuDialogControls(container).buttons["Yes"]);

        // Check if deleted objects were removed from the state and the page
        await waitFor(() => expect(Object.keys(store.getState().objects)).toEqual(expect.not.arrayContaining(["1", "2"])));
        expect(queryByText(container, "object #1")).toBeNull();
        expect(queryByText(container, "object #2")).toBeNull();

        // Check if edited object was not removed
        expect(Object.keys(store.getState().editedObjects).includes("1")).toBeFalsy();
    });


    test("Delete button (delete composite without subobjects)", async () => {
        let store = getStoreWithModifiedCompositeObject();

        // Route component is required for matching (getting :id part of the URL in the Object component)
        let { container } = renderWithWrappers(<App />, {
            route: "/objects/list", store
        });

        // Wait for the objects to be loaded
        await waitForFetch(store);
        for (let objectID of ["1", "2", "-1"])  // check if object IDs are correctly added to editedObjects
            expect(store.getState().editedObjects).toHaveProperty(objectID);

        // Select composite object
        const compositeObjectName = store.getState().editedObjects[1].object_name;
        fireEvent.click(getByText(container, compositeObjectName).parentNode.parentNode.querySelector(".field-item-checkbox"));
        await waitFor(() => expect(store.getState().objectsListUI.selectedObjectIDs.indexOf(1)).toBeGreaterThan(-1));

        // Delete composite object with subobjects
        const deleteButton = getSideMenuItem(container, "Delete");
        fireEvent.click(deleteButton);
        fireEvent.click(getSideMenuDialogControls(container).buttons["Yes"]);

        // Check if composite object is deleted and deselected
        await waitFor(() => expect(store.getState().editedObjects).not.toHaveProperty("1"));
        const state = store.getState();
        expect(state.objects).not.toHaveProperty("1");
        expect(state.objectsTags).not.toHaveProperty("1");
        expect(state.composite).not.toHaveProperty("1");
        expect(state.editedObjects).not.toHaveProperty("1");
        expect(state.objectsListUI.selectedObjectIDs.indexOf(1)).toEqual(-1);

        // Check if new subobject is deleted from editedObjects
        expect(state.editedObjects).not.toHaveProperty("-1");

        // Check if existing subobject is not removed from state
        expect(state.objects).toHaveProperty("2");
        expect(state.objectsTags).toHaveProperty("2");
        expect(state.links).toHaveProperty("2");
        expect(state.editedObjects).toHaveProperty("2");
    });


    test("Delete button (delete composite with subobjects)", async () => {
        let store = getStoreWithModifiedCompositeObject();

        // Route component is required for matching (getting :id part of the URL in the Object component)
        let { container } = renderWithWrappers(<App />, {
            route: "/objects/list", store
        });

        // Wait for the objects to be loaded
        await waitForFetch(store);
        for (let objectID of ["1", "2", "-1"])  // check if object IDs are correctly added to editedObjects
            expect(store.getState().editedObjects).toHaveProperty(objectID);

        // Select composite object
        const compositeObjectName = store.getState().editedObjects[1].object_name;
        fireEvent.click(getByText(container, compositeObjectName).parentNode.parentNode.querySelector(".field-item-checkbox"));
        await waitFor(() => expect(store.getState().objectsListUI.selectedObjectIDs.indexOf(1)).toBeGreaterThan(-1));

        // Delete composite object with subobjects
        const deleteButton = getSideMenuItem(container, "Delete");
        fireEvent.click(deleteButton);
        fireEvent.click(getSideMenuDialogControls(container).checkbox);
        fireEvent.click(getSideMenuDialogControls(container).buttons["Yes"]);

        // Check if composite object is deleted and deselected
        await waitFor(() => expect(store.getState().editedObjects).not.toHaveProperty("1"));
        const state = store.getState();
        expect(state.objects).not.toHaveProperty("1");
        expect(state.objectsTags).not.toHaveProperty("1");
        expect(state.composite).not.toHaveProperty("1");
        expect(state.editedObjects).not.toHaveProperty("1");
        expect(state.objectsListUI.selectedObjectIDs.indexOf(1)).toEqual(-1);

        // Check if new subobject is deleted from editedObjects
        expect(state.editedObjects).not.toHaveProperty("-1");

        // Check if existing subobject is removed from state
        expect(state.objects).not.toHaveProperty("2");
        expect(state.objectsTags).not.toHaveProperty("2");
        expect(state.links).not.toHaveProperty("2");
        expect(state.editedObjects).not.toHaveProperty("2");
    });
});


describe("Field menu", () => {
    test("Select + deselect", async () => {
        let { store } = createTestStore();
        store.dispatch(setObjectsListPaginationInfo({itemsPerPage: 10}))
        
        // Route component is required for matching (getting :id part of the URL in the Object component)
        let { container } = renderWithWrappers(<App />, {
            route: "/objects/list", store
        });

        // Wait for the objects to be loaded
        await waitFor(() => getByText(container, "object #1"));

        // Select all objects and check if they were displayed on the page
        let selectAllButton = getByTitle(container, "Select all objects on page");
        fireEvent.click(selectAllButton);
        for (let i = 1; i <= 10; i++) {
            expect(queryAllByText(container, `object #${i}`).length).toEqual(2);
        }

        // Deselect all objects
        let deselectAllButton = getByTitle(container, "Deselect all objects");
        fireEvent.click(deselectAllButton);
        for (let i = 1; i <= 10; i++) {
            expect(queryAllByText(container, `object #${i}`).length).toEqual(1);
        }
    });


    test("Sort buttons", async () => {
        let { store } = createTestStore();
        const objectsPerPage = 10;
        store.dispatch(setObjectsListPaginationInfo({itemsPerPage: objectsPerPage}));
        
        // Route component is required for matching (getting :id part of the URL in the Object component)
        let { container } = renderWithWrappers(<App />, {
            route: "/objects/list", store
        });

        // Wait for the objects to be loaded
        await waitFor(() => getByText(container, "object #1"));
        let sortByNameButton = getByTitle(container, "Sort by object name");
        let sortByTimeButton = getByTitle(container, "Sort by modify time");
        let sortAscButton = getByTitle(container, "Sort in ascending order");
        let sortDescButton = getByTitle(container, "Sort in descending order");

        // Sort by object name desc and check if objects are correctly displayed
        fireEvent.click(sortDescButton);
        await waitForFetch(store);
        checkObjectsDisplay(store, container);

        // Sort by modify time desc and check if objects are correctly displayed
        fireEvent.click(sortByTimeButton);
        await waitForFetch(store);
        checkObjectsDisplay(store, container);

        // Sort by modify time asc and check if objects are correctly displayed
        fireEvent.click(sortAscButton);
        await waitForFetch(store);
        checkObjectsDisplay(store, container);

        // Sort by modify object name asc and check if objects are correctly displayed
        fireEvent.click(sortByNameButton);
        await waitForFetch(store);
        checkObjectsDisplay(store, container);
    });


    test("Object filter", async () => {
        let { store } = createTestStore();
        store.dispatch(setObjectsListPaginationInfo({itemsPerPage: 10}))
        
        // Route component is required for matching (getting :id part of the URL in the Object component)
        let { container } = renderWithWrappers(<App />, {
            route: "/objects/list", store
        });

        // Wait for the objects to be loaded
        await waitFor(() => getByText(container, "object #1"));

        // Filter with matching objects and check if they are correctly displayed
        // let objectFilterInput = container.querySelector(".horizontal-menu-filter").querySelector("input");
        let objectFilterInput = getByPlaceholderText(container, "Filter objects");
        expect(objectFilterInput).toBeTruthy();
        fireEvent.change(objectFilterInput, { target: { value: "some text" } });
        await waitForFetch(store);
        checkObjectsDisplay(store, container);

        // Filter with no matching objects and check if error message is displayed
        fireEvent.change(objectFilterInput, { target: { value: "no match" } });
        await waitFor(() => getByText(container, "No objects found.", { exact: false }));
    });


    test("Object type filter", async () => {
        // Route component is required for matching (getting :id part of the URL in the Object component)
        let { store, container } = renderWithWrappers(<App />, {
            route: "/objects/list"
        });

        const dropdown = getByText(container, "Filter by object type").parentNode;

        // Wait for the objects to be loaded
        await waitFor(() => getByText(container, "object #1"));
        expect(store.getState().objectsListUI.paginationInfo.objectTypes.length).toEqual(0);

        // Select each object type separately
        const objectTypeNames = ["Links", "Markdown", "To-do lists", "Composite objects"], objectTypes = ["link", "markdown", "to_do_list", "composite"];

        for (let i in objectTypeNames) {
            await selectObjectTypeInFilter(objectTypeNames[i], dropdown, store);
            expect(store.getState().objectsListUI.paginationInfo.objectTypes.includes(objectTypes[i])).toBeTruthy();
            checkObjectsDisplay(store, container);
            await deselectObjectTypeInFilter(objectTypeNames[i], dropdown, store);
            expect(store.getState().objectsListUI.paginationInfo.objectTypes.includes(objectTypes[i])).toBeFalsy();
        }

        // Select 2 object types at the same time (links + markdown)
        await selectObjectTypeInFilter(objectTypeNames[0], dropdown, store);
        expect(store.getState().objectsListUI.paginationInfo.objectTypes.includes(objectTypes[0])).toBeTruthy();
        await selectObjectTypeInFilter(objectTypeNames[1], dropdown, store);
        expect(store.getState().objectsListUI.paginationInfo.objectTypes.includes(objectTypes[1])).toBeTruthy();
        checkObjectsDisplay(store, container);
        await deselectObjectTypeInFilter(objectTypeNames[0], dropdown, store);
        expect(store.getState().objectsListUI.paginationInfo.objectTypes.includes(objectTypes[0])).toBeFalsy();
        await deselectObjectTypeInFilter(objectTypeNames[1], dropdown, store);
        expect(store.getState().objectsListUI.paginationInfo.objectTypes.includes(objectTypes[1])).toBeFalsy();

        // Select all object types
        for (let i in objectTypeNames) {
            await selectObjectTypeInFilter(objectTypeNames[i], dropdown, store);
            expect(store.getState().objectsListUI.paginationInfo.objectTypes.includes(objectTypes[i])).toBeTruthy();
        }
        checkObjectsDisplay(store, container);

        // Deselect all object types
        for (let i in objectTypeNames) {
            await deselectObjectTypeInFilter(objectTypeNames[i], dropdown, store);
            expect(store.getState().objectsListUI.paginationInfo.objectTypes.includes(objectTypes[i])).toBeFalsy();
        }
        checkObjectsDisplay(store, container);
    });


    test("Tags filter", async () => {
        // Route component is required for matching (getting :id part of the URL in the Object component)
        let { store, container } = renderWithWrappers(<App />, {
            route: "/objects/list"
        });

        // Wait for the objects to be loaded
        await waitFor(() => getByText(container, "object #1"));

        // Clear button is disabled when no tags are selected
        const clearTagsFilterButton = getByTitle(container, "Clear tags filter");
        expect(clearTagsFilterButton.className.indexOf("disabled")).toBeGreaterThan(-1);

        // Filter tags list is not displayed when no tags are selected
        container.querySelectorAll(".inline-item-list-header").forEach(header => expect(header.textContent === "Tags filter").toBeFalsy());

        // Try filtering with a non-existing tag
        const tagsFilterContainer = getByText(container, "Filter objects by tags").parentNode;
        const tagsFilterInput = tagsFilterContainer.querySelector("input.search");
        expect(tagsFilterInput).toBeTruthy();
        await searchTagInFilter("not found", tagsFilterInput, store);
        fireEvent.keyDown(tagsFilterInput, { key: "Enter", code: "Enter" });
        expect(store.getState().objectsListUI.paginationInfo.tagsFilter.length).toEqual(0);     // no filter was added
        expect(tagsFilterContainer.querySelector(".visible.menu.transition")).toBeFalsy();  // dropdown list is not displayed

        // Add and item via Enter key press (tag #3)
        await searchTagInFilter("tag #", tagsFilterInput, store);
        let dropdownList = tagsFilterContainer.querySelector(".visible.menu.transition");
        expect(dropdownList).toBeTruthy();
        fireEvent.keyDown(tagsFilterInput, { key: "ArrowDown", code: "ArrowDown" });
        fireEvent.keyDown(tagsFilterInput, { key: "ArrowDown", code: "ArrowDown" });
        fireEvent.keyDown(tagsFilterInput, { key: "Enter", code: "Enter" });
        await checkIfTagIsAddedToFilter(3, container, store);

        // Add and item via click (tag #4)
        await searchTagInFilter("tag #", tagsFilterInput, store);
        dropdownList = tagsFilterContainer.querySelector(".visible.menu.transition");
        expect(dropdownList).toBeTruthy();
        fireEvent.click(getByText(dropdownList, "tag #4"));
        await checkIfTagIsAddedToFilter(4, container, store);

        // Add and item via click (tag #5) and check if no objects are found
        await searchTagInFilter("tag #", tagsFilterInput, store);
        dropdownList = tagsFilterContainer.querySelector(".visible.menu.transition");
        expect(dropdownList).toBeTruthy();
        fireEvent.click(getByText(dropdownList, "tag #5"));
        await checkIfTagIsAddedToFilter(5, container, store);

        // Remove a tag from filter by clicking on it
        const tagFive = getInlineItem({ container: getByText(container, "Tags Filter").parentNode, text: "tag #5" });
        fireEvent.click(tagFive.icons[0]);
        // fireEvent.click(getByText(getByText(container, "Tags Filter").parentNode, `tag #5`));
        await waitForFetch(store);
        let tagsFilterListContainer = getByText(container, "Tags Filter").parentNode;
        getByText(tagsFilterListContainer, "tag #3");
        getByText(tagsFilterListContainer, "tag #4");
        expect(queryByText(tagsFilterListContainer, "tag #5")).toBeFalsy();
        checkObjectsDisplay(store, container);

        // Click on clear tag filter button
        fireEvent.click(clearTagsFilterButton);
        await waitForFetch(store);
        checkObjectsDisplay(store, container);
        expect(queryByText(container, "Tags Filter")).toBeFalsy();

        // Search text is reset on blur
        await searchTagInFilter("tag #", tagsFilterInput, store);
        let reactProps;                                         // workaround to call onBlur event of the tags filter input container, which should reset tagsFilterInput state; 
        Object.keys(tagsFilterContainer).forEach(key => {       // fireEvent.blur(clearTagsFilterButton) does not trigger the event
            if (key.indexOf("reactProps") > -1) reactProps = tagsFilterContainer[key];
        });
        reactProps.onBlur();

        expect(tagsFilterInput.value).toEqual("");                                          // search text is reset
        expect(tagsFilterContainer.querySelector(".visible.menu.transition")).toBeFalsy();  // dropdown list is not displayed
        expect(store.getState().objectsListUI.tagsFilterInput.inputText).toEqual("");           // input text is reset in the state
        expect(store.getState().objectsListUI.tagsFilterInput.matchingIDs).toEqual([]);         // matching IDs are reset in the state
    });
});
