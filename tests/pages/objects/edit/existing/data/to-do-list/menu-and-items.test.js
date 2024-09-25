import React from "react";

import { fireEvent } from "@testing-library/react";
import { getByText, getByPlaceholderText, waitFor, getByTitle, queryByPlaceholderText, queryByTitle } from "@testing-library/dom";

import { resetTestConfig } from "../../../../../../_mocks/config";
import { getDefaultSortOrder, getRenderedItemIndent, checkRenderedItemsOrder } from "../../../../../../_util/to-do-lists";
import { renderWithWrappers } from "../../../../../../_util/render";
import { getCurrentObject, clickDataTabButton } from "../../../../../../_util/ui-objects-edit";
import { TDLItemStates, getNewTDLItemState, defaultTDL, expectedSortTestTDLStateSortOrder } from "../../../../../../_mocks/data-to-do-lists";

import { App } from "../../../../../../../src/components/app";


/*
    To-do list editing tests, menu and new & existing items.

    NOTE: some functionality is tested in /objects/edit/new tests.
*/
beforeEach(() => {
    // isolate fetch mock to avoid tests state collision because of cached data in fetch
    jest.isolateModules(() => {
        const { mockFetch, setFetchFail } = require("../../../../../../_mocks/mock-fetch");
        
        // Set test app configuration
        resetTestConfig();
        
        // reset fetch mocks
        jest.resetAllMocks();
        global.fetch = jest.fn(mockFetch);
        global.setFetchFail = jest.fn(setFetchFail);
    });
});


test("Load an existing to-do list", async () => {
    let { container, store } = renderWithWrappers(<App />, {
        route: "/objects/edit/2001"
    });

    // Check if object information is displayed on the page
    await waitFor(() => getByText(container, "Object Information"));
    clickDataTabButton(container);
    const TDLContainer = container.querySelector(".to-do-list-container");
    expect(TDLContainer).toBeTruthy();

    // Check new item input
    getByPlaceholderText(TDLContainer, "New item");
    
    // Check existing items (text and state)
    const items = TDLContainer.querySelectorAll(".to-do-list-item");
    expect(items.length).toEqual(Object.keys(getCurrentObject(store.getState()).toDoList.items).length + 1);   // items + new item input
    expect(items.length).toEqual(defaultTDL.items.length + 1);

    const itemOrder = getDefaultSortOrder(getCurrentObject(store.getState()).toDoList);
    items.forEach(async item => {
        if (!queryByPlaceholderText(item, "New item")) {    // skip new item input
            const id = parseInt(item.querySelector(".to-do-list-item-id").textContent);
            const itemData = getCurrentObject(store.getState()).toDoList.items[id];
            const nextID = itemOrder[itemOrder.indexOf(id) + 1];
            const hasChildren = nextID !== undefined && itemData.indent < getCurrentObject(store.getState()).toDoList.items[nextID].indent;

            // text & state
            getByText(item, itemData.item_text);
            const leftMenu = item.querySelector(".to-do-list-left-menu");
            getByTitle(leftMenu, getNewTDLItemState(itemData.item_state), { exact: false });

            // delete & delete all buttons
            const rightMenu = item.querySelector(".to-do-list-right-menu");
            expect(queryByTitle(rightMenu, "Delete item")).toBeFalsy();  // not rendered by default
            expect(queryByTitle(rightMenu, "Delete item and its children")).toBeFalsy();
            
            fireEvent.mouseEnter(item);
            getByTitle(rightMenu, "Delete item");   // rendered when item is hovered
            if (hasChildren) getByTitle(rightMenu, "Delete item and its children");     // delete all is only rendered for items with children
            else expect(queryByTitle(rightMenu, "Delete item and its children")).toBeFalsy();
            
            fireEvent.mouseLeave(item);
            expect(queryByTitle(rightMenu, "Delete item")).toBeFalsy();  // not rendered after item stops being hovered
            expect(queryByTitle(rightMenu, "Delete item and its children")).toBeFalsy();

            const input = item.querySelector(".to-do-list-item-input");
            fireEvent.focus(input);
            getByTitle(rightMenu, "Delete item");   // rendered when item input is focused
            if (hasChildren) getByTitle(rightMenu, "Delete item and its children");     // delete all is only rendered for items with children
            else expect(queryByTitle(rightMenu, "Delete item and its children")).toBeFalsy();
            
            fireEvent.blur(input);
            expect(queryByTitle(rightMenu, "Delete item")).toBeFalsy();  // not rendered after focus is removed from input
            expect(queryByTitle(rightMenu, "Delete item and its children")).toBeFalsy();

            // expand/collapse button
            if (hasChildren) getByTitle(leftMenu, "Collapse item");
        }
    });
});


test("Delete with children button", async () => {
    let { container, store } = renderWithWrappers(<App />, {
        route: "/objects/edit/2001"
    });

    // Check if object information is displayed on the page
    await waitFor(() => getByText(container, "Object Information"));
    clickDataTabButton(container);
    const TDLContainer = container.querySelector(".to-do-list-container");
    expect(TDLContainer).toBeTruthy();
    const itemOrder = getDefaultSortOrder(getCurrentObject(store.getState()).toDoList);
    
    // Select item with children and delete them
    const firstItem = TDLContainer.querySelectorAll(".to-do-list-item")[0];
    expect(firstItem).toBeTruthy();
    fireEvent.mouseEnter(firstItem);
    const deleteWithChildrenButton = getByTitle(firstItem.querySelector(".to-do-list-right-menu"), "Delete item and its children");
    fireEvent.click(deleteWithChildrenButton);

    // Check if first item was deleted with its children
    const newItemOrder = itemOrder.slice(4);    // 0 was a parent, 1-3 - children
    const newItems = TDLContainer.querySelectorAll(".to-do-list-item");
    expect(newItems.length).toEqual(itemOrder.length - 4 + 1);
    newItemOrder.forEach((id, index) => {
        if (index === newItemOrder.length - 1) return;
        const itemID = newItems[index].querySelector(".to-do-list-item-id").textContent;
        expect(parseInt(itemID)).toEqual(id);
    });
});


test("Change item states", async () => {
    let { container, store } = renderWithWrappers(<App />, {
        route: "/objects/edit/2001"
    });

    // Check if object information is displayed on the page
    await waitFor(() => getByText(container, "Object Information"));
    clickDataTabButton(container);
    const TDLContainer = container.querySelector(".to-do-list-container");
    expect(TDLContainer).toBeTruthy();

    const item = getByText(TDLContainer, "item 0").parentNode;

    for (let i = 0; i < TDLItemStates.length; i++) {
        const currentState = getCurrentObject(store.getState()).toDoList.items[0].item_state;
        const nextState = getNewTDLItemState(currentState);
        
        expect(currentState).toEqual(TDLItemStates[i]);
        const stateButton = getByTitle(item, `Set item as ${nextState}`);
        
        fireEvent.click(stateButton);
        expect(getCurrentObject(store.getState()).toDoList.items[0].item_state).toEqual(nextState);
    }
});


test("Change item sort", async () => {
    let { container, store } = renderWithWrappers(<App />, {
        route: "/objects/edit/2908"
    });

    // Check if object information is displayed on the page
    await waitFor(() => getByText(container, "Object Information"));
    clickDataTabButton(container);
    const TDLContainer = container.querySelector(".to-do-list-container");
    expect(TDLContainer).toBeTruthy();
    expect(getCurrentObject(store.getState()).toDoList.sort_type).toEqual("default");
    const defaultSortButton = getByTitle(TDLContainer.querySelector(".to-do-list-menu"), "Default sort");
    const sortByStateButton = getByTitle(TDLContainer.querySelector(".to-do-list-menu"), "Sort by state");

    const defaultItemOrder = getDefaultSortOrder(getCurrentObject(store.getState()).toDoList);

    // Sort by state and check order in which items are displayed
    // Also check if item indenation is correctly rendered
    fireEvent.click(sortByStateButton);
    TDLContainer.querySelectorAll(".to-do-list-item").forEach((item, index) => {
        if (!queryByPlaceholderText(item, "New item")) {
            const expectedID = expectedSortTestTDLStateSortOrder[index];
            getByText(item, getCurrentObject(store.getState()).toDoList.items[expectedID].item_text);
            expect(getRenderedItemIndent(item)).toEqual(getCurrentObject(store.getState()).toDoList.items[expectedID].indent);
        }
    });

    // Sort in default order and check order in which items are displayed
    // Also check if item indenation is correctly rendered
    fireEvent.click(defaultSortButton);
    TDLContainer.querySelectorAll(".to-do-list-item").forEach((item, index) => {
        if (!queryByPlaceholderText(item, "New item")) {
            const expectedID = defaultItemOrder[index];
            getByText(item, getCurrentObject(store.getState()).toDoList.items[expectedID].item_text);
            expect(getRenderedItemIndent(item)).toEqual(getCurrentObject(store.getState()).toDoList.items[expectedID].indent);
        }
    });
});


test("Expand/collapse button", async () => {
    let { container, store } = renderWithWrappers(<App />, {
        route: "/objects/edit/2001"
    });

    // Check if object information is displayed on the page
    await waitFor(() => getByText(container, "Object Information"));
    clickDataTabButton(container);
    const TDLContainer = container.querySelector(".to-do-list-container");
    expect(TDLContainer).toBeTruthy();

    // Collapse first item
    let items = TDLContainer.querySelectorAll(".to-do-list-item-container");
    const expandCollapseButton = getByTitle(items[0], "Collapse item");
    fireEvent.click(expandCollapseButton);

    // Check if first item is collapsed and its children are not displayed
    expect(getCurrentObject(store.getState()).toDoList.items[0].is_expanded).toBeFalsy();
    checkRenderedItemsOrder(TDLContainer, [0, 4, 5, 6, 7]);

    // Expand first item
    fireEvent.click(expandCollapseButton);

    // Check if first item is expanded and its children are not displayed
    expect(getCurrentObject(store.getState()).toDoList.items[0].is_expanded).toBeTruthy();
    checkRenderedItemsOrder(TDLContainer, [0, 1, 2, 3, 4, 5, 6, 7]);

    // Sort by state
    const sortByStateButton = getByTitle(TDLContainer.querySelector(".to-do-list-menu"), "Sort by state");
    fireEvent.click(sortByStateButton);
    expect(getCurrentObject(store.getState()).toDoList.sort_type).toEqual("state");

    // Collapse first item
    fireEvent.click(expandCollapseButton);

    // Check if first item is collapsed and its children are not displayed
    expect(getCurrentObject(store.getState()).toDoList.items[0].is_expanded).toBeFalsy();
    checkRenderedItemsOrder(TDLContainer, [0, 4, 5, 6, 7]);     // default and state sort order are the same in default TDL mock

    // Expand first item
    fireEvent.click(expandCollapseButton);

    // Check if first item is expanded and its children are not displayed
    expect(getCurrentObject(store.getState()).toDoList.items[0].is_expanded).toBeTruthy();
    checkRenderedItemsOrder(TDLContainer, [0, 1, 2, 3, 4, 5, 6, 7]);
});


test("Item input indenation", async () => {
    let { container } = renderWithWrappers(<App />, {
        route: "/objects/edit/2915"
    });

    // Check if object information is displayed on the page
    await waitFor(() => getByText(container, "Object Information"));
    clickDataTabButton(container);
    const TDLContainer = container.querySelector(".to-do-list-container");
    expect(TDLContainer).toBeTruthy();

    // Check if first item's indent can't be > 0
    let item = getByText(TDLContainer, "item 0");
    fireEvent.keyDown(item, { key: "Tab", code: "Tab" });
    expect(getRenderedItemIndent(item.parentNode)).toEqual(0);

    // Check if item's indent can't be > prev item's indent + 1 (and 5)
    for (let i = 2; i < 7; i++) {
        item = getByText(TDLContainer, `item ${i}`);
        fireEvent.keyDown(item, { key: "Tab", code: "Tab" });
        expect(getRenderedItemIndent(item.parentNode)).toEqual(Math.min(i - 1, 5));
    }

    // Check if children indent is increased when their parents' indent does
    item = getByText(TDLContainer, "item 1");
    fireEvent.keyDown(item, { key: "Tab", code: "Tab" });
    for (let i = 1; i < 7; i++) {
        item = getByText(TDLContainer, `item ${i}`);
        expect(getRenderedItemIndent(item.parentNode)).toEqual(Math.min(i, 5));
    }

    // Check if non-child items are not affected by indent increase
    for (let i of [0, 7]) {
        item = getByText(TDLContainer, `item ${i}`);
        expect(getRenderedItemIndent(item.parentNode)).toEqual(0);
    }

    // Check if children indent is decreased when their parents' indent does
    item = getByText(TDLContainer, "item 1");
    fireEvent.keyDown(item, { key: "Tab", code: "Tab", shiftKey: true });
    for (let i = 1; i < 7; i++) {
        item = getByText(TDLContainer, `item ${i}`);
        expect(getRenderedItemIndent(item.parentNode)).toEqual(Math.min(i - 1, 4));
    }

    // Check if non-child items are not affected by indent decrease
    for (let i of [0, 7]) {
        item = getByText(TDLContainer, `item ${i}`);
        expect(getRenderedItemIndent(item.parentNode)).toEqual(0);
    }

    // Check if item's indent can't be increased when sorting by state
    const sortByStateButton = getByTitle(TDLContainer.querySelector(".to-do-list-menu"), "Sort by state");
    fireEvent.click(sortByStateButton);
    
    item = getByText(TDLContainer, "item 1");
    fireEvent.keyDown(item, { key: "Tab", code: "Tab" });
    for (let i = 1; i < 7; i++) {
        item = getByText(TDLContainer, `item ${i}`);
        expect(getRenderedItemIndent(item.parentNode)).toEqual(Math.min(i - 1, 4));
    }

    // Check if item's indent can't be increased when sorting by state
    item = getByText(TDLContainer, "item 2");
    fireEvent.keyDown(item, { key: "Tab", code: "Tab", shiftKey: true });
    for (let i = 2; i < 7; i++) {
        item = getByText(TDLContainer, `item ${i}`);
        expect(getRenderedItemIndent(item.parentNode)).toEqual(Math.min(i - 1, 4));
    }
});


describe("Commentaries", () => {
    /* (*)
        Firing events on comment button results in throwing warning messages about unproper event firing for the underlying Popper.js library.
        
        Fixing this warning requires using React's act() function to await the event handling and component state updates, but awaiting the event handlers also
        results in overwriting container with an empty <div>.

        To suppress warnings, commentary testing is moved into a separate block where console.error() is mocked with an emptry function.
    */
    beforeEach(() => {
        global.mockedConsoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        global.mockedConsoleError.mockRestore();
    });

    test("Load an existing to-do list (check commentaries)", async () => {
        /* (*)
            Not checking if comment input is displayed on comment button mouseEnter, because it does not trigger the displayed in test env (onClick is used instead).
        */
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/edit/2001"
        });

        // Check if object information is displayed on the page
        await waitFor(() => getByText(container, "Object Information"));
        clickDataTabButton(container);
        const TDLContainer = container.querySelector(".to-do-list-container");
        expect(TDLContainer).toBeTruthy();
        
        // Check existing items
        TDLContainer.querySelectorAll(".to-do-list-item").forEach(async item => {
            if (!queryByPlaceholderText(item, "New item")) {    // skip new item input
                const id = item.querySelector(".to-do-list-item-id").textContent;
                const itemData = getCurrentObject(store.getState()).toDoList.items[id];
                
                // Comment button display logic
                const rightMenu = item.querySelector(".to-do-list-right-menu");
                if (itemData.commentary.length > 0) {
                    getByTitle(rightMenu, "Item comment");   // always rendered if comment is not empty
                } else {
                    expect(queryByTitle(rightMenu, "Item comment")).toBeFalsy();  // not rendered by default
                    fireEvent.mouseEnter(item);
                    getByTitle(rightMenu, "Item comment");   // rendered when item is hovered
                    fireEvent.mouseLeave(item);
                    expect(queryByTitle(rightMenu, "Item comment")).toBeFalsy();  // not rendered after item stops being hovered
                    const input = item.querySelector(".to-do-list-item-input");
                    fireEvent.focus(input);
                    getByTitle(rightMenu, "Item comment");   // rendered when item input is focused
                    fireEvent.blur(input);
                    expect(queryByTitle(rightMenu, "Item comment")).toBeFalsy();  // not rendered after focus is removed from input
                }

                // Comment input & text display
                fireEvent.mouseEnter(item);
                fireEvent.click(getByTitle(rightMenu, "Item comment"));  // mouseEnter does not force the popup to appear
                getByText(container.parentNode.querySelector(".to-do-list-item-comment-input"), itemData.commentary);       // item input appear on click
                                                                                                                            // (comment input is added as a child of <body> tag)
                fireEvent.mouseEnter(container.parentNode.querySelector(".to-do-list-item-comment-input"));
                getByText(container.parentNode.querySelector(".to-do-list-item-comment-input"), itemData.commentary);
            }
        });
    });


    test("Commentary updating", async () => {
        /* (*)
            Not checking if comment input is displayed on comment button mouseEnter, because it does not trigger the displayed in test env (onClick is used instead).
        */
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/edit/2001"
        });
    
        // Check if object information is displayed on the page
        await waitFor(() => getByText(container, "Object Information"));
        clickDataTabButton(container);
        const TDLContainer = container.querySelector(".to-do-list-container");
        expect(TDLContainer).toBeTruthy();

        // Open comment input & update comment
        const item = getByText(TDLContainer, "item 0").parentNode;
        const rightMenu = item.querySelector(".to-do-list-right-menu");
        let commentButton = getByTitle(rightMenu, "Item comment");
        fireEvent.click(commentButton);
        let commentInput = getByText(container.parentNode.querySelector(".to-do-list-item-comment-input"), getCurrentObject(store.getState()).toDoList.items[0].commentary);
        fireEvent.input(commentInput, { target: { innerHTML: "updated comment" }});
        expect(getCurrentObject(store.getState()).toDoList.items[0].commentary).toEqual("updated comment");

        // Close and open input & check if input value remains equal to updated text
        fireEvent.click(commentButton);
        expect(container.parentNode.querySelector(".to-do-list-item-comment-input")).toBeNull();
        fireEvent.click(commentButton);
        getByText(container.parentNode.querySelector(".to-do-list-item-comment-input"), "updated comment");
    });
});
