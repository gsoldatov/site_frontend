import React from "react";

import { fireEvent } from "@testing-library/react";
import { getByText, getByPlaceholderText, waitFor, getByTitle, queryByText } from "@testing-library/dom";

import { resetTestConfig } from "../../../../../../_mocks/config";
import { getRenderedItemIndent } from "../../../../../../_util/to-do-lists";
import { renderWithWrappers } from "../../../../../../_util/render";
import { getCurrentObject, clickDataTabButton, getObjectTypeSwitchElements } from "../../../../../../_util/ui-objects-edit";

import { App } from "../../../../../../../src/components/top-level/app";


/*
    To-do list editing tests.

    NOTE: most of functionality is tested in /objects/edit/existing tests.
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


test("Load a new to-do list", async () => {
    let { container } = renderWithWrappers(<App />, {
        route: "/objects/edit/new"
    });

    // Wait for the page to load
    await waitFor(() => getByText(container, "Add a New Object"));

    // Select to-do list object type
    const { switchContainer, toDoListOption } = getObjectTypeSwitchElements(container);
    fireEvent.click(switchContainer);
    fireEvent.click(toDoListOption);
    clickDataTabButton(container);
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


test("Add, edit & delete items", async () => {
    let { container, store } = renderWithWrappers(<App />, {
        route: "/objects/edit/new"
    });

    // Wait for the page to load
    await waitFor(() => getByText(container, "Add a New Object"));

    // Select to-do list object type
    const { switchContainer, toDoListOption } = getObjectTypeSwitchElements(container);
    fireEvent.click(switchContainer);
    fireEvent.click(toDoListOption);
    clickDataTabButton(container);
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
    expect(getCurrentObject(store.getState()).toDoList.items[0].item_text).toEqual("updated first item");
    expect(getCurrentObject(store.getState()).toDoList.items[1].item_text).toEqual("second item");

    // Delete item
    fireEvent.focus(firstItem);
    let deleteButton = getByTitle(firstItem.parentNode, "Delete item");
    fireEvent.click(deleteButton);
    expect(getCurrentObject(store.getState()).toDoList.items[0]).toBeUndefined();
    expect(queryByText(TDLContainer, "updated first item")).toBeNull();
    getByText(TDLContainer, "second item");
});


test("New item input indenation", async () => {
    let { container } = renderWithWrappers(<App />, {
        route: "/objects/edit/new"
    });

    // Wait for the page to load
    await waitFor(() => getByText(container, "Add a New Object"));

    // Select to-do list object type
    const { switchContainer, toDoListOption } = getObjectTypeSwitchElements(container);
    fireEvent.click(switchContainer);
    fireEvent.click(toDoListOption);
    clickDataTabButton(container);
    const TDLContainer = container.querySelector(".to-do-list-container");
    expect(TDLContainer).toBeTruthy();

    // Add new items with indent = 0
    const newItemInput = getByPlaceholderText(TDLContainer, "New item");
    for (let i = 0; i < 2; i++) {
        if (i === 0) fireEvent.keyDown(newItemInput, { key: "Tab", code: "Tab" });
        fireEvent.focus(newItemInput);
        fireEvent.input(newItemInput, { target: { innerHTML: `item ${i}` }});
        const items = TDLContainer.querySelectorAll(".to-do-list-item-container");
        expect(items.length).toEqual(i + 2);  // existing items + 1 new item + new item input
        if (i === 0) expect(getRenderedItemIndent(items[0])).toEqual(0);    // first item's indent can't be > 0
    }

    // Add new items with indents > 0
    for (let i = 2; i < 7; i++) {
        for (let j = 0; j < 2; j++) fireEvent.keyDown(newItemInput, { key: "Tab", code: "Tab" });
        fireEvent.focus(newItemInput);
        fireEvent.input(newItemInput, { target: { innerHTML: `item ${i}` }});
        const items = TDLContainer.querySelectorAll(".to-do-list-item-container");
        expect(items.length).toEqual(i + 2);  // existing items + 1 new item + new item input
        expect(getRenderedItemIndent(items[i])).toEqual(Math.min(i - 1, 5));    // new item's indent can't be > prev item's indent + 1 (and 5)
    }

    // Check if new item is adjusted when last item's indent is reduced
    let item = getByText(TDLContainer, "item 6");
    for (let i = 0; i < 2; i++) fireEvent.keyDown(item, { key: "Tab", code: "Tab", shiftKey: true });
    expect(getRenderedItemIndent(item.parentNode)).toEqual(3);
    expect(getRenderedItemIndent(newItemInput.parentNode)).toEqual(4);
    
    // Delete last item and set new item input's indent to 5
    fireEvent.focus(item);
    fireEvent.click(getByTitle(item.parentNode, "Delete item"));
    for (let i = 0; i < 2; i++) fireEvent.keyDown(newItemInput, { key: "Tab", code: "Tab" });
    expect(getRenderedItemIndent(newItemInput.parentNode)).toEqual(5);  // 0; 1-2-3-4-5 remain

    // Check if new item is adjusted when deleting last item
    item = getByText(TDLContainer, "item 5");
    fireEvent.focus(item);
    fireEvent.click(getByTitle(item.parentNode, "Delete item"));
    expect(getRenderedItemIndent(newItemInput.parentNode)).toEqual(4);  // 0; 1-2-3-4 remain

    // Check if new item is adjusted when deleting parent of last item
    item = getByText(TDLContainer, "item 3");
    fireEvent.focus(item);
    fireEvent.click(getByTitle(item.parentNode, "Delete item"));
    expect(getRenderedItemIndent(newItemInput.parentNode)).toEqual(3);  // 0; 1-2-4 remain

    // Check if new item is adjusted when deleting parent of last item and all its children
    item = getByText(TDLContainer, "item 1");
    fireEvent.focus(item);
    fireEvent.click(getByTitle(item.parentNode, "Delete item and its children"));
    expect(getRenderedItemIndent(newItemInput.parentNode)).toEqual(1);  // 0 remains

    // Check if new item input's indent is set to 0 when sorting by state
    const sortByStateButton = getByTitle(TDLContainer.querySelector(".to-do-list-menu"), "Sort by state");
    fireEvent.click(sortByStateButton);
    expect(getRenderedItemIndent(newItemInput.parentNode)).toEqual(0);

    // Check if new item input's indent can't be changed when sorting by state
    fireEvent.keyDown(newItemInput, { key: "Tab", code: "Tab" });
    expect(getRenderedItemIndent(newItemInput.parentNode)).toEqual(0);
});
