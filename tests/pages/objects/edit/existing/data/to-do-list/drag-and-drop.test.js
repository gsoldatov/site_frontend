import React from "react";

import { fireEvent } from "@testing-library/react";
import { getByText, getByPlaceholderText, waitFor, queryByPlaceholderText, queryByText } from "@testing-library/dom";

import { resetTestConfig } from "../../../../../../_mocks/config";
import { getDefaultSortOrder, getRenderedItemIndent, checkRenderedItemsOrder } from "../../../../../../_util/to-do-lists";
import { renderWithWrappers } from "../../../../../../_util/render";
import { getCurrentObject, clickDataTabButton } from "../../../../../../_util/ui-objects-edit";

import { App } from "../../../../../../../src/components/top-level/app";

/*
    To-do list editing tests, item drag and drop.
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
