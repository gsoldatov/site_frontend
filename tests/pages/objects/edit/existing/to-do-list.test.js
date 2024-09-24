import React from "react";

import { fireEvent } from "@testing-library/react";
import { getByText, getByPlaceholderText, waitFor, getByTitle, queryByPlaceholderText, queryByTitle, queryByText } from "@testing-library/dom";

import { resetTestConfig } from "../../../../_mocks/config";
import { compareItemData, getDefaultSortOrder, getRenderedItemIndent, checkRenderedItemsOrder } from "../../../../_util/to-do-lists";
import { renderWithWrappers } from "../../../../_util/render";
import { getCurrentObject, clickDataTabButton } from "../../../../_util/ui-objects-edit";
import { TDLItemStates, getNewTDLItemState, defaultTDL, expectedSortTestTDLStateSortOrder, expectedUpDownTDLItemOrder, enterKeyDownDefaultSortTDL } from "../../../../_mocks/data-to-do-lists";

import { App } from "../../../../../src/components/top-level/app";
import * as caret from "../../../../../src/util/caret";


/*
    To-do list editing tests.

    NOTE: some test cases are placed in ../new dir.
*/
beforeEach(() => {
    // isolate fetch mock to avoid tests state collision because of cached data in fetch
    jest.isolateModules(() => {
        const { mockFetch, setFetchFail } = require("../../../../_mocks/mock-fetch");
        
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


describe("Keybinds (default sort)", () => {
    beforeEach(() => {
        // Mock caret.getSplitText function to enable mergeWithNext/mergeWithPrev testing (if not mocked, delete command is issued instead)
        global.getSplitText = jest.spyOn(caret, "getSplitText").mockImplementation(element => ({ before: "", after: "" }));
    });

    afterEach(() => {
        global.getSplitText.mockRestore();
    });

    test("Up/down", async () => {
        /* (*)
            Not checking caret position update, because it's set to 0 in test env and is not updated by input & keyDown event.
            Test should also check all cases for position updating when moving down/up (beginning, middle, end).
        */
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/edit/2909"
        });
    
        // Check if object information is displayed on the page
        await waitFor(() => getByText(container, "Object Information"));
        clickDataTabButton(container);
        const TDLContainer = container.querySelector(".to-do-list-container");
        expect(TDLContainer).toBeTruthy();
        const itemOrder = expectedUpDownTDLItemOrder;    // default item order without children of collapsed items
        
        // Select first element
        let itemInput = getByText(TDLContainer, getCurrentObject(store.getState()).toDoList.items[itemOrder[0]].item_text);
        fireEvent.focus(itemInput);

        // Move down the list (and check if children of collapsed items are ignored)
        let n = 0;
        while (n < itemOrder.length - 1) {
            fireEvent.keyDown(itemInput, { key: "ArrowDown", code: "ArrowDown" });
            n++;
            itemInput = getByText(TDLContainer, getCurrentObject(store.getState()).toDoList.items[itemOrder[n]].item_text);
            expect(document.activeElement).toEqual(itemInput);
        }

        // Move down to new item input
        fireEvent.keyDown(itemInput, { key: "ArrowDown", code: "ArrowDown" });
        itemInput = getByPlaceholderText(TDLContainer, "New item");
        expect(document.activeElement).toEqual(itemInput);

        // Move up to the last item
        fireEvent.keyDown(itemInput, { key: "ArrowUp", code: "ArrowUp" });
        itemInput = getByText(TDLContainer, getCurrentObject(store.getState()).toDoList.items[itemOrder[n]].item_text);
        expect(document.activeElement).toEqual(itemInput);

        // Move up the list (and check if children of collapsed items are ignored)
        while (n > 0) {
            fireEvent.keyDown(itemInput, { key: "ArrowUp", code: "ArrowUp" });
            n--;
            itemInput = getByText(TDLContainer, getCurrentObject(store.getState()).toDoList.items[itemOrder[n]].item_text);
            expect(document.activeElement).toEqual(itemInput);
        }

        // Move up from the first item (first item is still focused)
        fireEvent.keyDown(itemInput, { key: "ArrowUp", code: "ArrowUp" });
        itemInput = getByText(TDLContainer, getCurrentObject(store.getState()).toDoList.items[itemOrder[0]].item_text);
        expect(document.activeElement).toEqual(itemInput);
    });


    test("Enter", async () => {
        /* (*)
            In testing environment, caret position is set to 0 and is not changed by KeyDown events => split is checked for the case when full item text is moved into the second item.
            Test should also check if item text is correctly split when caret position != 0.
        */
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/edit/2901"
        });
    
        // Check if object information is displayed on the page
        await waitFor(() => getByText(container, "Object Information"));
        clickDataTabButton(container);
        const TDLContainer = container.querySelector(".to-do-list-container");
        expect(TDLContainer).toBeTruthy();

        // Get initial values
        let items = TDLContainer.querySelectorAll(".to-do-list-item");
        expect(items.length).toEqual(enterKeyDownDefaultSortTDL.items.length + 1);  // 6 items + new item input
        let firstItemData = {...getCurrentObject(store.getState()).toDoList.items[1]};     // get item 1 and 2 data
        let secondItemData = {...getCurrentObject(store.getState()).toDoList.items[2]};
        
        // Focus item 1 and split it
        let firstItemInput = items[1].querySelector(".to-do-list-item-input");
        fireEvent.focus(firstItemInput);
        fireEvent.keyDown(firstItemInput, { key: "Enter", code: "Enter" });

        // Check if state was correctly updated
        let newItemsData = getCurrentObject(store.getState()).toDoList.items;
        expect(compareItemData(newItemsData[6], {...firstItemData, item_text: ""})).toBeTruthy();   // new first item has no text, but has the same state, indent and comment as the old one
        expect(compareItemData( newItemsData[7], firstItemData ));                                  // new second item has the same text, state, indent and comment as the old one
        expect(compareItemData( newItemsData[2], secondItemData ));                                 // second item of the list was not changed
        
        // Check if items are displayed in correct order
        let newItems = TDLContainer.querySelectorAll(".to-do-list-item");
        expect(newItems.length).toEqual(enterKeyDownDefaultSortTDL.items.length + 1 + 1);  // 6 items + added with split item + new item input
        expect(newItems[0].querySelector(".to-do-list-item-id").textContent).toEqual("0");
        expect(newItems[1].querySelector(".to-do-list-item-id").textContent).toEqual("6");
        expect(newItems[2].querySelector(".to-do-list-item-id").textContent).toEqual("7");
        expect(newItems[3].querySelector(".to-do-list-item-id").textContent).toEqual("2");

        // Input of the second new item is focused
        expect(document.activeElement).toEqual(newItems[2].querySelector(".to-do-list-item-input"));
    });


    test("Delete", async () => {
        /* (*)
            In testing environment, caret position is set to 0 and is not changed by KeyDown events => items merge on delete keypress is checked for the case when item text length = 0.
            Delete keypress does not update the text in contenteditable in test env.

            Test should also check:
                - if text is correctly deleted when caret position is not at the end of item text;
                - if delete correctly merges 2 non-empty item texts;
                - delete keypress does nothing when caret is at the end of the last item (for default and state sort).
        */
        // Mock getSplitText function from src\util\caret.js (getElementCaretPosition doesn't work in test env => a mock is required to properly trigger merge command)
        


        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/edit/2902"
        });

        // Check if object information is displayed on the page
        await waitFor(() => getByText(container, "Object Information"));
        clickDataTabButton(container);
        const TDLContainer = container.querySelector(".to-do-list-container");
        expect(TDLContainer).toBeTruthy();

        // Increase new item input indent
        const newItemInput = getByPlaceholderText(TDLContainer, "New item");
        fireEvent.focus(newItemInput);
        for (let i = 0; i < 4; i++) fireEvent.keyDown(newItemInput, { key: "Tab", code: "Tab" });
        expect(getRenderedItemIndent(newItemInput.parentNode)).toEqual(4);

        // Get initial state
        const firstItemData = {...getCurrentObject(store.getState()).toDoList.items[1]};
        const secondItemData = {...getCurrentObject(store.getState()).toDoList.items[2]};
        
        // // Delete a character in a non-empty item (*) SET ITEM TEXT TO 1 CHAR LONG IN MOCK   // delete keypress does not update the textContent of the input in testing environment
        // let firstItemInput = getByText(TDLContainer, getCurrentObject(store.getState()).toDoList.items[1].item_text);
        // screen.debug(firstItemInput)
        // fireEvent.keyDown(firstItemInput, { key: "Delete", code: "Delete" });
        // expect(getCurrentObject(store.getState()).toDoList.items[1].item_text).toEqual("");        // initial text is 1 char long
        // expect(Object.keys(getCurrentObject(store.getState()).toDoList.items).length).toEqual(2);  // no items were deleted

        // Merge empty item with another
        const firstItemInput = getByText(TDLContainer, getCurrentObject(store.getState()).toDoList.items[1].item_text);
        fireEvent.input(firstItemInput, { target: { innerHTML: "" }});     // set empty text
        fireEvent.keyDown(firstItemInput, { key: "Delete", code: "Delete" });

        // Check if state was correctly updated
        expect(Object.keys(getCurrentObject(store.getState()).toDoList.items).length).toEqual(3);      // one less item in the state
        expect(compareItemData( getCurrentObject(store.getState()).toDoList.items[4], 
            {...firstItemData, item_text: secondItemData.item_text} ));    // new item has merged text ("" + second) and keeps the state, indent and comment of the first old item

        // New item is displayed and focused
        const newItems = TDLContainer.querySelectorAll(".to-do-list-item");
        expect(newItems.length).toEqual(4);     // 3 items + new item input
        const itemInput = getByText(newItems[1], secondItemData.item_text);
        expect(document.activeElement).toEqual(itemInput);

        // Check if indent of second item's child was reduced from 3 to 2
        expect(getRenderedItemIndent(newItems[2])).toEqual(2);

        // Check new item input's indent was reduced from 4 to 3
        expect(getRenderedItemIndent(newItems[3])).toEqual(3);
    });


    test("Backspace", async () => {
        /* (*)
            In testing environment, caret position is set to 0 and is not changed by KeyDown events.

            Test should also check:
                - if backspace keypress correctly removes a character when caret position is not at the beginning of item input;
                - if two non-empty item texts are correctly merged;
                - backspace keypress does nothing when caret is at the beginning of the first item (for default and state sort).
        */
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/edit/2903"
        });

        // Check if object information is displayed on the page
        await waitFor(() => getByText(container, "Object Information"));
        clickDataTabButton(container);
        const TDLContainer = container.querySelector(".to-do-list-container");
        expect(TDLContainer).toBeTruthy();

         // Increase new item input indent
         const newItemInput = getByPlaceholderText(TDLContainer, "New item");
         fireEvent.focus(newItemInput);
         for (let i = 0; i < 4; i++) fireEvent.keyDown(newItemInput, { key: "Tab", code: "Tab" });
         expect(getRenderedItemIndent(newItemInput.parentNode)).toEqual(4);
        
        ///////////////////////// Merge 2 parents of the last item /////////////////////////
        // Get initial state
        let firstItemData = {...getCurrentObject(store.getState()).toDoList.items[3]};
        let secondItemData = {...getCurrentObject(store.getState()).toDoList.items[4]};

        // Select the second item and press backspace
        let secondItemInput = getByText(TDLContainer, getCurrentObject(store.getState()).toDoList.items[4].item_text);
        fireEvent.keyDown(secondItemInput, { key: "Backspace", code: "Backspace" });

        // Check if state was correctly updated
        expect(Object.keys(getCurrentObject(store.getState()).toDoList.items).length).toEqual(5);      // one less item in the state
        expect(compareItemData( getCurrentObject(store.getState()).toDoList.items[6], 
            {...firstItemData, item_text: firstItemData.item_text + secondItemData.item_text} ));    // new item has merged text and keeps the state and comment of the first old item

        // New item is displayed and focused
        const newItems = TDLContainer.querySelectorAll(".to-do-list-item");
        expect(newItems.length).toEqual(5);     // 5 items - 1 hidden child (id = 1) + new item input
        const itemInput = getByText(newItems[2], firstItemData.item_text + secondItemData.item_text);
        expect(document.activeElement).toEqual(itemInput);

        // Check if indent of second item's child was reduced from 3 to 2
        expect(getRenderedItemIndent(newItems[3])).toEqual(2);

        // Check new item input's indent was reduced from 4 to 3
        expect(getRenderedItemIndent(newItems[4])).toEqual(3);

        ///////////////////////// Merge with a collapsed item's child /////////////////////////
        // Get initial state
        firstItemData = {...getCurrentObject(store.getState()).toDoList.items[1]};
        secondItemData = {...getCurrentObject(store.getState()).toDoList.items[2]};

        // Select the second item and press backspace
        secondItemInput = getByText(TDLContainer, getCurrentObject(store.getState()).toDoList.items[2].item_text);
        fireEvent.keyDown(secondItemInput, { key: "Backspace", code: "Backspace" });

        // Check if state was correctly updated
        expect(Object.keys(getCurrentObject(store.getState()).toDoList.items).length).toEqual(4);      // one less item in the state
        expect(compareItemData( getCurrentObject(store.getState()).toDoList.items[7], 
            {...firstItemData, item_text: firstItemData.item_text + secondItemData.item_text} ));    // new item has merged text and keeps the state and comment of the first old item
        
        // Parent of first item is expanded
        expect(getCurrentObject(store.getState()).toDoList.items[0].is_expanded).toBeTruthy();
    });


    test("Tab / Shift + Tab", async () => {
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/edit/2001"
        });

        // Check if object information is displayed on the page
        await waitFor(() => getByText(container, "Object Information"));
        clickDataTabButton(container);
        const TDLContainer = container.querySelector(".to-do-list-container");
        expect(TDLContainer).toBeTruthy();

        // Focus an item and increase its indent
        let oldIndent = getCurrentObject(store.getState()).toDoList.items[2].indent;
        const itemInput = getByText(TDLContainer, getCurrentObject(store.getState()).toDoList.items[2].item_text);
        fireEvent.focus(itemInput);
        fireEvent.keyDown(itemInput, { key: "Tab", code: "Tab" });
        expect(getCurrentObject(store.getState()).toDoList.items[2].indent).toEqual(oldIndent + 1);
        expect(getRenderedItemIndent(itemInput.parentNode)).toEqual(oldIndent + 1);

        // Decrease item indent
        fireEvent.keyDown(itemInput, { key: "Tab", code: "Tab", shiftKey: true });
        expect(getCurrentObject(store.getState()).toDoList.items[2].indent).toEqual(oldIndent);
        expect(getRenderedItemIndent(itemInput.parentNode)).toEqual(oldIndent);

        // Increase new item input indent
        oldIndent = getCurrentObject(store.getState()).toDoList.newItemInputIndent;
        const newItemInput = getByPlaceholderText(TDLContainer, "New item");
        fireEvent.focus(newItemInput);
        fireEvent.keyDown(newItemInput, { key: "Tab", code: "Tab" });
        expect(getCurrentObject(store.getState()).toDoList.newItemInputIndent).toEqual(oldIndent + 1);
        expect(getRenderedItemIndent(newItemInput.parentNode)).toEqual(oldIndent + 1);

        // Decrease new item input indent
        fireEvent.keyDown(newItemInput, { key: "Tab", code: "Tab", shiftKey: true });
        expect(getCurrentObject(store.getState()).toDoList.newItemInputIndent).toEqual(oldIndent);
        expect(getRenderedItemIndent(newItemInput.parentNode)).toEqual(oldIndent);
    });

    
    test("Tab, increase indent and become a child of a collapsed parent", async () => {
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/edit/2903"
        });

        // Check if object information is displayed on the page
        await waitFor(() => getByText(container, "Object Information"));
        clickDataTabButton(container);

        // Get an item, for which to increase indent
        const TDLContainer = container.querySelector(".to-do-list-container");
        expect(getCurrentObject(store.getState()).toDoList.items[0].is_expanded).toBeFalsy();
        let oldIndent = getCurrentObject(store.getState()).toDoList.items[2].indent;
        let itemInput = getByText(TDLContainer, getCurrentObject(store.getState()).toDoList.items[2].item_text);
        fireEvent.keyDown(itemInput, { key: "Tab", code: "Tab" });

        // Check if item's indent was increased and its new parent was expanded; also check that current item is still rendered
        expect(getCurrentObject(store.getState()).toDoList.items[2].indent).toEqual(oldIndent + 1);
        expect(getCurrentObject(store.getState()).toDoList.items[0].is_expanded).toBeTruthy();
        getByText(TDLContainer, getCurrentObject(store.getState()).toDoList.items[2].item_text);
    });


    test("F1", async () => {
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/edit/2001"
        });

        // Check if object information is displayed on the page
        await waitFor(() => getByText(container, "Object Information"));
        clickDataTabButton(container);
        const TDLContainer = container.querySelector(".to-do-list-container");
        expect(TDLContainer).toBeTruthy();
        expect(getCurrentObject(store.getState()).toDoList.items[0].item_state).toEqual("active");

        // Select an item and change its state repeatedly
        const itemInput = getByText(TDLContainer, getCurrentObject(store.getState()).toDoList.items[0].item_text);
        fireEvent.focus(itemInput);

        fireEvent.keyDown(itemInput, { key: "F1", code: "F1" });
        expect(getCurrentObject(store.getState()).toDoList.items[0].item_state).toEqual("optional");

        fireEvent.keyDown(itemInput, { key: "F1", code: "F1" });
        expect(getCurrentObject(store.getState()).toDoList.items[0].item_state).toEqual("completed");

        fireEvent.keyDown(itemInput, { key: "F1", code: "F1" });
        expect(getCurrentObject(store.getState()).toDoList.items[0].item_state).toEqual("cancelled");

        fireEvent.keyDown(itemInput, { key: "F1", code: "F1" });
        expect(getCurrentObject(store.getState()).toDoList.items[0].item_state).toEqual("active");
    });


    test("F2", async () => {
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/edit/2001"
        });

        // Check if object information is displayed on the page
        await waitFor(() => getByText(container, "Object Information"));
        clickDataTabButton(container);
        const TDLContainer = container.querySelector(".to-do-list-container");
        expect(TDLContainer).toBeTruthy();
        expect(getCurrentObject(store.getState()).toDoList.items[0].is_expanded).toBeTruthy();

        // Select an item and toggle expand/collapse
        const itemInput = getByText(TDLContainer, getCurrentObject(store.getState()).toDoList.items[0].item_text);
        fireEvent.focus(itemInput);

        fireEvent.keyDown(itemInput, { key: "F2", code: "F2" });
        expect(getCurrentObject(store.getState()).toDoList.items[0].is_expanded).toBeFalsy();

        fireEvent.keyDown(itemInput, { key: "F2", code: "F2" });
        expect(getCurrentObject(store.getState()).toDoList.items[0].is_expanded).toBeTruthy();
    });
});


describe("Keybinds (sort by state)", () => {
    beforeEach(() => {
        // Mock caret.getSplitText function to enable mergeWithNext/mergeWithPrev testing (if not mocked, delete command is issued instead)
        global.getSplitText = jest.spyOn(caret, "getSplitText").mockImplementation(element => ({ before: "", after: "" }));
    });

    afterEach(() => {
        global.getSplitText.mockRestore();
    });

    test("Up/down", async () => {
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/edit/2910"
        });

        // Check if object information is displayed on the page
        await waitFor(() => getByText(container, "Object Information"));
        clickDataTabButton(container);
        const TDLContainer = container.querySelector(".to-do-list-container");
        expect(TDLContainer).toBeTruthy();
        // const itemOrder = getSortByStateOrder(getCurrentObject(store.getState()).toDoList);
        const itemOrder = expectedUpDownTDLItemOrder;    // state sort item order without children of collapsed items
        
        // Select first element
        let itemInput = getByText(TDLContainer, getCurrentObject(store.getState()).toDoList.items[itemOrder[0]].item_text);
        fireEvent.focus(itemInput);

        // Move down the list
        let n = 0;
        while (n < itemOrder.length - 1) {
            fireEvent.keyDown(itemInput, { key: "ArrowDown", code: "ArrowDown" });
            n++;
            itemInput = getByText(TDLContainer, getCurrentObject(store.getState()).toDoList.items[itemOrder[n]].item_text);
            expect(document.activeElement).toEqual(itemInput);
        }

        // Move down to new item input
        fireEvent.keyDown(itemInput, { key: "ArrowDown", code: "ArrowDown" });
        itemInput = getByPlaceholderText(TDLContainer, "New item");
        expect(document.activeElement).toEqual(itemInput);

        // Move up to the last item
        fireEvent.keyDown(itemInput, { key: "ArrowUp", code: "ArrowUp" });
        itemInput = getByText(TDLContainer, getCurrentObject(store.getState()).toDoList.items[itemOrder[n]].item_text);
        expect(document.activeElement).toEqual(itemInput);

        // Move up the list
        while (n > 0) {
            fireEvent.keyDown(itemInput, { key: "ArrowUp", code: "ArrowUp" });
            n--;
            itemInput = getByText(TDLContainer, getCurrentObject(store.getState()).toDoList.items[itemOrder[n]].item_text);
            expect(document.activeElement).toEqual(itemInput);
        }

        // Move up from the first item (first item is still focused)
        fireEvent.keyDown(itemInput, { key: "ArrowUp", code: "ArrowUp" });
        itemInput = getByText(TDLContainer, getCurrentObject(store.getState()).toDoList.items[itemOrder[0]].item_text);
        expect(document.activeElement).toEqual(itemInput);
    });


    test("Enter", async () => {
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/edit/2905"
        });
    
        // Check if object information is displayed on the page
        await waitFor(() => getByText(container, "Object Information"));
        clickDataTabButton(container);
        const TDLContainer = container.querySelector(".to-do-list-container");
        expect(TDLContainer).toBeTruthy();

        // Get initial values
        let items = TDLContainer.querySelectorAll(".to-do-list-item");
        expect(items.length).toEqual(7);    // 6 items + new input          // state sort order: [3, 4, 5, 0, 1, 2]
        let firstItemData = {...getCurrentObject(store.getState()).toDoList.items[3]};
        let secondItemData = {...getCurrentObject(store.getState()).toDoList.items[4]};

        // Focus second item input and split it
        let secondtItemInput = items[1].querySelector(".to-do-list-item-input");
        fireEvent.focus(secondtItemInput);
        fireEvent.keyDown(secondtItemInput, { key: "Enter", code: "Enter" });

        // Check if state was correctly updated
        let newItemsData = getCurrentObject(store.getState()).toDoList.items;
        expect(compareItemData( newItemsData[3], firstItemData ));      // first item is unchanged
        expect(compareItemData( newItemsData[6], {...secondItemData, item_text: ""} ));      // new first item has no text, but has the same state and comment as the old one
        expect(compareItemData( newItemsData[7], secondItemData ));                          // new second item has the same text, state and comment as the old one

        // Check if items are displayed in correct order ([3, 4, 5, 0, 1, 2] => [3, 6, 7, 5, 0, 1, 2])
        let newItems = TDLContainer.querySelectorAll(".to-do-list-item");
        expect(newItems.length).toEqual(8);    // 7 items + new input
        expect(newItems[0].querySelector(".to-do-list-item-id").textContent).toEqual("3");
        expect(newItems[1].querySelector(".to-do-list-item-id").textContent).toEqual("6");
        expect(newItems[2].querySelector(".to-do-list-item-id").textContent).toEqual("7");
        expect(newItems[3].querySelector(".to-do-list-item-id").textContent).toEqual("5");

        // New second item input is focused
        expect(document.activeElement).toEqual(newItems[2].querySelector(".to-do-list-item-input"));
    });


    test("Delete", async () => {
        /* (*)
            In testing environment, caret position is set to 0 and is not changed by KeyDown events => items merge on delete keypress is checked for the case when item text length = 0.
            Test should also check:
            - delete in a non-empty item (with the caret at the end);
            - delete in the last item (with the caret at the end).
        */
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/edit/2906"
        });

        // Check if object information is displayed on the page
        await waitFor(() => getByText(container, "Object Information"));
        clickDataTabButton(container);
        const TDLContainer = container.querySelector(".to-do-list-container");
        expect(TDLContainer).toBeTruthy();

        ///////////////////////// Merge items 3 and 0 (0 is after 3 in state sort) /////////////////////////
        let firstItemData = {...getCurrentObject(store.getState()).toDoList.items[1]};     // state sort order: [1, 2, 3, 0]
        let secondItemData = {...getCurrentObject(store.getState()).toDoList.items[2]};
        let thirdItemData = {...getCurrentObject(store.getState()).toDoList.items[3]};
        let zeroItemData = {...getCurrentObject(store.getState()).toDoList.items[0]};

        // Delete an item
        const thirdItemInput = TDLContainer.querySelectorAll(".to-do-list-item-input")[2];
        fireEvent.input(thirdItemInput, { target: { innerHTML: "" }});
        fireEvent.keyDown(thirdItemInput, { key: "Delete", code: "Delete" });

        // Check if state was correctly updated (state sort: [1, 2, 3, 0] => [1, 2, 4])
        expect(Object.keys(getCurrentObject(store.getState()).toDoList.items).length).toEqual(3);          // 3 items remain
        expect(compareItemData( getCurrentObject(store.getState()).toDoList.items[1], firstItemData));    // first item remains unchanged
        expect(compareItemData( getCurrentObject(store.getState()).toDoList.items[2], secondItemData));    // second item remains unchanged
        expect(compareItemData( getCurrentObject(store.getState()).toDoList.items[4],
            {...thirdItemData, item_text: zeroItemData.item_text} ));    // new item has merged text ("" + 0 item's text) and keeps the state, indent and comment of the third old item

        // Items are displayed in correct order. New item is displayed and focused.
        let newItems = TDLContainer.querySelectorAll(".to-do-list-item");
        expect(newItems.length).toEqual(4);     // 3 items + new item input
        getByText(newItems[0], firstItemData.item_text);
        getByText(newItems[1], secondItemData.item_text);
        let newItemInput = getByText(newItems[2], zeroItemData.item_text);
        expect(document.activeElement).toEqual(newItemInput);

        ///////////////////////// Merge items 1 and 2 (1 is before 2 in state sort) /////////////////////////
        let fourthItemData = {...getCurrentObject(store.getState()).toDoList.items[4]};

        // Delete an item
        const firstItemInput = TDLContainer.querySelectorAll(".to-do-list-item-input")[0];
        fireEvent.input(firstItemInput, { target: { innerHTML: "" }});
        fireEvent.keyDown(firstItemInput, { key: "Delete", code: "Delete" });

        // Check if state was correctly updated (state sort: [1, 2, 4] => [5, 4])
        expect(Object.keys(getCurrentObject(store.getState()).toDoList.items).length).toEqual(2);          // 2 items remain
        expect(compareItemData( getCurrentObject(store.getState()).toDoList.items[5],
            {...firstItemData, item_text: secondItemData.item_text} ));    // new item has merged text ("" + 2th text) and keeps the state, indent and comment of the first old item
        expect(compareItemData( getCurrentObject(store.getState()).toDoList.items[4], fourthItemData));    // fourth item remains unchanged
        
         // Items are displayed in correct order. New item is displayed and focused.
         newItems = TDLContainer.querySelectorAll(".to-do-list-item");
         expect(newItems.length).toEqual(3);     // 2 items + new item input
         newItemInput = getByText(newItems[0], secondItemData.item_text);
         expect(document.activeElement).toEqual(newItemInput);
         getByText(newItems[1], fourthItemData.item_text);
    });


    test("Backspace", async () => {
        /* (*)
            In testing environment, caret position is set to 0 and is not changed by KeyDown events.
            - backspace in the first item (with the caret at the beginning).
        */
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/edit/2907"
        });

        // Check if object information is displayed on the page
        await waitFor(() => getByText(container, "Object Information"));
        clickDataTabButton(container);
        const TDLContainer = container.querySelector(".to-do-list-container");
        expect(TDLContainer).toBeTruthy();

        ///////////////////////// Merge items 3 and 0 (0 is after 3 in state sort) /////////////////////////
        let firstItemData = {...getCurrentObject(store.getState()).toDoList.items[1]};     // state sort order: [1, 2, 3, 0]
        let secondItemData = {...getCurrentObject(store.getState()).toDoList.items[2]};
        let thirdItemData = {...getCurrentObject(store.getState()).toDoList.items[3]};
        let zeroItemData = {...getCurrentObject(store.getState()).toDoList.items[0]};

        // Delete an item
        const zeroItemInput = TDLContainer.querySelectorAll(".to-do-list-item-input")[3];
        fireEvent.keyDown(zeroItemInput, { key: "Backspace", code: "Backspace" });

        // Check if state was correctly updated (state sort: [1, 2, 3, 0] => [1, 2, 4])
        expect(Object.keys(getCurrentObject(store.getState()).toDoList.items).length).toEqual(3);          // 3 items remain
        expect(compareItemData( getCurrentObject(store.getState()).toDoList.items[1], firstItemData));    // first item remains unchanged
        expect(compareItemData( getCurrentObject(store.getState()).toDoList.items[2], secondItemData));    // second item remains unchanged
        expect(compareItemData( getCurrentObject(store.getState()).toDoList.items[4],
            {...thirdItemData, item_text: thirdItemData.item_text + zeroItemData.item_text} ));    // new item has merged text (3 + 0 items' texts) and keeps the state, indent and comment of the third old item

        // Items are displayed in correct order. New item is displayed and focused.
        let newItems = TDLContainer.querySelectorAll(".to-do-list-item");
        expect(newItems.length).toEqual(4);     // 3 items + new item input
        getByText(newItems[0], firstItemData.item_text);
        getByText(newItems[1], secondItemData.item_text);
        let newItemInput = getByText(newItems[2], thirdItemData.item_text + zeroItemData.item_text);
        expect(document.activeElement).toEqual(newItemInput);

        ///////////////////////// Merge items 1 and 2 (1 is before 2 in state sort) /////////////////////////
        let fourthItemData = {...getCurrentObject(store.getState()).toDoList.items[4]};

        // Delete an item
        const firstItemInput = TDLContainer.querySelectorAll(".to-do-list-item-input")[0];
        fireEvent.keyDown(firstItemInput, { key: "Delete", code: "Delete" });

        // Check if state was correctly updated (state sort: [1, 2, 4] => [5, 4])
        expect(Object.keys(getCurrentObject(store.getState()).toDoList.items).length).toEqual(2);          // 2 items remain
        expect(compareItemData( getCurrentObject(store.getState()).toDoList.items[5],
            {...firstItemData, item_text: firstItemData.item_text + secondItemData.item_text} ));    // new item has merged text (1 + 2 texts) and keeps the state, indent and comment of the first old item
        expect(compareItemData( getCurrentObject(store.getState()).toDoList.items[4], fourthItemData));    // fourth item remains unchanged
        
         // Items are displayed in correct order. New item is displayed and focused.
         newItems = TDLContainer.querySelectorAll(".to-do-list-item");
         expect(newItems.length).toEqual(3);     // 2 items + new item input
         newItemInput = getByText(newItems[0], firstItemData.item_text + secondItemData.item_text);
         expect(document.activeElement).toEqual(newItemInput);
         getByText(newItems[1], fourthItemData.item_text);
    });


    test("Tab / Shift + Tab", async () => {
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/edit/2904"
        });

        // Check if object information is displayed on the page
        await waitFor(() => getByText(container, "Object Information"));
        clickDataTabButton(container);
        const TDLContainer = container.querySelector(".to-do-list-container");
        expect(TDLContainer).toBeTruthy();

        // Focus an item and try to increase its indent
        let oldIndent = getCurrentObject(store.getState()).toDoList.items[2].indent;
        const itemInput = getByText(TDLContainer, getCurrentObject(store.getState()).toDoList.items[2].item_text);
        fireEvent.focus(itemInput);
        fireEvent.keyDown(itemInput, { key: "Tab", code: "Tab" });
        expect(getCurrentObject(store.getState()).toDoList.items[2].indent).toEqual(oldIndent);
        expect(getRenderedItemIndent(itemInput.parentNode)).toEqual(oldIndent);

        // Try to decrease item indent
        fireEvent.keyDown(itemInput, { key: "Tab", code: "Tab", shiftKey: true });
        expect(getCurrentObject(store.getState()).toDoList.items[2].indent).toEqual(oldIndent);
        expect(getRenderedItemIndent(itemInput.parentNode)).toEqual(oldIndent);

        // Try to increase new item input indent
        oldIndent = getCurrentObject(store.getState()).toDoList.newItemInputIndent;
        const newItemInput = getByPlaceholderText(TDLContainer, "New item");
        fireEvent.focus(newItemInput);
        fireEvent.keyDown(newItemInput, { key: "Tab", code: "Tab" });
        expect(getCurrentObject(store.getState()).toDoList.newItemInputIndent).toEqual(oldIndent);
        expect(getRenderedItemIndent(newItemInput.parentNode)).toEqual(oldIndent);

        // Try to decrease new item input indent
        fireEvent.keyDown(newItemInput, { key: "Tab", code: "Tab", shiftKey: true });
        expect(getCurrentObject(store.getState()).toDoList.newItemInputIndent).toEqual(oldIndent);
        expect(getRenderedItemIndent(newItemInput.parentNode)).toEqual(oldIndent);
    });
});


describe("Drag and drop", () => {
    test("Drop item without children on another item", async () => {
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/edit/2911"
        });

        // Check if object information is displayed on the page
        await waitFor(() => getByText(container, "Object Information"));
        clickDataTabButton(container);
        const TDLContainer = container.querySelector(".to-do-list-container");
        expect(TDLContainer).toBeTruthy();
        
        const items = TDLContainer.querySelectorAll(".to-do-list-item-container");
        const itemOrder = getDefaultSortOrder(getCurrentObject(store.getState()).toDoList);

        // Change first item text
        const draggedItem = items[0];
        const draggedItemInput = getByText(draggedItem, getCurrentObject(store.getState()).toDoList.items[itemOrder[0]].item_text);
        fireEvent.input(draggedItemInput, { target: { innerHTML: "updated item 0" }});
        
        // Start dragging first item
        fireEvent.dragStart(draggedItem);
        await waitFor(() => expect(queryByText(TDLContainer, "updated item 0")).toBeFalsy());

        // Drag item on another item
        const dropTarget = items[2];
        fireEvent.dragEnter(dropTarget);
        const dropZoneContainer = dropTarget.querySelector(".to-do-list-item-drop-zone-container");
        expect(dropZoneContainer).toBeTruthy();
        expect(dropTarget.querySelector(".to-do-list-item-indent-indicator-container")).toBeTruthy();
        
        // Drop item and check the order in which items are displayed
        const dropZone = dropZoneContainer.querySelector(".to-do-list-item-drop-zone.first");
        fireEvent.dragEnter(dropZone);
        fireEvent.drop(dropZone);
        fireEvent.dragEnd(draggedItem);   // drag end has to be called manually for the dragged item
        
        const newItemOrder = [1, 0, 2];
        TDLContainer.querySelectorAll(".to-do-list-item-container").forEach((item, index) => {
            if (!queryByPlaceholderText(item, "New item")) {  // skip new item input
                expect(item.querySelector(".to-do-list-item-id").textContent).toEqual(newItemOrder[index].toString());
            }
        });
        expect(getCurrentObject(store.getState()).toDoList.items[0].indent).toEqual(0);
        
        // Check if updated text is displayed after drag end
        getByText(draggedItem, "updated item 0");
    });


    test("Drop item without children on another item and change its indent", async () => {
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/edit/2912"
        });

        // Check if object information is displayed on the page
        await waitFor(() => getByText(container, "Object Information"));
        clickDataTabButton(container);
        const TDLContainer = container.querySelector(".to-do-list-container");
        expect(TDLContainer).toBeTruthy();
        let items = TDLContainer.querySelectorAll(".to-do-list-item-container");

        // Start dragging an item
        let draggedItem = items[0];
        fireEvent.dragStart(draggedItem);
        await waitFor(() => expect(queryByText(TDLContainer, getCurrentObject(store.getState()).toDoList.items[0].item_text)).toBeFalsy());

        // Check if indent can't be > 0 if dropping before the first item
        let dropTarget = items[1];
        fireEvent.dragEnter(dropTarget);
        fireEvent.dragEnter(dropTarget.querySelector(".to-do-list-item-drop-zone.last"));
        expect(getCurrentObject(store.getState()).toDoList.dropIndent).toEqual(0);

        // Check if indent can't be prev item's indent + 1
        for (let i = 3; i < 8; i++) {
            let maxIndent = getCurrentObject(store.getState()).toDoList.items[i - 1].indent + 1;
            dropTarget = items[i];
            fireEvent.dragEnter(dropTarget);
            fireEvent.dragEnter(dropTarget.querySelector(".to-do-list-item-drop-zone.last"));
            expect(getCurrentObject(store.getState()).toDoList.dropIndent).toEqual(maxIndent);
        }

        // Check if drop indicators correctly display the current drop indent
        dropTarget = items[7];
        fireEvent.dragEnter(dropTarget);
        const dropZones = dropTarget.querySelectorAll(".to-do-list-item-drop-zone");
        const dropZoneIndicators = dropTarget.querySelectorAll(".to-do-list-item-indent-indicator");
        for (let i = 0; i < 6; i++) {
            fireEvent.dragEnter(dropZones[i]);
            expect(getCurrentObject(store.getState()).toDoList.dropIndent).toEqual(i);
            for (let j = 0; j < i; j++) expect(dropZoneIndicators[j].className.indexOf("active")).toEqual(-1);
            for (let j = i; j < 6; j++) expect(dropZoneIndicators[j].className.indexOf("active")).toBeGreaterThan(-1);
        }

        // Drop item in a zone with different indent
        fireEvent.dragEnter(dropZones[3]);
        fireEvent.drop(dropZones[3]);
        fireEvent.dragEnd(draggedItem);   // drag end has to be called manually for the dragged item
        
        items = TDLContainer.querySelectorAll(".to-do-list-item-container");    // update draggedItem reference (for some reason, the original element keeps the initial indent (although it's properly updated in the next test))
        draggedItem = items[items.length - 3];  // ..., 0, 7, new item input
        expect(draggedItem.querySelector(".to-do-list-item-id").textContent).toEqual("0");
        expect(getRenderedItemIndent(draggedItem)).toEqual(3);
    });

    
    test("Drop item on a new item input", async () => {
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/edit/2912"
        });

        // Check if object information is displayed on the page
        await waitFor(() => getByText(container, "Object Information"));
        clickDataTabButton(container);
        const TDLContainer = container.querySelector(".to-do-list-container");
        expect(TDLContainer).toBeTruthy();

        const items = TDLContainer.querySelectorAll(".to-do-list-item-container");
        const draggedItem = items[0];
        const lastItem = items[items.length - 2];
        const lastItemInput = lastItem.querySelector(".to-do-list-item-input");
        const newItem = items[items.length - 1];
        const itemOrder = getDefaultSortOrder(getCurrentObject(store.getState()).toDoList);
        const incorrectDropTarget = getByText(container, "Object Information");

        // Set last item indent to 0
        fireEvent.focus(lastItem);
        for (let i = 0; i < 6; i++) fireEvent.keyDown(lastItemInput, { key: "Tab", code: "Tab", shiftKey: true });

        // Check if dropzones are rendered correctly for each possible last item indent
        for (let i = 1; i < 6; i++) {
            fireEvent.dragStart(draggedItem);   // drag item and check if its indent is correct (<= last item's indent + 1)
            fireEvent.dragEnter(newItem);
            fireEvent.dragEnter(newItem.querySelector(".to-do-list-item-drop-zone.last"));
            expect(getCurrentObject(store.getState()).toDoList.dropIndent).toEqual(i);

            fireEvent.drop(incorrectDropTarget);    // abort dragging
            fireEvent.dragEnd(draggedItem);

            checkRenderedItemsOrder(TDLContainer, itemOrder);   // check if items are displayed in starting order

            fireEvent.focus(lastItemInput);  // increase last item's indent
            fireEvent.keyDown(lastItemInput, { key: "Tab", code: "Tab" });
        }

        // Drop item on new item input
        fireEvent.dragStart(draggedItem);
        fireEvent.dragEnter(newItem);
        fireEvent.dragEnter(newItem.querySelectorAll(".to-do-list-item-drop-zone")[3]);
        fireEvent.drop(newItem);
        fireEvent.dragEnd(draggedItem);

        const newItemOrder = itemOrder.splice(1).concat(itemOrder.splice(0, 1));  // check if items are displayed in correct order
        checkRenderedItemsOrder(TDLContainer, newItemOrder);
        expect(getRenderedItemIndent(draggedItem)).toEqual(3);  // check if dragged item's indent was updated
    });


    test("Drop an item with children", async () => {
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/edit/2913"
        });

        // Check if object information is displayed on the page
        await waitFor(() => getByText(container, "Object Information"));
        clickDataTabButton(container);
        const TDLContainer = container.querySelector(".to-do-list-container");
        expect(TDLContainer).toBeTruthy();

        let items = TDLContainer.querySelectorAll(".to-do-list-item-container");
        const draggedItem = items[0];

        // Start dragging first item
        fireEvent.dragStart(draggedItem);

        // Check if item and its children are not displayed
        await waitFor(() => expect(queryByText(TDLContainer, getCurrentObject(store.getState()).toDoList.items[0].item_text)).toBeFalsy());
        for (let i = 1; i < 4; i ++) expect(queryByText(TDLContainer, getCurrentObject(store.getState()).toDoList.items[i].item_text)).toBeFalsy();
        for (let i = 5; i < 8; i ++) getByText(TDLContainer, getCurrentObject(store.getState()).toDoList.items[i].item_text);

        // Check if dropzones are rendered correctly (indent can't be > 0)
        const firstNonDraggedItem = items[4];
        fireEvent.dragEnter(firstNonDraggedItem);
        fireEvent.dragEnter(firstNonDraggedItem.querySelector(".to-do-list-item-drop-zone.last"));
        expect(getCurrentObject(store.getState()).toDoList.dropIndent).toEqual(0);

        // Drop dragged items before last item
        const lastItem = items[items.length - 2];
        fireEvent.dragEnter(lastItem);
        fireEvent.dragEnter(lastItem.querySelector(".to-do-list-item-drop-zone.last"));
        expect(getCurrentObject(store.getState()).toDoList.dropIndent).toEqual(3);
        fireEvent.drop(lastItem);
        fireEvent.dragEnter(draggedItem);

        // Check if items are displayed in correct order
        const newItemOrder = [4, 5, 6, 0, 1, 2, 3, 7];
        items = TDLContainer.querySelectorAll(".to-do-list-item-container");
        checkRenderedItemsOrder(TDLContainer, newItemOrder);

        // Check if items' indent was correctly updated
        for (let i = 3; i < 7; i++) {   // dragged parent should have indent = 3, each child - +1 to prev (up to a maximum of 5)
            expect(getRenderedItemIndent(items[i])).toEqual(Math.min(i, 5));
        }
    });


    test("Drag last item with children", async () => {
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/edit/2913"
        });

        // Check if object information is displayed on the page
        await waitFor(() => getByText(container, "Object Information"));
        clickDataTabButton(container);
        const TDLContainer = container.querySelector(".to-do-list-container");
        expect(TDLContainer).toBeTruthy();

        // Increase new item input indent
        const newItemInput = getByPlaceholderText(TDLContainer, "New item");
        fireEvent.focus(newItemInput);
        for (let i = 0; i < 4; i++) fireEvent.keyDown(newItemInput, { key: "Tab", code: "Tab" });
        expect(getRenderedItemIndent(newItemInput.parentNode)).toEqual(4);

        // Start dragging parent of last item (with indent = 1)
        let items = TDLContainer.querySelectorAll(".to-do-list-item-container");
        const draggedItem = items[5];
        fireEvent.dragStart(draggedItem);

        // Check if item and its children are not rendered
        await waitFor(() => expect(queryByText(TDLContainer, getCurrentObject(store.getState()).toDoList.items[5].item_text)).toBeFalsy());
        for (let i = 6; i < 8; i++) expect(queryByText(TDLContainer, getCurrentObject(store.getState()).toDoList.items[i].item_text)).toBeFalsy();

        // Drop before first item
        const dropTarget = items[0];
        fireEvent.dragEnter(dropTarget);
        fireEvent.dragEnter(dropTarget.querySelector(".to-do-list-item-drop-zone.first"));
        fireEvent.drop(dropTarget);
        fireEvent.dragEnd(draggedItem);

        // Check if items are displayed in correct order
        const newItemOrder = [5, 6, 7, 0, 1, 2, 3, 4];
        checkRenderedItemsOrder(TDLContainer, newItemOrder);
        items = TDLContainer.querySelectorAll(".to-do-list-item-container");

        // Check if dragged items' indents were updated
        for (let i = 0; i < 3; i++) expect(getRenderedItemIndent(items[i])).toEqual(i);

        // Check if new item input's indent was adjusted
        expect(getRenderedItemIndent(newItemInput.parentNode)).toEqual(1);  // new last item's indent = 0 => new item input should change to 1 (0 + 1)
    });


    test("Abort dragging an item with children", async () => {
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/edit/2913"
        });

        // Check if object information is displayed on the page
        await waitFor(() => getByText(container, "Object Information"));
        clickDataTabButton(container);
        const TDLContainer = container.querySelector(".to-do-list-container");
        expect(TDLContainer).toBeTruthy();

        let items = TDLContainer.querySelectorAll(".to-do-list-item-container");
        const draggedItem = items[0];
        const correctDropTarget = items[5];
        const incorrectDropTarget = getByText(container, "Object Information");

        // Start dragging an item with children and check if they're not rendered
        fireEvent.dragStart(draggedItem);
        await waitFor(() => expect(queryByText(TDLContainer, getCurrentObject(store.getState()).toDoList.items[0].item_text)).toBeFalsy());
        for (let i = 1; i < 4; i++) expect(queryByText(TDLContainer, getCurrentObject(store.getState()).toDoList.items[i].item_text)).toBeFalsy();

        // Abort dragging (drop on an incorrect target)
        fireEvent.dragEnter(correctDropTarget);
        fireEvent.drop(incorrectDropTarget);
        fireEvent.dragEnd(draggedItem);

        // Check if items are rendered in correct order
        checkRenderedItemsOrder(TDLContainer, [0, 1, 2, 3, 4, 5, 6, 7]);
    });


    test("Drag collapsed item with children", async () => {
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/edit/2914"
        });

        // Check if object information is displayed on the page
        await waitFor(() => getByText(container, "Object Information"));
        clickDataTabButton(container);
        const TDLContainer = container.querySelector(".to-do-list-container");
        expect(TDLContainer).toBeTruthy();

        // Check if items are rendered correctly
        let items = TDLContainer.querySelectorAll(".to-do-list-item-container");
        checkRenderedItemsOrder(TDLContainer, [0, 4, 5, 6, 7]);

        // Start draggining a collapsed item with children
        const draggedItem = items[0];
        fireEvent.dragStart(draggedItem);
        await waitFor(() => expect(queryByText(TDLContainer, getCurrentObject(store.getState()).toDoList.items[0].item_text)).toBeFalsy());

        // Drop the item with a non-zero indent
        const dropTarget = items[2];
        fireEvent.dragEnter(dropTarget);
        fireEvent.dragEnter(dropTarget.querySelector(".to-do-list-item-drop-zone.last"));
        fireEvent.drop(dropTarget);
        fireEvent.dragEnd(draggedItem);

        // Check if items are displayed in correct order
        checkRenderedItemsOrder(TDLContainer, [4, 0, 5, 6, 7]);

        // Check if item and children indents were updated
        expect(getRenderedItemIndent(getByText(TDLContainer, getCurrentObject(store.getState()).toDoList.items[0].item_text).parentNode)).toEqual(1);
        for (let i = 0; i < 4; i++) expect(getCurrentObject(store.getState()).toDoList.items[i].indent).toEqual(i + 1);
    });


    test("Drag an item with children into a collapsed item child position", async () => {
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/edit/2914"
        });

        // Check if object information is displayed on the page
        await waitFor(() => getByText(container, "Object Information"));
        clickDataTabButton(container);
        const TDLContainer = container.querySelector(".to-do-list-container");
        expect(TDLContainer).toBeTruthy();
        let items = TDLContainer.querySelectorAll(".to-do-list-item-container");
        const draggedItem = items[2];   // id = 5
        const dropTarget = items[1];    // id = 4

        // Drag and drop an item with children after a collapsed item with non-zero indent
        fireEvent.dragStart(draggedItem);
        await waitFor(() => expect(queryByText(TDLContainer, getCurrentObject(store.getState()).toDoList.items[5].item_text)).toBeFalsy());
        fireEvent.dragEnter(dropTarget);
        fireEvent.dragEnter(dropTarget.querySelector(".to-do-list-item-drop-zone.last"));
        fireEvent.drop(dropTarget);
        fireEvent.dragEnd(draggedItem);

        // Check if items are displayed in correct order; check if new parent of dropped items was expanded
        checkRenderedItemsOrder(TDLContainer, [0, 1, 5, 6, 7, 4]);  // 2 and 3 are still hidden

        // Check if item indent is correct
        expect(getRenderedItemIndent(getByText(TDLContainer, getCurrentObject(store.getState()).toDoList.items[5].item_text).parentNode)).toEqual(1);
        for (let i = 0; i < 3; i++) expect(getCurrentObject(store.getState()).toDoList.items[i + 5].indent).toEqual(i + 1);
    });


    test("Drag and drop is disabled when list is sorted by state", async () => {
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/edit/2904"
        });

        // Check if object information is displayed on the page
        await waitFor(() => getByText(container, "Object Information"));
        clickDataTabButton(container);
        const TDLContainer = container.querySelector(".to-do-list-container");
        expect(TDLContainer).toBeTruthy();
        
        const items = TDLContainer.querySelectorAll(".to-do-list-item-container");
        const draggedItem = items[0];
        
        // Try to drag an item
        fireEvent.dragStart(draggedItem);
        expect(getCurrentObject(store.getState()).toDoList.draggedParent).toEqual(-1);     // dragStart event wasn't fired and draggedParent remains equal to -1
    });


    test("Drag and drop is disabled when item input is hovered", async () => {
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/edit/2001"
        });

        // Check if object information is displayed on the page
        await waitFor(() => getByText(container, "Object Information"));
        clickDataTabButton(container);
        const TDLContainer = container.querySelector(".to-do-list-container");
        expect(TDLContainer).toBeTruthy();

        const items = TDLContainer.querySelectorAll(".to-do-list-item-container");
        const draggedItem = items[0];
        const draggedItemInput = getByText(draggedItem, getCurrentObject(store.getState()).toDoList.items[0].item_text);

        // Hover over first item input
        fireEvent.mouseEnter(draggedItemInput);
        
        // Try to drag an item
        fireEvent.dragStart(draggedItem);
        expect(getCurrentObject(store.getState()).toDoList.draggedParent).toEqual(-1);     // dragStart event wasn't fired and draggedParent remains equal to -1
    });
});
