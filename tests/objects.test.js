/*
// Old imports and setup/teardown functions.
// Tests sometimes fail because of using the shared state of mock fetch when they're run concurrently.

// import React from "react";
// import { Route } from "react-router-dom";

// import { fireEvent } from "@testing-library/react";
// import { getByText, getByTitle, waitFor, queryByText, queryAllByText } from '@testing-library/dom'

// import { mockFetch, setFetchFailParams, resetMocks } from "./mocks/mock-fetch";
// import { getMockedPageObjectIDs } from "./mocks/mock-fetch-handlers-objects";
// import { renderWithWrappers } from "./test-utils";
// import createStore from "../src/store/create-store";

// import Objects from "../src/components/objects";
// import { setObjectsPaginationInfo } from "../src/actions/objects";


// beforeAll(() => { global.fetch = jest.fn(mockFetch); });
// afterAll(() => { jest.resetAllMocks(); });
// afterEach(() => { resetMocks(); });
*/
import React from "react";
import { Route } from "react-router-dom";

import { fireEvent } from "@testing-library/react";
import { getByText, getByTitle, waitFor, queryByText, queryAllByText, getByPlaceholderText } from "@testing-library/dom";

import { getMockedPageObjectIDs } from "./mocks/mock-fetch-handlers-objects";
import { renderWithWrappers } from "./test-utils/render";
import createStore from "../src/store/create-store";

import Objects from "../src/components/objects";
import { setObjectsPaginationInfo } from "../src/actions/objects";


/*
    /objects page tests.
*/
beforeEach(() => {
    // isolate fetch mock to avoid tests state collision because of cached data in fetch
    jest.isolateModules(() => {
        const { mockFetch, setFetchFailParams } = require("./mocks/mock-fetch");
        // reset fetch mocks
        jest.resetAllMocks();
        global.fetch = jest.fn(mockFetch);
        global.setFetchFailParams = jest.fn(setFetchFailParams);
    });
});


test("Load page with a fetch error", async () => {
    setFetchFailParams(true, "Test objects fetch error");

    // Route component is required for matching (getting :id part of the URL in the Object component)
    let { container } = renderWithWrappers(<Route exact path="/objects"><Objects /></Route>, {
        route: "/objects"
    });

    // Check if error message if displayed
    await waitFor(() => getByText(container, "Test objects fetch error", { exact: false }));

    // Check if buttons are not enabled
    let editObjectButton = getByText(container, "Edit Object");
    let deleteButton = getByText(container, "Delete");
    expect(editObjectButton.className.startsWith("disabled")).toBeTruthy(); // Semantic UI always adds onClick event to div elements, even if they are disabled (which does nothing in this case)
    // expect(editObjectButton.onclick).toBeNull();
    expect(deleteButton.className.startsWith("disabled")).toBeTruthy(); // Semantic UI always adds onClick event to div elements, even if they are disabled (which does nothing in this case)
    // expect(deleteButton.onclick).toBeNull();

    // Check if pagination is not rendered
    expect(container.querySelector(".field-pagination")).toBeNull();
});


test("Load a page without pagination", async () => {
    let store = createStore({ useLocalStorage: false, enableDebugLogging: false });
    store.dispatch(setObjectsPaginationInfo({itemsPerPage: 100}))
    
    // Route component is required for matching (getting :id part of the URL in the Object component)
    let { container } = renderWithWrappers(<Route exact path="/objects"><Objects /></Route>, {
        route: "/objects",
        store: store
    });

    // Wait for the objects to be loaded
    await waitFor(() => getByText(container, "object #1"));

    // Check if pagination is not rendered
    expect(container.querySelector(".field-pagination")).toBeNull();
});


test("Load page 1 of 5 and click on page 5", async () => {
    let store = createStore({ useLocalStorage: false, enableDebugLogging: false });
    store.dispatch(setObjectsPaginationInfo({itemsPerPage: 20}))
    
    // Route component is required for matching (getting :id part of the URL in the Object component)
    let { container } = renderWithWrappers(<Route exact path="/objects"><Objects /></Route>, {
        route: "/objects",
        store: store
    });

    // Check if no pagination is rendered during fetch
    await waitFor(() => expect(
        store.getState().objectsUI.fetch.isFetching === true
        && container.querySelector(".field-pagination") === null
    ).toBeTruthy());

    // Check if objects 1 to 20 are displayed on the page after fetch is complete
    await waitFor(() => getByText(container, "object #1"));
    getByText(container, "object #20");
    expect(queryByText(container, "object #21")).toBeNull();

    // Check if pagination is correctly rendered
    let paginationDiv = container.querySelector(".field-pagination");
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
    let store = createStore({ useLocalStorage: false });
    store.dispatch(setObjectsPaginationInfo({itemsPerPage: 10}));
    
    // Route component is required for matching (getting :id part of the URL in the Object component)
    let { container } = renderWithWrappers(<Route exact path="/objects"><Objects /></Route>, {
        route: "/objects",
        store: store
    });

    // Wait for the objects to load
    await waitFor(() => getByText(container, "object #1"));

    // Check if pagination is correctly rendered (p 1 2 3 4 5 6 7 . 10 n)
    let paginationDiv = container.querySelector(".field-pagination");
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

    paginationDiv = container.querySelector(".field-pagination");
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

    paginationDiv = container.querySelector(".field-pagination");
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

    paginationDiv = container.querySelector(".field-pagination");
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

    paginationDiv = container.querySelector(".field-pagination");
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

    paginationDiv = container.querySelector(".field-pagination");
    expect(paginationDiv).toBeTruthy();
    for (let btn of ["⟨", "1", "...", "4", "5", "6", "7", "8", "9", "10", "⟩"]) {
        getByText(paginationDiv, btn);
    }
    for (let btn of ["2", "3"]) {
        expect(queryByText(paginationDiv, btn)).toBeNull();
    }
});


test("Side menu buttons during fetch", async () => {
    let store = createStore({ useLocalStorage: false, enableDebugLogging: false });
    store.dispatch(setObjectsPaginationInfo({itemsPerPage: 10}))
    
    // Route component is required for matching (getting :id part of the URL in the Object component)
    let { container } = renderWithWrappers(<Route exact path="/objects"><Objects /></Route>, {
        route: "/objects",
        store: store
    });

    let addObjectButton = getByText(container, "Add Object");
    let editObjectButton = getByText(container, "Edit Object");
    let deleteObjectButton = getByText(container, "Delete");

    // Check if buttons can't be clicked during fetch
    await waitFor(() => expect(
        store.getState().objectsUI.fetch.isFetching === true
        && addObjectButton.className.startsWith("disabled") // Semantic UI always adds onClick event to div elements, even if they are disabled (which does nothing in this case)
        && editObjectButton.className.startsWith("disabled")
        && deleteObjectButton.className.startsWith("disabled")
        // && addObjectButton.onclick === null
        // && editObjectButton.onclick === null
        // && deleteObjectButton.onclick === null
    ).toBeTruthy());
});


test("Side menu add object button", async () => {
    let store = createStore({ useLocalStorage: false, enableDebugLogging: false });
    store.dispatch(setObjectsPaginationInfo({itemsPerPage: 10}));
    
    // Route component is required for matching (getting :id part of the URL in the Object component)
    let { container, history } = renderWithWrappers(<Route exact path="/objects"><Objects /></Route>, {
        route: "/objects",
        store: store
    });

    // Wait for the objects to be loaded
    await waitFor(() => getByText(container, "object #1"));

    // Check if add button click redirects to add object page
    let addObjectButton = getByText(container, "Add Object");
    fireEvent.click(addObjectButton);
    await waitFor(() => expect(history.entries[history.length - 1].pathname).toBe("/objects/add"));
});


test("Side menu edit object button", async () => {
    let store = createStore({ useLocalStorage: false, enableDebugLogging: false });
    store.dispatch(setObjectsPaginationInfo({itemsPerPage: 10}))
    
    // Route component is required for matching (getting :id part of the URL in the Object component)
    let { container, history } = renderWithWrappers(<Route exact path="/objects"><Objects /></Route>, {
        route: "/objects",
        store: store
    });

    // Wait for the objects to be loaded
    await waitFor(() => getByText(container, "object #1"));

    // Check if edit object button is disabled if a single object is not selected
    let editObjectButton = getByText(container, "Edit Object");
    expect(editObjectButton.className.startsWith("disabled")).toBeTruthy(); // Semantic UI always adds onClick event to div elements, even if they are disabled (which does nothing in this case)
    // expect(editObjectButton.onclick).toBeNull();

    // Get objects
    let objects = container.querySelector(".field-item-list").querySelectorAll(".field-item");
    let firstObjectCheckbox = objects.item(0).querySelector(".field-item-checkbox");
    let secondObjectCheckbox = objects.item(1).querySelector(".field-item-checkbox");

    // Select two objects and check if edit button is disabled
    fireEvent.click(firstObjectCheckbox);
    fireEvent.click(secondObjectCheckbox);
    await waitFor(() => expect(store.getState().objectsUI.selectedObjectIDs).toEqual(expect.arrayContaining([1, 2])));
    fireEvent.click(editObjectButton);     // editObjectButton.onclick is not null after handler is added, although the button is not clickable, so checking onclick prop on being null is not viable
    expect(history.entries[history.length - 1].pathname).toBe("/objects");

    // Deselect a object, click edit object button and check if it redirected to /objects/:id
    fireEvent.click(secondObjectCheckbox);
    await waitFor(() => expect(store.getState().objectsUI.selectedObjectIDs).toEqual(expect.arrayContaining([1])));
    fireEvent.click(editObjectButton);
    await waitFor(() => expect(history.entries[history.length - 1].pathname).toBe("/objects/1"));
});


test("Side menu delete button", async () => {
    let store = createStore({ useLocalStorage: false, enableDebugLogging: false });
    store.dispatch(setObjectsPaginationInfo({itemsPerPage: 10}))
    
    // Route component is required for matching (getting :id part of the URL in the Object component)
    let { container } = renderWithWrappers(<Route exact path="/objects"><Objects /></Route>, {
        route: "/objects",
        store: store
    });

    // Wait for the objects to be loaded
    await waitFor(() => getByText(container, "object #1"));

    // Check if edit object button is disabled if a single object is not selected
    let deleteButton = getByText(container, "Delete");
    expect(deleteButton.className.startsWith("disabled")).toBeTruthy(); // Semantic UI always adds onClick event to div elements, even if they are disabled (which does nothing in this case)
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
    let sideMenu = container.querySelector(".vertical.menu");
    let dialog = sideMenu.querySelector(".side-menu-dialog");
    expect(dialog).toBeTruthy();

    // Click "No" button and check if dialog was closed
    let dialogNoButton = getByText(dialog, "No");
    fireEvent.click(dialogNoButton);
    expect(sideMenu.querySelector(".side-menu-dialog")).toBeNull();
    getByText(mainObjectField, "object #1");

    // Delete selected objects
    deleteButton = getByText(container, "Delete");
    fireEvent.click(deleteButton);
    dialog = sideMenu.querySelector(".side-menu-dialog");
    let dialogYesButton = getByText(dialog, "Yes");
    fireEvent.click(dialogYesButton);

    // Check if deleted objects were removed from the state and the page
    await waitFor(() => expect(Object.keys(store.getState().objects)).toEqual(expect.not.arrayContaining(["1", "2"])));
    expect(queryByText(container, "object #1")).toBeNull();
    expect(queryByText(container, "object #2")).toBeNull();
});


test("Field menu, select + deselect", async () => {
    let store = createStore({ useLocalStorage: false, enableDebugLogging: false });
    store.dispatch(setObjectsPaginationInfo({itemsPerPage: 10}))
    
    // Route component is required for matching (getting :id part of the URL in the Object component)
    let { container } = renderWithWrappers(<Route exact path="/objects"><Objects /></Route>, {
        route: "/objects",
        store: store
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


test("Field menu, sort buttons", async () => {
    let store = createStore({ useLocalStorage: false, enableDebugLogging: false });
    const objectsPerPage = 10;
    store.dispatch(setObjectsPaginationInfo({itemsPerPage: objectsPerPage}));
    
    // Route component is required for matching (getting :id part of the URL in the Object component)
    let { container } = renderWithWrappers(<Route exact path="/objects"><Objects /></Route>, {
        route: "/objects",
        store: store
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


test("Field menu, object filter", async () => {
    let store = createStore({ useLocalStorage: false, enableDebugLogging: false });
    store.dispatch(setObjectsPaginationInfo({itemsPerPage: 10}))
    
    // Route component is required for matching (getting :id part of the URL in the Object component)
    let { container } = renderWithWrappers(<Route exact path="/objects"><Objects /></Route>, {
        route: "/objects",
        store: store
    });

    // Wait for the objects to be loaded
    await waitFor(() => getByText(container, "object #1"));

    // Filter with matching objects and check if they are correctly displayed
    let objectFilterInput = container.querySelector(".field-menu-filter").querySelector("input");
    expect(objectFilterInput).toBeTruthy();
    fireEvent.change(objectFilterInput, { target: { value: "some text" } });
    await waitForFetch(store);
    checkObjectsDisplay(store, container);

    // Filter with no matching objects and check if error message is displayed
    fireEvent.change(objectFilterInput, { target: { value: "no match" } });
    await waitFor(() => getByText(container, "No objects found.", { exact: false }));
});


test("Field menu, object type filter", async () => {
    const selectObjectType = async type => {
        // Open dropdown menu
        const dropdownIcon = dropdown.querySelector("i.dropdown");
        expect(dropdownIcon).toBeTruthy();
        fireEvent.click(dropdownIcon);
        
        // Click on the corresponding menu item to select object type
        const menuItems = dropdown.querySelector(".visible.menu.transition");
        expect(menuItems).toBeTruthy();
        const typeItem = getByText(menuItems, type).parentNode;
        fireEvent.click(typeItem);

        // Close dropdown menu
        await waitForFetch(store);
        fireEvent.click(dropdownIcon);
    };

    const deselectObjectType = async type => {
        // Deselect object type
        const deselectIcon = getByText(dropdown, type).querySelector("i.delete.icon");
        expect(deselectIcon).toBeTruthy();
        fireEvent.click(deselectIcon);
        await waitForFetch(store);
    };
    // Route component is required for matching (getting :id part of the URL in the Object component)
    let { store, container } = renderWithWrappers(<Route exact path="/objects"><Objects /></Route>, {
        route: "/objects"
    });

    const dropdown = getByText(container, "Filter by object type").parentNode;

    // Check if object type filter is disabled during fetches
    await waitFor(() => expect(store.getState().objectsUI.fetch.isFetching && dropdown.className.indexOf("disabled") > -1).toBeTruthy());

    // Wait for the objects to be loaded
    await waitFor(() => getByText(container, "object #1"));
    expect(store.getState().objectsUI.paginationInfo.objectTypes.length).toEqual(0);

    // Check if correct objects are displayed when links only are selected
    await selectObjectType("Links");
    expect(store.getState().objectsUI.paginationInfo.objectTypes.includes("link")).toBeTruthy();
    checkObjectsDisplay(store, container);

    // Check if correct objects are displayed when markdown only is selected
    await deselectObjectType("Links");
    await selectObjectType("Markdown");
    expect(store.getState().objectsUI.paginationInfo.objectTypes.includes("link")).toBeFalsy();
    expect(store.getState().objectsUI.paginationInfo.objectTypes.includes("markdown")).toBeTruthy();
    checkObjectsDisplay(store, container);
    
    // Check if correct objects are displayed when markdown only is selected
    await deselectObjectType("Markdown");
    await selectObjectType("To-Do Lists");
    expect(store.getState().objectsUI.paginationInfo.objectTypes.includes("markdown")).toBeFalsy();
    expect(store.getState().objectsUI.paginationInfo.objectTypes.includes("to_do_list")).toBeTruthy();
    checkObjectsDisplay(store, container);

    // Check if correct objects are displayed when all object types are selected
    await selectObjectType("Links");
    await selectObjectType("Markdown");
    expect(store.getState().objectsUI.paginationInfo.objectTypes.includes("link")).toBeTruthy();
    expect(store.getState().objectsUI.paginationInfo.objectTypes.includes("markdown")).toBeTruthy();
    expect(store.getState().objectsUI.paginationInfo.objectTypes.includes("to_do_list")).toBeTruthy();
    checkObjectsDisplay(store, container);

    // Check if correct objects are displayed when all object types are deselected
    await deselectObjectType("Links");
    await deselectObjectType("Markdown");
    await deselectObjectType("To-Do Lists");
    expect(store.getState().objectsUI.paginationInfo.objectTypes.includes("link")).toBeFalsy();
    expect(store.getState().objectsUI.paginationInfo.objectTypes.includes("markdown")).toBeFalsy();
    expect(store.getState().objectsUI.paginationInfo.objectTypes.includes("to_do_list")).toBeFalsy();
    checkObjectsDisplay(store, container);
});


test("Field menu, tags filter", async () => {
    const searchTag = async text => {    
        let oldMatchingIDs = store.getState().objectsUI.tagsFilterInput.matchingIDs;
        fireEvent.change(tagsFilterInput, { target: { value: text } });
        await waitFor(() => expect(oldMatchingIDs).not.toBe(store.getState().objectsUI.tagsFilterInput.matchingIDs));
    };

    const checkIfTagIsAddedToFilter = async id => {
        await waitFor(() => expect(store.getState().objectsUI.paginationInfo.tagsFilter.includes(id)).toBeTruthy());     // tag is added to tagsFilter
        expect(tagsFilterContainer.querySelector(".visible.menu.transition")).toBeFalsy();      // dropdown list is not displayed
        expect(tagsFilterInput.value).toEqual("");                                              // search text is reset
        getByText(getByText(container, "Tags Filter").parentNode, `tag #${id}`);                // tags filter block is displayed and contains the added tag
        // if (store.getState().objectsUI.paginationInfo.tagsFilter.length < 3)
        //     checkObjectsDisplay(store, container);                                                  // correct objects are displayed
        // else
        //     getByText(container, "No objects found.");      // no objects are found if 3 or more tags are in the filter
        checkObjectsDisplay(store, container);                                                  // correct objects are displayed
        if (store.getState().objectsUI.paginationInfo.tagsFilter.length > 2) getByText(container, "No objects found.");      // no objects are found if 3 or more tags are in the filter
    };

    // Route component is required for matching (getting :id part of the URL in the Object component)
    let { store, container } = renderWithWrappers(<Route exact path="/objects"><Objects /></Route>, {
        route: "/objects"
    });

    // Dropdown is disabled during fetch 
    const tagsFilterContainer = getByText(container, "Filter objects by tags").parentNode;
    await waitFor(() => expect(store.getState().objectsUI.fetch.isFetching && tagsFilterContainer.className.indexOf("disabled") > -1).toBeTruthy());

    // Wait for the objects to be loaded
    await waitFor(() => getByText(container, "object #1"));

    // Clear button is disabled when no tags are selected
    const clearTagsFilterButton = getByTitle(container, "Clear tags filter");
    expect(clearTagsFilterButton.className.indexOf("disabled")).toBeGreaterThan(-1);

    // Filter tags list is not displayed when no tags are selected
    container.querySelectorAll(".inline-item-list-wrapper-header").forEach(header => expect(header.textContent === "Tags filter").toBeFalsy());

    // Try filtering with a non-existing tag
    const tagsFilterInput = tagsFilterContainer.querySelector("input.search");
    expect(tagsFilterInput).toBeTruthy();
    await searchTag("not found");
    fireEvent.keyDown(tagsFilterInput, { key: "Enter", code: "Enter" });
    expect(store.getState().objectsUI.paginationInfo.tagsFilter.length).toEqual(0);     // no filter was added
    expect(tagsFilterContainer.querySelector(".visible.menu.transition")).toBeFalsy();  // dropdown list is not displayed

    // Add and item via Enter key press (tag #3)
    await searchTag("tag #");
    let dropdownList = tagsFilterContainer.querySelector(".visible.menu.transition");
    expect(dropdownList).toBeTruthy();
    fireEvent.keyDown(tagsFilterInput, { key: "ArrowDown", code: "ArrowDown" });
    fireEvent.keyDown(tagsFilterInput, { key: "ArrowDown", code: "ArrowDown" });
    fireEvent.keyDown(tagsFilterInput, { key: "Enter", code: "Enter" });
    await checkIfTagIsAddedToFilter(3);

    // Add and item via click (tag #4)
    await searchTag("tag #");
    dropdownList = tagsFilterContainer.querySelector(".visible.menu.transition");
    expect(dropdownList).toBeTruthy();
    fireEvent.click(getByText(dropdownList, "tag #4"));
    await checkIfTagIsAddedToFilter(4);

    // Add and item via click (tag #5) and check if no objects are found
    await searchTag("tag #");
    dropdownList = tagsFilterContainer.querySelector(".visible.menu.transition");
    expect(dropdownList).toBeTruthy();
    fireEvent.click(getByText(dropdownList, "tag #5"));
    await checkIfTagIsAddedToFilter(5);

    // Remove a tag from filter by clicking on it
    fireEvent.click(getByText(getByText(container, "Tags Filter").parentNode, `tag #5`));
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
    await searchTag("tag #");
    let eventHandlers;                                      // workaround to call onBlur event of the tags filter input container, which should reset tagsFilterInput state; 
    Object.keys(tagsFilterContainer).forEach(key => {       // fireEvent.blur(clearTagsFilterButton) does not trigger the event
        if (key.indexOf("reactEventHandlers") > -1) eventHandlers = tagsFilterContainer[key];
    });
    eventHandlers.onBlur();

    expect(tagsFilterInput.value).toEqual("");                                          // search text is reset
    expect(tagsFilterContainer.querySelector(".visible.menu.transition")).toBeFalsy();  // dropdown list is not displayed
    expect(store.getState().objectsUI.tagsFilterInput.inputText).toEqual("");           // input text is reset in the state
    expect(store.getState().objectsUI.tagsFilterInput.matchingIDs).toEqual([]);         // matching IDs are reset in the state
});


async function waitForFetch(store) {
    // wait to fetch to start and end
    await waitFor(() => expect(store.getState().objectsUI.fetch.isFetching).toBeTruthy());
    await waitFor(() => expect(store.getState().objectsUI.fetch.isFetching).toBeFalsy());
}


function getPageObjectIDsFromMock(store) {
    // get object IDs which are returned by mock fetch handler
    const pI = store.getState().objectsUI.paginationInfo;
    return getMockedPageObjectIDs({
        page: pI.currentPage,
        items_per_page: pI.itemsPerPage,
        order_by: pI.sortField,
        sort_order: pI.sortOrder,
        filter_text: pI.filterText,
        object_types: pI.objectTypes,
        tags_filter: pI.tagsFilter
    });
}


function checkObjectsDisplay(store, container) {
    // Check if objects are correctly displayed on the page (proper object IDs and object order)
    let objectIDs = getPageObjectIDsFromMock(store);
    let displayedObjects = queryAllByText(container, "object #", { exact: false });
    expect(objectIDs.length).toEqual(displayedObjects.length);
    for (let i = 0; i < objectIDs.length; i++) {
        expect(displayedObjects[i].textContent.replace(/\D/g, "")).toEqual(objectIDs[i].toString());
    }
}
