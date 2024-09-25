import React from "react";

import { fireEvent } from "@testing-library/react";
import { getByText, getByPlaceholderText, waitFor } from "@testing-library/dom";

import { resetTestConfig } from "../../../../../../_mocks/config";
import { compareItemData, getRenderedItemIndent } from "../../../../../../_util/to-do-lists";
import { renderWithWrappers } from "../../../../../../_util/render";
import { getCurrentObject, clickDataTabButton } from "../../../../../../_util/ui-objects-edit";
import { expectedUpDownTDLItemOrder, enterKeyDownDefaultSortTDL } from "../../../../../../_mocks/data-to-do-lists";

import { App } from "../../../../../../../src/components/top-level/app";

import * as caret from "../../../../../../../src/util/caret";


/*
    To-do list editing tests, keybinds.
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


describe("Keybinds in default sort", () => {
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


describe("Keybinds in sort by state", () => {
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
