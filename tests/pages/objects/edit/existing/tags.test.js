import React from "react";

import { fireEvent } from "@testing-library/react";
import { getByText, waitFor, getByTitle } from "@testing-library/dom";

import { resetTestConfig } from "../../../../_mocks/config";
import { createTestStore } from "../../../../_util/create-test-store";
import { renderWithWrappers } from "../../../../_util/render";
import { getSideMenuDialogControls, getSideMenuItem } from "../../../../_util/ui-common";
import { getInlineInputField } from "../../../../_util/ui-objects-tags";
import { getCurrentObject, resetObject } from "../../../../_util/ui-objects-edit";
import { getInlineItem } from "../../../../_util/ui-inline";
import { getFeedElements } from "../../../../_util/ui-index";

import { App } from "../../../../../src/components/app";
import { addObjectsTags } from "../../../../../src/reducers/data/objects-tags";
import { fetchMissingTags } from "../../../../../src/fetches/data/tags";
import { addObjectsAttributes, addObjectsDataFromBackend } from "../../../../../src/reducers/data/objects";
import { generateObjectAttributes, generateObjectData } from "../../../../_mocks/data-objects";


/*
    Object tagging tests for /objects/edit/:id page.
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


test("Load object tags from state", async () => {
    let { store } = createTestStore();
    let object = generateObjectAttributes(1, {
        object_type: "link", object_name: "object name", object_description: "object description", 
        created_at: (new Date(Date.now() - 24*60*60*1000)).toISOString(), modified_at: (new Date()).toISOString(), current_tag_ids: [1, 2, 3, 4, 5] 
    });
    let objectData = generateObjectData(1, "link", { "link": "https://test.link" });
    store.dispatch(addObjectsAttributes([object]));
    store.dispatch(addObjectsTags([object]));
    store.dispatch(addObjectsDataFromBackend([objectData]));
    for (let tag_id of object.current_tag_ids)
        await store.dispatch(fetchMissingTags([tag_id]));
    
    let { container } = renderWithWrappers(<App />, {
        route: "/objects/edit/1", store
    });

    // Check if tags are rendered on the page
    await waitFor(() => expect(container.querySelector(".inline-item-list").childNodes.length).toBeGreaterThan(1));
    for(let i = 1; i <= 5; i++)
        getByText(container, `tag #${i}`);
});


test("Load object tags from backend & test tag removal", async () => {
    let { container, store } = renderWithWrappers(<App />, {
        route: "/objects/edit/1"
    });

    // Check if tags are rendered on the page
    await waitFor(() => expect(container.querySelector(".inline-item-list").childNodes.length).toBeGreaterThan(1));
    for(let i = 1; i <= 5; i++) getByText(container, `tag #${i}`);
    
    // Check tag removal
    let tag = getInlineItem({ container, text: "tag #1" });
    fireEvent.click(tag.icons[0]);
    expect(getCurrentObject(store.getState()).removedTagIDs.includes(1)).toBeTruthy();
    fireEvent.click(tag.icons[0]);
    expect(getCurrentObject(store.getState()).removedTagIDs.includes(1)).toBeFalsy();
});


test("Load object tags from backend and check tag link", async () => {
    let { container, historyManager } = renderWithWrappers(<App />, {
        route: "/objects/edit/1"
    });

    // Wait for the page to load
    await waitFor(() => getByText(container, "Object Information"));
    
    // Find a tag item and click it
    const existingTag = getInlineItem({ container });
    expect(existingTag.item).toBeTruthy();

    fireEvent.click(existingTag.link);
    historyManager.ensureCurrentURL("/tags/view");
    historyManager.ensureCurrentURLParams("?tagIDs=1");
    await waitFor(() => expect(getFeedElements(container).placeholders.loading).toBeFalsy());
});


test("Load object tags from backend, add tags and update the object", async () => {
    let { container, store } = renderWithWrappers(<App />, {
        route: "/objects/edit/1"
    });

    // Wait for the page to load
    await waitFor(() => getByText(container, "Object Information"));
    let inputToggle = getByTitle(container, "Click to add tags");
    expect(inputToggle).toBeTruthy();
    fireEvent.click(inputToggle);
    let input = getInlineInputField({ container });

    // Add an "existing" tag
    fireEvent.change(input, { target: { value: "tag #6" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    // Add a new tag
    fireEvent.change(input, { target: { value: "new tag" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    let deletedTag = getInlineItem({ container, text: "tag #1" });
    fireEvent.click(deletedTag.icons[0]);

    // Update the tag and check if tags are updated
    let saveButton = getSideMenuItem(container, "Save");
    fireEvent.click(saveButton);

    await waitFor(() => getCurrentObject(store.getState()).currentTagIDs.includes(6));
    expect(getInlineItem({ container, text: "tag #1" }).item).toBeFalsy();
    for(let i = 2; i <= 6; i++) expect(getInlineItem({ container, text: `tag #${i}` }).item).toBeTruthy();
    expect(getInlineItem({ container, text: "new tag" }).item).toBeTruthy();
});


test("Check adding current tags with tag input", async () => {
    let { container, store } = renderWithWrappers(<App />, {
        route: "/objects/edit/1"
    });

    // Wait for the page to load
    await waitFor(() => getByText(container, "Object Information"));

    // Add a current tag with input => check if it's toggled for removal
    let inputToggle = getByTitle(container, "Click to add tags");
    fireEvent.click(inputToggle);
    let input = getInlineInputField({ container });
    fireEvent.change(input, { target: { value: "tag #1" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
    expect(getCurrentObject(store.getState()).removedTagIDs.includes(1)).toBeTruthy();

    // Add the same tag again => check if it's no longer removed
    fireEvent.change(input, { target: { value: "tag #1" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
    expect(getCurrentObject(store.getState()).removedTagIDs.includes(1)).toBeFalsy();
});


test("Delete object", async () => {
    let { container, store, historyManager } = renderWithWrappers(<App />, {
        route: "/objects/edit/1"
    });

    // Wait for the page to load
    await waitFor(() => getByText(container, "Object Information"));
    expect(store.getState().objectsTags.hasOwnProperty("1")).toBeTruthy();

    // Delete the object and check if its tags were removed
    let deleteButton = getSideMenuItem(container, "Delete");
    fireEvent.click(deleteButton);
    fireEvent.click(getSideMenuDialogControls(container).buttons["Yes"]);

    await waitFor(() => expect(store.getState().objectsTags[1]).toBeUndefined());
    await historyManager.waitForCurrentURLToBe("/objects/list");
});


test("Reset added & removed tags", async () => {
    let { container, store } = renderWithWrappers(<App />, {
        route: "/objects/edit/1"
    });

    // Wait for the page to load
    await waitFor(() => getByText(container, "Object Information"));
    const inputToggle = getByTitle(container, "Click to add tags");
    expect(inputToggle).toBeTruthy();
    fireEvent.click(inputToggle);
    const input = getInlineInputField({ container });

    // Add a tag
    const tagText = "new tag";
    fireEvent.change(input, { target: { value: tagText } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
    expect(getCurrentObject(store.getState()).addedTags.length).toEqual(1);

    // Remove a tag
    const deletedTag = getInlineItem({ container, text: "tag #1" });
    fireEvent.click(deletedTag.icons[0]);
    expect(getCurrentObject(store.getState()).removedTagIDs.length).toEqual(1);

    // Reset a check if added tag was removed
    resetObject(container);

    expect(getInlineItem({ container, text: tagText }).item).toBeFalsy();
    expect(getCurrentObject(store.getState()).addedTags.length).toEqual(0);
    expect(getCurrentObject(store.getState()).removedTagIDs.length).toEqual(0);
});


test("Persist added and removed tags", async () => {
    // Render switch with /objects/edit/:id and /objects page at /objects/edit/new
    let { container, store, historyManager } = renderWithWrappers(<App />, { 
        route: "/objects/edit/1" 
    });

    // Wait for the page to load
    await waitFor(() => getByText(container, "Object Information"));
    let inputToggle = getByTitle(container, "Click to add tags");
    expect(inputToggle).toBeTruthy();
    fireEvent.click(inputToggle);
    const input = getInlineInputField({ container });

    // Add a tag
    const tagText = "new tag";
    fireEvent.change(input, { target: { value: tagText } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
    expect(getInlineItem({ container, text: tagText }).item).toBeTruthy();

    // Remove a tag
    const deletedTag = getInlineItem({ container, text: "tag #1" });
    fireEvent.click(deletedTag.icons[0]);
    expect(getCurrentObject(store.getState()).removedTagIDs.length).toEqual(1);

    // Get to /objects/list page and back
    const cancelButton = getSideMenuItem(container, "Cancel");
    fireEvent.click(cancelButton);

    historyManager.push("/objects/edit/1");
    // await waitFor(() => getByText(container, "object #1"));
    // fireEvent.click(getByText(container, "object #1"));
    await waitFor(() => getByText(container, "Object Information"));

    // Check if added and removed tags are displayed
    expect(getInlineItem({ container, text: tagText }).item).toBeTruthy();
    expect(getCurrentObject(store.getState()).addedTags.length).toEqual(1);
    expect(getCurrentObject(store.getState()).removedTagIDs.length).toEqual(1);
});
