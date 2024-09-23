import React from "react";

import { fireEvent } from "@testing-library/react";
import { getByPlaceholderText, waitFor } from "@testing-library/dom";

import { resetTestConfig } from "../../_mocks/config";
import { createTestStore } from "../../_util/create-test-store";
import { renderWithWrappers } from "../../_util/render";
import { getObjectsViewCardElements } from "../../_util/ui-objects-view";

import { App } from "../../../src/components/top-level/app";


/*
    /objects/view/:id page tests, non-composite object data.
*/
beforeEach(() => {
    // isolate fetch mock to avoid tests state collision because of cached data in fetch
    jest.isolateModules(() => {
        const { mockFetch, setFetchFail, addCustomRouteResponse } = require("../../_mocks/mock-fetch");
        
        // Set test app configuration
        resetTestConfig();
        
        // reset fetch mocks
        jest.resetAllMocks();
        global.fetch = jest.fn(mockFetch);
        global.setFetchFail = jest.fn(setFetchFail);
        global.addCustomRouteResponse = jest.fn(addCustomRouteResponse);
    });
});


test("Link", async () => {
    let { container, storeManager } = renderWithWrappers(<App />, {
        route: "/objects/view/1"
    });

    // Wait for the page to load
    await waitFor(() => expect(getObjectsViewCardElements({ container }).placeholders.loading).toBeFalsy());

    // !show_description_as_link
    expect(storeManager.store.getState().links[1].show_description_as_link).toBeFalsy();
    
    const linkURL = storeManager.store.getState().links[1].link;
    await waitFor(() => {
        let { link, renderedMarkdown } = getObjectsViewCardElements({ container }).data.link;
        expect(link.getAttribute("href")).toEqual(linkURL);
        expect(renderedMarkdown.textContent).toEqual(linkURL);
    });

    // !show_description && show_description_as_link
    storeManager.objects.updateData(1, "link", { show_description_as_link: true });

    await waitFor(() => {
        let { link, renderedMarkdown } = getObjectsViewCardElements({ container }).data.link;
        expect(link.getAttribute("href")).toEqual(linkURL);
        const paragraph = renderedMarkdown.querySelector("p");
        expect(paragraph).toBeTruthy();
        expect(paragraph.textContent).toEqual(storeManager.store.getState().objects[1].object_description); 
    });
});


test("Markdown", async () => {
    let { container, storeManager } = renderWithWrappers(<App />, {
        route: "/objects/view/1001"
    });

    // Wait for the page to load
    await waitFor(() => expect(getObjectsViewCardElements({ container }).placeholders.loading).toBeFalsy());

    // Change markdown raw_text
    storeManager.objects.updateData(1001, "markdown", { raw_text: "# Some text" });

    // Check if updated markdown is rendered
    await waitFor(() => {
        const markdownContainer = getObjectsViewCardElements({ container }).data.markdown.container;
        expect(markdownContainer).toBeTruthy();

        const renrederedHeader = markdownContainer.querySelector("h3");
        expect(renrederedHeader).toBeTruthy();
        expect(renrederedHeader.textContent).toEqual("Some text");
    });
});


test("To-do list (logged as admin)", async () => {
    let { container, store } = renderWithWrappers(<App />, {
        route: "/objects/view/2001"
    });

    // Wait for the page to load
    await waitFor(() => expect(getObjectsViewCardElements({ container }).placeholders.loading).toBeFalsy());

    // Check if "readonly" message is not displayed
    expect(getObjectsViewCardElements({ container }).data.toDoList.isReadOnlyMessage).toBeFalsy();

    // Add a new item and check if it was saved
    const TDLContainer = getObjectsViewCardElements({ container }).data.toDoList.container;
    expect(Object.keys(store.getState().toDoLists[2001].items).length).toEqual(8);      // 8 items are returned by default
    const newItemInput = getByPlaceholderText(TDLContainer, "New item");
    fireEvent.input(newItemInput, { target: { innerHTML: "added item" }});
    
    await waitFor(() => expect(Object.keys(store.getState().toDoLists[2001].items).length).toEqual(9), { timeout: 2000 });
    expect(store.getState().toDoLists[2001].items[8].item_text).toEqual("added item");

    // Add a new item with fetch error and check if an error message is displayed
    setFetchFail(true);
    fireEvent.input(newItemInput, { target: { innerHTML: "second added item" }});
    await waitFor(() => expect(getObjectsViewCardElements({ container }).data.toDoList.fetchError).toBeTruthy());
    expect(Object.keys(store.getState().toDoLists[2001].items).length).toEqual(9);
});


test("To-do list (anonymous)", async () => {
    const { store } = createTestStore({ addAdminToken: false });
    let { container } = renderWithWrappers(<App />, {
        route: "/objects/view/2001", store
    });

    // Wait for the page to load
    await waitFor(() => expect(getObjectsViewCardElements({ container }).placeholders.loading).toBeFalsy());

    // Check if "readonly" message is displayed
    expect(getObjectsViewCardElements({ container }).data.toDoList.isReadOnlyMessage).toBeTruthy();

    // Add a new item and check if it was not saved
    const TDLContainer = getObjectsViewCardElements({ container }).data.toDoList.container;
    expect(Object.keys(store.getState().toDoLists[2001].items).length).toEqual(8);      // 8 items are returned by default
    const newItemInput = getByPlaceholderText(TDLContainer, "New item");
    fireEvent.input(newItemInput, { target: { innerHTML: "added item" }});

    try {
        await waitFor(() => expect(Object.keys(store.getState().toDoLists[2001].items).length).toEqual(9));
        throw Error("To-do list was updated in anonymous mode");
    } catch (e) {}
    expect(Object.keys(store.getState().toDoLists[2001].items).length).toEqual(8);
});
