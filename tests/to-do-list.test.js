import React from "react";
import { Route } from "react-router-dom";

import { act, fireEvent } from "@testing-library/react";
import { getByText, getByPlaceholderText, waitFor, getByTitle, screen, queryByPlaceholderText, queryByTitle, queryByText } from "@testing-library/dom";

import { compareItemData, getDefaultSortOrder, getSortByStateOrder } from "./test-utils/to-do-lists";
import { renderWithWrappersAndDnDProvider } from "./test-utils/render";

import createStore from "../src/store/create-store";
import { AddObject, EditObject } from "../src/components/object";
import { addObjects } from "../src/actions/objects";


/*
    To-do list editing tests.
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


test("Load a new to-do list", async () => {
    let { container } = renderWithWrappersAndDnDProvider(<Route exact path="/objects/:id"><AddObject /></Route>, {
        route: "/objects/add"
    });

    // Select to-do list object type
    const TDLButton = getByText(container.querySelector(".object-type-menu"), "To-Do List");
    fireEvent.click(TDLButton);
    const TDLContainer = container.querySelector(".to-do-list-container");
    expect(TDLContainer).toBeTruthy();

    // Check menu
    const menu = TDLContainer.querySelector(".to-do-list-menu");
    getByTitle(menu, "Default sort");
    getByTitle(menu, "Sort by state");

    // Items are not rendered (except for new item input)
    const items = TDLContainer.querySelectorAll(".to-do-list-item-container");
    expect(items.length).toEqual(1);
    getByPlaceholderText(items[0], "New item");
});


test("Load an existing to-do list", async () => {
    let { container, store } = renderWithWrappersAndDnDProvider(<Route exact path="/objects/:id"><EditObject /></Route>, {
        route: "/objects/2001"
    });

    // Check if object information is displayed on the page
    await waitFor(() => getByText(container, "Object Information"));
    const TDLContainer = container.querySelector(".to-do-list-container");
    expect(TDLContainer).toBeTruthy();

    // Check new item input
    getByPlaceholderText(TDLContainer, "New item");
    
    // Check existing items (text and state)
    const items = TDLContainer.querySelectorAll(".to-do-list-item");
    expect(items.length).toEqual(Object.keys(store.getState().objectUI.currentObject.toDoList.items).length + 1);   // items + new item input
    items.forEach(async item => {
        if (!queryByPlaceholderText(item, "New item")) {    // skip new item input
            const id = item.querySelector(".to-do-list-item-id").textContent;
            const itemData = store.getState().objectUI.currentObject.toDoList.items[id];

            // text & state
            getByText(item, itemData.item_text);
            getByTitle(item.querySelector(".to-do-list-left-menu"), itemData.item_state, { exact: false });

            // delete button
            const rightMenu = item.querySelector(".to-do-list-right-menu");
            expect(queryByTitle(rightMenu, "Delete item")).toBeFalsy();  // not rendered by default
            fireEvent.mouseEnter(item);
            getByTitle(rightMenu, "Delete item");   // rendered when item is hovered
            fireEvent.mouseLeave(item);
            expect(queryByTitle(rightMenu, "Delete item")).toBeFalsy();  // not rendered after item stops being hovered
            const input = item.querySelector(".to-do-list-item-input");
            fireEvent.focus(input);
            getByTitle(rightMenu, "Delete item");   // rendered when item input is focused
            fireEvent.blur(input);
            expect(queryByTitle(rightMenu, "Delete item")).toBeFalsy();  // not rendered after focus is removed from input
        }
    });
});


test("Add, edit & delete items", async () => {
    let { container, store } = renderWithWrappersAndDnDProvider(<Route exact path="/objects/:id"><AddObject /></Route>, {
        route: "/objects/add"
    });

    // Select to-do list object type
    const TDLButton = getByText(container.querySelector(".object-type-menu"), "To-Do List");
    fireEvent.click(TDLButton);
    const TDLContainer = container.querySelector(".to-do-list-container");
    expect(TDLContainer).toBeTruthy();
    const newItemInput = getByPlaceholderText(TDLContainer, "New item");

    // Add items
    fireEvent.input(newItemInput, { target: { innerHTML: "first item" }});
    fireEvent.input(newItemInput, { target: { innerHTML: "second item" }});
    expect(TDLContainer.querySelectorAll(".to-do-list-item").length).toEqual(3);
    let firstItem = getByText(TDLContainer, "first item");
    getByText(TDLContainer, "second item");
    expect(newItemInput.textContent).toEqual("");

    // Update item
    fireEvent.input(firstItem, { target: { innerHTML: "updated first item" }});
    expect(store.getState().objectUI.currentObject.toDoList.items[0].item_text).toEqual("updated first item");
    expect(store.getState().objectUI.currentObject.toDoList.items[1].item_text).toEqual("second item");

    // Delete item
    fireEvent.focus(firstItem);
    let deleteButton = getByTitle(firstItem.parentNode, "Delete item");
    fireEvent.click(deleteButton);
    expect(store.getState().objectUI.currentObject.toDoList.items[0]).toBeUndefined();
    expect(queryByText(TDLContainer, "updated first item")).toBeNull();
    getByText(TDLContainer, "second item");
});


test("Change item states", async () => {
    let { container, store } = renderWithWrappersAndDnDProvider(<Route exact path="/objects/:id"><EditObject /></Route>, {
        route: "/objects/2001"
    });

    // Check if object information is displayed on the page
    await waitFor(() => getByText(container, "Object Information"));
    const TDLContainer = container.querySelector(".to-do-list-container");
    expect(TDLContainer).toBeTruthy();

    const item = getByText(TDLContainer, "item 1").parentNode;
    ["active", "optional", "completed", "cancelled"].forEach(state => {
        const stateControl = item.querySelector(".to-do-list-item-state-menu");
        fireEvent.mouseEnter(stateControl);     // select state
        const stateButton = getByTitle(stateControl, `Set item as ${state}`);
        fireEvent.click(stateButton);
        expect(store.getState().objectUI.currentObject.toDoList.items[1].item_state).toEqual(state);
        fireEvent.mouseLeave(stateControl);     // check if correct state icon is displayed after state control stopped being hovered
        expect(stateControl.querySelectorAll(".to-do-list-item-button").length).toEqual(1);
        getByTitle(stateControl, `Set item as ${state}`);
    });
});


test("Change item sort", async () => {
    let { container, store } = renderWithWrappersAndDnDProvider(<Route exact path="/objects/:id"><EditObject /></Route>, {
        route: "/objects/2001"
    });

    // Check if object information is displayed on the page
    await waitFor(() => getByText(container, "Object Information"));
    const TDLContainer = container.querySelector(".to-do-list-container");
    expect(TDLContainer).toBeTruthy();
    expect(store.getState().objectUI.currentObject.toDoList.sort_type).toEqual("default");
    const defaultSortButton = getByTitle(TDLContainer.querySelector(".to-do-list-menu"), "Default sort");
    const sortByStateButton = getByTitle(TDLContainer.querySelector(".to-do-list-menu"), "Sort by state");

    const defaultItemOrder = getDefaultSortOrder(store.getState().objectUI.currentObject.toDoList);
    const stateSortOrder = getSortByStateOrder(store.getState().objectUI.currentObject.toDoList);

    // Sort by state and check order in which items are displayed
    fireEvent.click(sortByStateButton);
    TDLContainer.querySelectorAll(".to-do-list-item").forEach((item, index) => {
        if (!queryByPlaceholderText(item, "New item")) {
            const expectedID = stateSortOrder[index];
            getByText(item, store.getState().objectUI.currentObject.toDoList.items[expectedID].item_text);
        }
    });

    // Sort in default order and check order in which items are displayed
    fireEvent.click(defaultSortButton);
    TDLContainer.querySelectorAll(".to-do-list-item").forEach((item, index) => {
        if (!queryByPlaceholderText(item, "New item")) {
            const expectedID = defaultItemOrder[index];
            getByText(item, store.getState().objectUI.currentObject.toDoList.items[expectedID].item_text);
        }
    });
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
        let { container, store } = renderWithWrappersAndDnDProvider(<Route exact path="/objects/:id"><EditObject /></Route>, {
            route: "/objects/2001"
        });

        // Check if object information is displayed on the page
        await waitFor(() => getByText(container, "Object Information"));
        const TDLContainer = container.querySelector(".to-do-list-container");
        expect(TDLContainer).toBeTruthy();
        
        // Check existing items
        TDLContainer.querySelectorAll(".to-do-list-item").forEach(async item => {
            if (!queryByPlaceholderText(item, "New item")) {    // skip new item input
                const id = item.querySelector(".to-do-list-item-id").textContent;
                const itemData = store.getState().objectUI.currentObject.toDoList.items[id];
                
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
        let { container, store } = renderWithWrappersAndDnDProvider(<Route exact path="/objects/:id"><EditObject /></Route>, {
            route: "/objects/2001"
        });
    
        // Check if object information is displayed on the page
        await waitFor(() => getByText(container, "Object Information"));
        const TDLContainer = container.querySelector(".to-do-list-container");
        expect(TDLContainer).toBeTruthy();

        // Open comment input & update comment
        const item = getByText(TDLContainer, "item 0").parentNode;
        const rightMenu = item.querySelector(".to-do-list-right-menu");
        let commentButton = getByTitle(rightMenu, "Item comment");
        fireEvent.click(commentButton);
        let commentInput = getByText(container.parentNode.querySelector(".to-do-list-item-comment-input"), store.getState().objectUI.currentObject.toDoList.items[0].commentary);
        fireEvent.input(commentInput, { target: { innerHTML: "updated comment" }});
        expect(store.getState().objectUI.currentObject.toDoList.items[0].commentary).toEqual("updated comment");

        // Close and open input & check if input value remains equal to updated text
        fireEvent.click(commentButton);
        expect(container.parentNode.querySelector(".to-do-list-item-comment-input")).toBeNull();
        fireEvent.click(commentButton);
        getByText(container.parentNode.querySelector(".to-do-list-item-comment-input"), "updated comment");
    });
});


describe("Keybinds (default sort)", () => {
    test("Up/down", async () => {
        /* (*)
            Not checking caret position update, because it's set to 0 in test env and is not updated by input & keyDown event.
            Test should also check all cases for position updating when moving down/up (beginning, middle, end).
        */
        let { container, store } = renderWithWrappersAndDnDProvider(<Route exact path="/objects/:id"><EditObject /></Route>, {
            route: "/objects/2001"
        });
    
        // Check if object information is displayed on the page
        await waitFor(() => getByText(container, "Object Information"));
        const TDLContainer = container.querySelector(".to-do-list-container");
        expect(TDLContainer).toBeTruthy();
        const itemOrder = getDefaultSortOrder(store.getState().objectUI.currentObject.toDoList);
        
        // Select first element
        let itemInput = getByText(TDLContainer, store.getState().objectUI.currentObject.toDoList.items[itemOrder[0]].item_text);
        fireEvent.focus(itemInput);

        // Move down the list
        let n = 0;
        while (n < itemOrder.length - 1) {
            fireEvent.keyDown(itemInput, { key: "ArrowDown", code: "ArrowDown" });
            n++;
            itemInput = getByText(TDLContainer, store.getState().objectUI.currentObject.toDoList.items[itemOrder[n]].item_text);
            expect(document.activeElement).toEqual(itemInput);
        }

        // Move down to new item input
        fireEvent.keyDown(itemInput, { key: "ArrowDown", code: "ArrowDown" });
        itemInput = getByPlaceholderText(TDLContainer, "New item");
        expect(document.activeElement).toEqual(itemInput);

        // Move up to the last item
        fireEvent.keyDown(itemInput, { key: "ArrowUp", code: "ArrowUp" });
        itemInput = getByText(TDLContainer, store.getState().objectUI.currentObject.toDoList.items[itemOrder[n]].item_text);
        expect(document.activeElement).toEqual(itemInput);

        // Move up the list
        while (n > 0) {
            fireEvent.keyDown(itemInput, { key: "ArrowUp", code: "ArrowUp" });
            n--;
            itemInput = getByText(TDLContainer, store.getState().objectUI.currentObject.toDoList.items[itemOrder[n]].item_text);
            expect(document.activeElement).toEqual(itemInput);
        }

        // Move up from the first item (first item is still focused)
        fireEvent.keyDown(itemInput, { key: "ArrowUp", code: "ArrowUp" });
        itemInput = getByText(TDLContainer, store.getState().objectUI.currentObject.toDoList.items[itemOrder[0]].item_text);
        expect(document.activeElement).toEqual(itemInput);
    });


    test("Enter", async () => {
        /* (*)
            In testing environment, caret position is set to 0 and is not changed by KeyDown events => split is checked for the case when full item text is moved into the second item.
            Test should also check if item text is correctly split when caret position != 0.
        */
        let { container, store } = renderWithWrappersAndDnDProvider(<Route exact path="/objects/:id"><EditObject /></Route>, {
            route: "/objects/2901"
        });
    
        // Check if object information is displayed on the page
        await waitFor(() => getByText(container, "Object Information"));
        const TDLContainer = container.querySelector(".to-do-list-container");
        expect(TDLContainer).toBeTruthy();

        // Get initial values
        let items = TDLContainer.querySelectorAll(".to-do-list-item");
        expect(items.length).toEqual(3);    // 2 items + new input
        let firstItemData = {...store.getState().objectUI.currentObject.toDoList.items[0]};
        let secondItemData = {...store.getState().objectUI.currentObject.toDoList.items[1]};
        
        // Focus first of the two items and split it
        let firstItemInput = items[0].querySelector(".to-do-list-item-input");
        fireEvent.focus(firstItemInput);
        fireEvent.keyDown(firstItemInput, { key: "Enter", code: "Enter" });

        // Check if state was correctly updated
        let newItemsData = store.getState().objectUI.currentObject.toDoList.items;
        expect(compareItemData( newItemsData[2], {...firstItemData, item_text: ""} ));      // new first item has no text, but has the same state and comment as the old one
        expect(compareItemData( newItemsData[3], firstItemData ));                          // new second item has the same text, state and comment as the old one
        expect(compareItemData( newItemsData[1], secondItemData ));                         // second item of the list was not changed

        // Check if items are displayed in correct order
        let newItems = TDLContainer.querySelectorAll(".to-do-list-item");
        expect(newItems.length).toEqual(4);    // 3 items + new input
        expect(newItems[0].querySelector(".to-do-list-item-id").textContent).toEqual("2");
        expect(newItems[1].querySelector(".to-do-list-item-id").textContent).toEqual("3");
        expect(newItems[2].querySelector(".to-do-list-item-id").textContent).toEqual("1");

        // New second item input is focused
        expect(document.activeElement).toEqual(newItems[1].querySelector(".to-do-list-item-input"));
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
        let { container, store } = renderWithWrappersAndDnDProvider(<Route exact path="/objects/:id"><EditObject /></Route>, {
            route: "/objects/2902"
        });

        // Check if object information is displayed on the page
        await waitFor(() => getByText(container, "Object Information"));
        const TDLContainer = container.querySelector(".to-do-list-container");
        expect(TDLContainer).toBeTruthy();

        // Get initial state
        const firstItemData = {...store.getState().objectUI.currentObject.toDoList.items[0]};
        const secondItemData = {...store.getState().objectUI.currentObject.toDoList.items[1]};
        
        // // Delete a character in a non-empty item    // delete keypress does not update the textContent of the input in testing environment
        // let firstItemInput = getByText(TDLContainer, store.getState().objectUI.currentObject.toDoList.items[0].item_text);
        // screen.debug(firstItemInput)
        // fireEvent.keyDown(firstItemInput, { key: "Delete", code: "Delete" });
        // expect(store.getState().objectUI.currentObject.toDoList.items[0].item_text).toEqual("");        // initial text is 1 char long
        // expect(Object.keys(store.getState().objectUI.currentObject.toDoList.items).length).toEqual(2);  // no items were deleted

        // Delete an item
        const firstItemInput = getByText(TDLContainer, store.getState().objectUI.currentObject.toDoList.items[0].item_text);
        fireEvent.input(firstItemInput, { target: { innerHTML: "" }});     // set empty text
        fireEvent.keyDown(firstItemInput, { key: "Delete", code: "Delete" });

        // Check if state was correctly updated
        expect(Object.keys(store.getState().objectUI.currentObject.toDoList.items).length).toEqual(1);      // only one item remains
        expect(compareItemData( store.getState().objectUI.currentObject.toDoList.items[2], 
            {...firstItemData, item_text: secondItemData.item_text} ));    // new item has merged text ("" + second) and keeps the state and comment of the first old item

        // New item is displayed and focused
        const newItems = TDLContainer.querySelectorAll(".to-do-list-item");
        expect(newItems.length).toEqual(2);     // 1 item + new item input
        const newItemInput = getByText(newItems[0], secondItemData.item_text);
        expect(document.activeElement).toEqual(newItemInput);
    });


    test("Backspace", async () => {
        /* (*)
            In testing environment, caret position is set to 0 and is not changed by KeyDown events.

            Test should also check:
                - if backspace keypress correctly removes a character when caret position is not at the beginning of item input;
                - if two non-empty item texts are correctly merged;
                - backspace keypress does nothing when caret is at the beginning of the first item (for default and state sort).
        */
        let { container, store } = renderWithWrappersAndDnDProvider(<Route exact path="/objects/:id"><EditObject /></Route>, {
            route: "/objects/2903"
        });

        // Check if object information is displayed on the page
        await waitFor(() => getByText(container, "Object Information"));
        const TDLContainer = container.querySelector(".to-do-list-container");
        expect(TDLContainer).toBeTruthy();

        // Get initial state
        const firstItemData = {...store.getState().objectUI.currentObject.toDoList.items[0]};
        const secondItemData = {...store.getState().objectUI.currentObject.toDoList.items[1]};

        // Select the second item and press backspace
        const secondItemInput = getByText(TDLContainer, store.getState().objectUI.currentObject.toDoList.items[1].item_text);
        fireEvent.keyDown(secondItemInput, { key: "Backspace", code: "Backspace" });

        // Check if state was correctly updated
        expect(Object.keys(store.getState().objectUI.currentObject.toDoList.items).length).toEqual(1);      // only one item remains
        expect(compareItemData( store.getState().objectUI.currentObject.toDoList.items[2], 
            {...firstItemData, item_text: firstItemData.item_text + secondItemData.item_text} ));    // new item has merged text and keeps the state and comment of the first old item

        // New item is displayed and focused
        const newItems = TDLContainer.querySelectorAll(".to-do-list-item");
        expect(newItems.length).toEqual(2);     // 1 item + new item input
        const newItemInput = getByText(newItems[0], firstItemData.item_text + secondItemData.item_text);
        expect(document.activeElement).toEqual(newItemInput);
    });
});


describe("Keybinds (sort by state)", () => {
    test("Up/down", async () => {
        let { container, store } = renderWithWrappersAndDnDProvider(<Route exact path="/objects/:id"><EditObject /></Route>, {
            route: "/objects/2904"
        });

        // Check if object information is displayed on the page
        await waitFor(() => getByText(container, "Object Information"));
        const TDLContainer = container.querySelector(".to-do-list-container");
        expect(TDLContainer).toBeTruthy();
        const itemOrder = getSortByStateOrder(store.getState().objectUI.currentObject.toDoList);
        
        // Select first element
        let itemInput = getByText(TDLContainer, store.getState().objectUI.currentObject.toDoList.items[itemOrder[0]].item_text);
        fireEvent.focus(itemInput);

        // Move down the list
        let n = 0;
        while (n < itemOrder.length - 1) {
            fireEvent.keyDown(itemInput, { key: "ArrowDown", code: "ArrowDown" });
            n++;
            itemInput = getByText(TDLContainer, store.getState().objectUI.currentObject.toDoList.items[itemOrder[n]].item_text);
            expect(document.activeElement).toEqual(itemInput);
        }

        // Move down to new item input
        fireEvent.keyDown(itemInput, { key: "ArrowDown", code: "ArrowDown" });
        itemInput = getByPlaceholderText(TDLContainer, "New item");
        expect(document.activeElement).toEqual(itemInput);

        // Move up to the last item
        fireEvent.keyDown(itemInput, { key: "ArrowUp", code: "ArrowUp" });
        itemInput = getByText(TDLContainer, store.getState().objectUI.currentObject.toDoList.items[itemOrder[n]].item_text);
        expect(document.activeElement).toEqual(itemInput);

        // Move up the list
        while (n > 0) {
            fireEvent.keyDown(itemInput, { key: "ArrowUp", code: "ArrowUp" });
            n--;
            itemInput = getByText(TDLContainer, store.getState().objectUI.currentObject.toDoList.items[itemOrder[n]].item_text);
            expect(document.activeElement).toEqual(itemInput);
        }

        // Move up from the first item (first item is still focused)
        fireEvent.keyDown(itemInput, { key: "ArrowUp", code: "ArrowUp" });
        itemInput = getByText(TDLContainer, store.getState().objectUI.currentObject.toDoList.items[itemOrder[0]].item_text);
        expect(document.activeElement).toEqual(itemInput);
    });


    test("Enter", async () => {
        let { container, store } = renderWithWrappersAndDnDProvider(<Route exact path="/objects/:id"><EditObject /></Route>, {
            route: "/objects/2905"
        });
    
        // Check if object information is displayed on the page
        await waitFor(() => getByText(container, "Object Information"));
        const TDLContainer = container.querySelector(".to-do-list-container");
        expect(TDLContainer).toBeTruthy();

        // Get initial values
        let items = TDLContainer.querySelectorAll(".to-do-list-item");
        expect(items.length).toEqual(3);    // 2 items + new input
        let firstItemData = {...store.getState().objectUI.currentObject.toDoList.items[0]};
        let secondItemData = {...store.getState().objectUI.currentObject.toDoList.items[1]};

        // Focus second item input and split it (itemOrder = [1, 0] when sorted by state)
        let secondtItemInput = items[0].querySelector(".to-do-list-item-input");
        fireEvent.focus(secondtItemInput);
        fireEvent.keyDown(secondtItemInput, { key: "Enter", code: "Enter" });

        // Check if state was correctly updated
        let newItemsData = store.getState().objectUI.currentObject.toDoList.items;
        expect(compareItemData( newItemsData[0], firstItemData ));      // first item is unchanged
        expect(compareItemData( newItemsData[2], {...secondItemData, item_text: ""} ));      // new first item has no text, but has the same state and comment as the old one
        expect(compareItemData( newItemsData[3], secondItemData ));                          // new second item has the same text, state and comment as the old one

        // Check if items are displayed in correct order ([1, 0] => [2, 3, 0])
        let newItems = TDLContainer.querySelectorAll(".to-do-list-item");
        expect(newItems.length).toEqual(4);    // 3 items + new input
        expect(newItems[0].querySelector(".to-do-list-item-id").textContent).toEqual("2");
        expect(newItems[1].querySelector(".to-do-list-item-id").textContent).toEqual("3");
        expect(newItems[2].querySelector(".to-do-list-item-id").textContent).toEqual("0");

        // New second item input is focused
        expect(document.activeElement).toEqual(newItems[1].querySelector(".to-do-list-item-input"));
    });


    test("Delete", async () => {
        /* (*)
            In testing environment, caret position is set to 0 and is not changed by KeyDown events => items merge on delete keypress is checked for the case when item text length = 0.
            Test should also check:
            - delete in a non-empty item (with the caret at the end);
            - delete in the last item (with the caret at the end).
        */
        let { container, store } = renderWithWrappersAndDnDProvider(<Route exact path="/objects/:id"><EditObject /></Route>, {
            route: "/objects/2906"
        });

        // Check if object information is displayed on the page
        await waitFor(() => getByText(container, "Object Information"));
        const TDLContainer = container.querySelector(".to-do-list-container");
        expect(TDLContainer).toBeTruthy();

        // Get initial state (item order = [1, 0, 2] when sorted by state)
        const firstItemData = {...store.getState().objectUI.currentObject.toDoList.items[0]};
        const secondItemData = {...store.getState().objectUI.currentObject.toDoList.items[1]};
        const thirdItemData = {...store.getState().objectUI.currentObject.toDoList.items[2]};

        // Delete an item
        const firstItemInput = TDLContainer.querySelectorAll(".to-do-list-item-input")[1];
        fireEvent.keyDown(firstItemInput, { key: "Delete", code: "Delete" });

        // Check if state was correctly updated ([1, 0, 2] => [1, 3])
        expect(Object.keys(store.getState().objectUI.currentObject.toDoList.items).length).toEqual(2);          // two items remain
        expect(compareItemData( store.getState().objectUI.currentObject.toDoList.items[1], secondItemData));    // second item remains unchanged
        expect(compareItemData( store.getState().objectUI.currentObject.toDoList.items[3],
            {...firstItemData, item_text: thirdItemData.item_text} ));    // new item has merged text ("" + second) and keeps the state and comment of the first old item

        // New item is displayed and focused
        const newItems = TDLContainer.querySelectorAll(".to-do-list-item");
        expect(newItems.length).toEqual(3);     // 2 items + new item input
        const newItemInput = getByText(newItems[1], thirdItemData.item_text);
        expect(document.activeElement).toEqual(newItemInput);
    });

    test("Backspace", async () => {
        /* (*)
            In testing environment, caret position is set to 0 and is not changed by KeyDown events.
            - backspace in the first item (with the caret at the beginning).
        */
        let { container, store } = renderWithWrappersAndDnDProvider(<Route exact path="/objects/:id"><EditObject /></Route>, {
            route: "/objects/2907"
        });

        // Check if object information is displayed on the page
        await waitFor(() => getByText(container, "Object Information"));
        const TDLContainer = container.querySelector(".to-do-list-container");
        expect(TDLContainer).toBeTruthy();

        // Get initial state (item order = [1, 0, 2] when sorted by state)
        const firstItemData = {...store.getState().objectUI.currentObject.toDoList.items[0]};
        const secondItemData = {...store.getState().objectUI.currentObject.toDoList.items[1]};
        const thirdItemData = {...store.getState().objectUI.currentObject.toDoList.items[2]};

        // Select the third item and press backspace
        const thirdItemInput = TDLContainer.querySelectorAll(".to-do-list-item-input")[2];
        fireEvent.keyDown(thirdItemInput, { key: "Backspace", code: "Backspace" });

        // Check if state was correctly updated ([1, 0, 2] => [1, 3])
        expect(Object.keys(store.getState().objectUI.currentObject.toDoList.items).length).toEqual(2);      // two items remain
        expect(compareItemData( store.getState().objectUI.currentObject.toDoList.items[1], secondItemData));    // second item remains unchanged
        expect(compareItemData( store.getState().objectUI.currentObject.toDoList.items[3], 
            {...firstItemData, item_text: firstItemData.item_text + thirdItemData.item_text} ));    // new item has merged text and keeps the state and comment of the first old item

        // New item is displayed and focused
        const newItems = TDLContainer.querySelectorAll(".to-do-list-item");
        expect(newItems.length).toEqual(3);     // 2 items + new item input
        const newItemInput = getByText(newItems[1], firstItemData.item_text + thirdItemData.item_text);
        expect(document.activeElement).toEqual(newItemInput);
    });
});


describe("Drag and drop", () => {
    test("Drop an item on another item", async () => {
        /* (*)
            Currently not checking if dragged item is not rendered, because monitor.isDragging() always returns false in test env.
        */
        let { container, store } = renderWithWrappersAndDnDProvider(<Route exact path="/objects/:id"><EditObject /></Route>, {
            route: "/objects/2001"
        });

        // Check if object information is displayed on the page
        await waitFor(() => getByText(container, "Object Information"));
        const TDLContainer = container.querySelector(".to-do-list-container");
        expect(TDLContainer).toBeTruthy();
        
        const items = TDLContainer.querySelectorAll(".to-do-list-item-container");
        const itemOrder = getDefaultSortOrder(store.getState().objectUI.currentObject.toDoList);
        const newItemOrder = itemOrder.slice(1, 4).concat(itemOrder[0]).concat(itemOrder.slice(4));
        
        const firstItem = items[0];
        const firstItemInput = getByText(firstItem, store.getState().objectUI.currentObject.toDoList.items[itemOrder[0]].item_text);
        const fifthItem = items[4];

        // Change first item text
        fireEvent.input(firstItemInput, { target: { innerHTML: "updated item 0" }});
        
        // Start dragging first item and drag it on fifth item
        fireEvent.dragStart(firstItem);
        fireEvent.dragEnter(fifthItem);

        // Check if additional space is rendered
        expect(fifthItem.querySelector(".to-do-list-item-on-hover-space")).toBeTruthy();

        // Drop item and check the order in which items are displayed
        fireEvent.drop(fifthItem);
        fireEvent.dragEnd(firstItem);   // drag end has to be called manually for the dragged item

        TDLContainer.querySelectorAll(".to-do-list-item-container").forEach((item, index) => {
            if (!queryByPlaceholderText(item, "New item")) {  // skip new item input
                expect(item.querySelector(".to-do-list-item-id").textContent).toEqual(newItemOrder[index].toString());
            }
        });
        
        // Check if updated text is displayed after drag end
        getByText(firstItem, "updated item 0");
    });


    test("Drop an item on new item input", async () => {
        let { container, store } = renderWithWrappersAndDnDProvider(<Route exact path="/objects/:id"><EditObject /></Route>, {
            route: "/objects/2001"
        });

        // Check if object information is displayed on the page
        await waitFor(() => getByText(container, "Object Information"));
        const TDLContainer = container.querySelector(".to-do-list-container");
        expect(TDLContainer).toBeTruthy();
        
        const items = TDLContainer.querySelectorAll(".to-do-list-item-container");
        const itemOrder = getDefaultSortOrder(store.getState().objectUI.currentObject.toDoList);
        const newItemOrder = itemOrder.slice(1).concat(itemOrder[0]);
        
        const firstItem = items[0];
        const newItem = items[items.length - 1];
        
        // Start dragging first item and drag it on fifth item
        fireEvent.dragStart(firstItem);
        fireEvent.dragEnter(newItem);

        // Check if additional space is rendered
        expect(newItem.querySelector(".to-do-list-item-on-hover-space")).toBeTruthy();

        // Drop item and check the order in which items are displayed
        fireEvent.drop(newItem);
        fireEvent.dragEnd(firstItem);   // drag end has to be called manually for the dragged item

        TDLContainer.querySelectorAll(".to-do-list-item-container").forEach((item, index) => {
            if (!queryByPlaceholderText(item, "New item")) {  // skip new item input
                expect(item.querySelector(".to-do-list-item-id").textContent).toEqual(newItemOrder[index].toString());
            }
        });
    });


    test("Is disabled when sorting by state", async () => {
        /* (*)
            Currently does not perform a valid check. Needs a way to check if drag operation was not performed by fireEvent.dragStart(firstItem):
            - fireEvent.drop(fifthItem) results in a test failure due to an uncatchable error;
            - dragStart does not remove the dragged item, because monitor.isDragging() always returns false in test env (custom isDragging() function never gets called).
        */
        let { container, store } = renderWithWrappersAndDnDProvider(<Route exact path="/objects/:id"><EditObject /></Route>, {
            route: "/objects/2904"
        });

        // Check if object information is displayed on the page
        await waitFor(() => getByText(container, "Object Information"));
        const TDLContainer = container.querySelector(".to-do-list-container");
        expect(TDLContainer).toBeTruthy();
        
        const itemOrder = getSortByStateOrder(store.getState().objectUI.currentObject.toDoList);
        const items = TDLContainer.querySelectorAll(".to-do-list-item-container");
        
        const firstItem = items[0];
        // const fifthItem = items[4];
        
        // Try to drag an item
        fireEvent.dragStart(firstItem);
        // fireEvent.drop(fifthItem);       // throws uncatchable "Invariant Violation: Cannot call hover while not dragging."
        // fireEvent.dragEnd(firstItem);    // doesn't do anything if drop event doesn't get called

        // Check if items order wasn't changed (dragged item is removed from the list)
        TDLContainer.querySelectorAll(".to-do-list-item-container").forEach((item, index) => {
            if (!queryByPlaceholderText(item, "New item")) {  // skip new item input
                expect(item.querySelector(".to-do-list-item-id").textContent).toEqual(itemOrder[index].toString());
            }
        });
    });


    test("Is disabled when item input is hovered", async () => {
        /* (*)
            Currently does not perform a valid check (see previous test for description)
        */
        let { container, store } = renderWithWrappersAndDnDProvider(<Route exact path="/objects/:id"><EditObject /></Route>, {
            route: "/objects/2001"
        });

        // Check if object information is displayed on the page
        await waitFor(() => getByText(container, "Object Information"));
        const TDLContainer = container.querySelector(".to-do-list-container");
        expect(TDLContainer).toBeTruthy();
        
        const itemOrder = getDefaultSortOrder(store.getState().objectUI.currentObject.toDoList);
        const items = TDLContainer.querySelectorAll(".to-do-list-item-container");
        
        const firstItem = items[0];
        const firstItemInput = getByText(firstItem, store.getState().objectUI.currentObject.toDoList.items[itemOrder[0]].item_text);
        // const fifthItem = items[4];

        // Hover over first item input
        fireEvent.mouseEnter(firstItemInput);
        
        // Try to drag an item
        fireEvent.dragStart(firstItem);
        // fireEvent.drop(fifthItem);       // throws uncatchable "Invariant Violation: Cannot call hover while not dragging."

        // Check if items order wasn't changed (dragged item is removed from the list)
        TDLContainer.querySelectorAll(".to-do-list-item-container").forEach((item, index) => {
            if (!queryByPlaceholderText(item, "New item")) {  // skip new item input
                expect(item.querySelector(".to-do-list-item-id").textContent).toEqual(itemOrder[index].toString());
            }
        });
    });
});
