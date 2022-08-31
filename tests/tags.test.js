import React from "react";
import { Route } from "react-router-dom";

import { fireEvent } from "@testing-library/react";
import { getByText, getByTitle, waitFor, queryByText, queryAllByText, getByPlaceholderText } from "@testing-library/dom";

import { getMockedPageTagIDs } from "./_mocks/mock-fetch-handlers-tags";
import { getSideMenuItem, getSideMenuDialogControls } from "./_util/ui-common";
import { renderWithWrappers } from "./_util/render";
import { createTestStore } from "./_util/create-test-store";

import Tags from "../src/components/top-level/tags";
import { setTagsPaginationInfo } from "../src/actions/tags";


/*
    /tags page tests.
*/
beforeEach(() => {
    // isolate fetch mock to avoid tests state collision because of cached data in fetch
    jest.isolateModules(() => {
        const { mockFetch, setFetchFail } = require("./_mocks/mock-fetch");
        const { paginationGetComputedStyle } = require("./_mocks/mock-get-computed-style");

        // reset fetch mocks
        jest.resetAllMocks();
        global.fetch = jest.fn(mockFetch);
        global.setFetchFail = jest.fn(setFetchFail);
        global.getComputedStyle = jest.fn(paginationGetComputedStyle);
    });
});


test("Load page with a fetch error", async () => {
    setFetchFail(true);

    // Route component is required for matching (getting :id part of the URL in the Tag component)
    let { container } = renderWithWrappers(<Route exact path="/tags"><Tags /></Route>, {
        route: "/tags"
    });

    // Check if error message if displayed
    await waitFor(() => getByText(container, "Failed to fetch data.", { exact: false }));

    // Check if buttons are not enabled
    let editTagButton = getSideMenuItem(container, "Edit Tag");
    let deleteButton = getSideMenuItem(container, "Delete");
    expect(editTagButton.classList.contains("disabled")).toBeTruthy(); // Semantic UI always adds onClick event to div elements, even if they are disabled (which does nothing in this case)
    // expect(editTagButton.onclick).toBeNull();
    expect(deleteButton.classList.contains("disabled")).toBeTruthy(); // Semantic UI always adds onClick event to div elements, even if they are disabled (which does nothing in this case)
    // expect(deleteButton.onclick).toBeNull();
    

    // Check if pagination is not rendered
    expect(container.querySelector(".field-pagination")).toBeNull();
});


test("Load a page without pagination", async () => {
    let store = createTestStore({ useLocalStorage: false, enableDebugLogging: false });
    store.dispatch(setTagsPaginationInfo({itemsPerPage: 100}))
    
    // Route component is required for matching (getting :id part of the URL in the Tag component)
    let { container } = renderWithWrappers(<Route exact path="/tags"><Tags /></Route>, {
        route: "/tags",
        store: store
    });

    // Wait for the tags to be loaded
    await waitFor(() => getByText(container, "tag #1"));

    // Check if pagination is not rendered
    expect(container.querySelector(".field-pagination")).toBeNull();
});


test("Load page 1 of 5 and click on page 5", async () => {
    let store = createTestStore({ useLocalStorage: false, enableDebugLogging: false });
    store.dispatch(setTagsPaginationInfo({itemsPerPage: 20}))
    
    // Route component is required for matching (getting :id part of the URL in the Tag component)
    let { container } = renderWithWrappers(<Route exact path="/tags"><Tags /></Route>, {
        route: "/tags",
        store: store
    });

    // Check if no pagination is rendered during fetch
    await waitFor(() => expect(
        store.getState().tagsUI.fetch.isFetching === true
        && container.querySelector(".field-pagination") === null
    ).toBeTruthy());

    // Check if tags 1 to 20 are displayed on the page after fetch is complete
    await waitFor(() => getByText(container, "tag #1"));
    getByText(container, "tag #20");
    expect(queryByText(container, "tag #21")).toBeNull();

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
    await waitFor(() => getByText(container, "tag #81"));
    getByText(container, "tag #100");
    expect(queryByText(container, "tag #101")).toBeNull();
});


test("Load page 1 of 10 and check pagination gaps", async () => {
    let store = createTestStore({ useLocalStorage: false });
    store.dispatch(setTagsPaginationInfo({itemsPerPage: 10}));
    
    // Route component is required for matching (getting :id part of the URL in the Tag component)
    let { container } = renderWithWrappers(<Route exact path="/tags"><Tags /></Route>, {
        route: "/tags",
        store: store
    });

    // Wait for the tags to load
    await waitFor(() => getByText(container, "tag #1"));

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
    await waitFor(() => getByText(container, "tag #21"));

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
    await waitFor(() => getByText(container, "tag #41"));

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
    await waitFor(() => getByText(container, "tag #51"));

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
    await waitFor(() => getByText(container, "tag #41"));

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
    await waitFor(() => getByText(container, "tag #91"));

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
    let store = createTestStore({ useLocalStorage: false, enableDebugLogging: false });
    store.dispatch(setTagsPaginationInfo({itemsPerPage: 10}))
    
    // Route component is required for matching (getting :id part of the URL in the Tag component)
    let { container } = renderWithWrappers(<Route exact path="/tags"><Tags /></Route>, {
        route: "/tags",
        store: store
    });

    let addTagButton = getSideMenuItem(container, "Add a New Tag");
    let editTagButton = getSideMenuItem(container, "Edit Tag");
    let deleteTagButton = getSideMenuItem(container, "Delete");

    // Check if buttons can't be clicked during fetch
    await waitFor(() => expect(
        store.getState().tagsUI.fetch.isFetching === true
        && addTagButton.classList.contains("disabled") // Semantic UI always adds onClick event to div elements, even if they are disabled (which does nothing in this case)
        && editTagButton.classList.contains("disabled")
        && deleteTagButton.classList.contains("disabled")
        // && addTagButton.onclick === null
        // && editTagButton.onclick === null
        // && deleteTagButton.onclick === null
    ).toBeTruthy());
});


test("Side menu add tag button", async () => {
    let store = createTestStore({ useLocalStorage: false, enableDebugLogging: false });
    store.dispatch(setTagsPaginationInfo({itemsPerPage: 10}));
    
    // Route component is required for matching (getting :id part of the URL in the Tag component)
    let { container, history } = renderWithWrappers(<Route exact path="/tags"><Tags /></Route>, {
        route: "/tags",
        store: store
    });

    // Wait for the tags to be loaded
    await waitFor(() => getByText(container, "tag #1"));

    // Check if add button click redirects to add tag page
    let addTagButton = getSideMenuItem(container, "Add a New Tag");
    fireEvent.click(addTagButton);
    await waitFor(() => expect(history.entries[history.length - 1].pathname).toBe("/tags/edit/new"));
});


test("Side menu edit tag button", async () => {
    let store = createTestStore({ useLocalStorage: false, enableDebugLogging: false });
    store.dispatch(setTagsPaginationInfo({itemsPerPage: 10}))
    
    // Route component is required for matching (getting :id part of the URL in the Tag component)
    let { container, history } = renderWithWrappers(<Route exact path="/tags"><Tags /></Route>, {
        route: "/tags",
        store: store
    });

    // Wait for the tags to be loaded
    await waitFor(() => getByText(container, "tag #1"));

    // Check if edit tag button is disabled if a single tag is not selected
    let editTagButton = getSideMenuItem(container, "Edit Tag");
    expect(editTagButton.classList.contains("disabled")).toBeTruthy(); // Semantic UI always adds onClick event to div elements, even if they are disabled (which does nothing in this case)
    // expect(editTagButton.onclick).toBeNull();

    // Get tags
    let tags = container.querySelector(".field-item-list").querySelectorAll(".field-item");
    let firstTagCheckbox = tags.item(0).querySelector(".field-item-checkbox");
    let secondTagCheckbox = tags.item(1).querySelector(".field-item-checkbox");

    // Select two tags and check if edit button is disabled
    fireEvent.click(firstTagCheckbox);
    fireEvent.click(secondTagCheckbox);
    await waitFor(() => expect(store.getState().tagsUI.selectedTagIDs).toEqual(expect.arrayContaining([1, 2])));
    fireEvent.click(editTagButton);     // editTagButton.onclick is not null after handler is added, although the button is not clickable, so checking onclick prop on being null is not viable
    expect(history.entries[history.length - 1].pathname).toBe("/tags");

    // Deselect a tag, click edit tag button and check if it redirected to /tags/edit/:id
    fireEvent.click(secondTagCheckbox);
    await waitFor(() => expect(store.getState().tagsUI.selectedTagIDs).toEqual(expect.arrayContaining([1])));
    editTagButton = getSideMenuItem(container, "Edit Tag");   // get the element again to properly click it
    fireEvent.click(editTagButton);
    await waitFor(() => expect(history.entries[history.length - 1].pathname).toBe("/tags/edit/1"));
});


test("Side menu delete button", async () => {
    let store = createTestStore({ useLocalStorage: false, enableDebugLogging: false });
    store.dispatch(setTagsPaginationInfo({itemsPerPage: 10}))
    
    // Route component is required for matching (getting :id part of the URL in the Tag component)
    let { container } = renderWithWrappers(<Route exact path="/tags"><Tags /></Route>, {
        route: "/tags",
        store: store
    });

    // Wait for the tags to be loaded
    await waitFor(() => getByText(container, "tag #1"));

    // Check if edit tag button is disabled if a single tag is not selected
    let deleteButton = getSideMenuItem(container, "Delete");
    expect(deleteButton.classList.contains("disabled")).toBeTruthy(); // Semantic UI always adds onClick event to div elements, even if they are disabled (which does nothing in this case)
    // expect(deleteButton.onclick).toBeNull();

    // Select two tags
    let mainTagField = container.querySelector(".field-item-list");
    let tags = mainTagField.querySelectorAll(".field-item");
    let firstTagCheckbox = tags.item(0).querySelector(".field-item-checkbox");
    let secondTagCheckbox = tags.item(1).querySelector(".field-item-checkbox");
    fireEvent.click(firstTagCheckbox);
    fireEvent.click(secondTagCheckbox);

    // Click delete button and check if a confirmation dialog appeared
    expect(deleteButton.onclick).toBeTruthy();
    fireEvent.click(deleteButton);

    // Click "No" button and check if dialog was closed
    expect(getSideMenuDialogControls(container).header.title).toEqual("Delete Selected Tags?");
    fireEvent.click(getSideMenuDialogControls(container).buttons["No"]);
    expect(getSideMenuDialogControls(container)).toBeNull();
    getByText(mainTagField, "tag #1");

    // Delete selected tags
    deleteButton = getSideMenuItem(container, "Delete");
    fireEvent.click(deleteButton);
    fireEvent.click(getSideMenuDialogControls(container).buttons["Yes"]);

    // Check if deleted tags were removed from the state and the page
    await waitFor(() => expect(Object.keys(store.getState().tags)).toEqual(expect.not.arrayContaining(["1", "2"])));
    expect(queryByText(container, "tag #1")).toBeNull();
    expect(queryByText(container, "tag #2")).toBeNull();
});


test("Field menu, select + deselect", async () => {
    let store = createTestStore({ useLocalStorage: false, enableDebugLogging: false });
    store.dispatch(setTagsPaginationInfo({itemsPerPage: 10}))
    
    // Route component is required for matching (getting :id part of the URL in the Tag component)
    let { container } = renderWithWrappers(<Route exact path="/tags"><Tags /></Route>, {
        route: "/tags",
        store: store
    });

    // Wait for the tags to be loaded
    await waitFor(() => getByText(container, "tag #1"));

    // Select all tags and check if they were displayed on the page
    let selectAllButton = getByTitle(container, "Select all tags on page");
    fireEvent.click(selectAllButton);
    for (let i = 1; i <= 10; i++) {
        expect(queryAllByText(container, `tag #${i}`).length).toEqual(2);
    }

    // Deselect all tags
    let deselectAllButton = getByTitle(container, "Deselect all tags");
    fireEvent.click(deselectAllButton);
    for (let i = 1; i <= 10; i++) {
        expect(queryAllByText(container, `tag #${i}`).length).toEqual(1);
    }
});


test("Field menu, sort buttons", async () => {
    let store = createTestStore({ useLocalStorage: false, enableDebugLogging: false });
    const tagsPerPage = 10;
    store.dispatch(setTagsPaginationInfo({itemsPerPage: tagsPerPage}))
    
    // Route component is required for matching (getting :id part of the URL in the Tag component)
    let { container } = renderWithWrappers(<Route exact path="/tags"><Tags /></Route>, {
        route: "/tags",
        store: store
    });

    // Wait for the tags to be loaded
    await waitFor(() => getByText(container, "tag #1"));
    let sortByNameButton = getByTitle(container, "Sort by tag name");
    let sortByTimeButton = getByTitle(container, "Sort by modify time");
    let sortAscButton = getByTitle(container, "Sort in ascending order");
    let sortDescButton = getByTitle(container, "Sort in descending order");

    // Sort by tag name desc and check if tags are correctly displayed
    fireEvent.click(sortDescButton);
    await waitForFetch(store);
    checkTagsDisplay(store, container);

    // Sort by modify time desc and check if tags are correctly displayed
    fireEvent.click(sortByTimeButton);
    await waitForFetch(store);
    checkTagsDisplay(store, container);

    // Sort by modify time asc and check if tags are correctly displayed
    fireEvent.click(sortAscButton);
    await waitForFetch(store);
    checkTagsDisplay(store, container);

    // Sort by modify tag name asc and check if tags are correctly displayed
    fireEvent.click(sortByNameButton);
    await waitForFetch(store);
    checkTagsDisplay(store, container);
});


test("Field menu, tag filter", async () => {
    let store = createTestStore({ useLocalStorage: false, enableDebugLogging: false });
    store.dispatch(setTagsPaginationInfo({itemsPerPage: 10}))
    
    // Route component is required for matching (getting :id part of the URL in the Tag component)
    let { container } = renderWithWrappers(<Route exact path="/tags"><Tags /></Route>, {
        route: "/tags",
        store: store
    });

    // Wait for the tags to be loaded
    await waitFor(() => getByText(container, "tag #1"));

    // Filter with matching tags and check if they are correctly displayed
    // let tagFilterInput = container.querySelector(".field-menu-filter").querySelector("input");
    let tagFilterInput = getByPlaceholderText(container, "Filter tags");
    expect(tagFilterInput).toBeTruthy();
    fireEvent.change(tagFilterInput, { target: { value: "some text" } });
    await waitForFetch(store);
    checkTagsDisplay(store, container);

    // Filter with no matching tags and check if error message is displayed
    fireEvent.change(tagFilterInput, { target: { value: "no match" } });
    await waitFor(() => getByText(container, "No tags found.", { exact: false }));
});


async function waitForFetch(store) {
    // wait to fetch to start and end
    await waitFor(() => expect(store.getState().tagsUI.fetch.isFetching).toBeTruthy());
    await waitFor(() => expect(store.getState().tagsUI.fetch.isFetching).toBeFalsy());
}


function getPageTagIDsFromMock(store) {
    // get tag IDs which are returned by mock fetch handler
    const pI = store.getState().tagsUI.paginationInfo;
    return getMockedPageTagIDs({
        page: pI.currentPage,
        items_per_page: pI.itemsPerPage,
        order_by: pI.sortField,
        sort_order: pI.sortOrder,
        filter_text: pI.filterText
    });
}


function checkTagsDisplay(store, container, tagsPerPage = 10) {
    // Check if tags are correctly displayed on the page (proper tag IDs and tag order)
    let tagIDs = getPageTagIDsFromMock(store);
    let displayedTags = queryAllByText(container, "tag #", { exact: false });
    expect(displayedTags.length).toEqual(tagsPerPage);
    expect(tagIDs.length).toEqual(displayedTags.length);
    for (let i = 0; i < tagIDs.length; i++) {
        expect(displayedTags[i].textContent.replace(/\D/g, "")).toEqual(tagIDs[i].toString());
    }
}
