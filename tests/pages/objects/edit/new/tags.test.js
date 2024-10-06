import React from "react";

import { fireEvent } from "@testing-library/react";
import { getByText, getByPlaceholderText, waitFor, getByTitle } from "@testing-library/dom";

import { resetTestConfig } from "../../../../_mocks/config";
import { renderWithWrappers } from "../../../../_util/render";
import { getSideMenuItem } from "../../../../_util/ui-common";
import { getInlineInputField, getDropdownOptionsContainer } from "../../../../_util/ui-objects-tags";
import { getCurrentObject, clickDataTabButton, clickGeneralTabButton, resetObject } from "../../../../_util/ui-objects-edit";
import { getInlineItem } from "../../../../_util/ui-inline";
import { getFeedElements } from "../../../../_util/ui-index";

import { App } from "../../../../../src/components/app";


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



test("Check tag input elements", async () => {
    let { container, store } = renderWithWrappers(<App />, {
        route: "/objects/edit/new"
    });

    // Wait for the page to load
    await waitFor(() => getByText(container, "Add a New Object"));

    // Input is not rendered by default
    expect(getInlineInputField({ container })).toBeFalsy();

    // Click the tag input toggle icon
    let inputToggle = getByTitle(container, "Click to add tags");
    expect(inputToggle).toBeTruthy();
    fireEvent.click(inputToggle);

    // Check if input is rendered
    let input = getInlineInputField({ container });

    // Change input value
    fireEvent.change(input, { target: { value: "some text" } });
    expect(store.getState().objectUI.tagsInput.inputText).toEqual("some text");

    // Click Escape & check if input is not rendered
    fireEvent.keyDown(input, { key: "Escape", code: "Escape" });
    expect(getInlineInputField({ container })).toBeFalsy();
});


test("Check input dropdown", async () => {
    let { container, store } = renderWithWrappers(<App />, {
        route: "/objects/edit/new"
    });

    // Wait for the page to load
    await waitFor(() => getByText(container, "Add a New Object"));

    // Change input text
    let inputToggle = getByTitle(container, "Click to add tags");
    fireEvent.click(inputToggle);
    let input = getInlineInputField({ container });
    fireEvent.change(input, { target: { value: "some text" } });

    // Check if filtered options appeared
    await waitFor(() => {
        expect(store.getState().objectUI.tagsInput.matchingIDs.length).toEqual(10);
        let dropdown = getDropdownOptionsContainer({ container, currentQueryText: "some text" });
        expect(dropdown).toBeTruthy();
        // expect(dropdown.childNodes.length).toEqual(11); // add new + 10 existing tags    // dropdown list <div> tags are not rendered in tests, despite the options being passed into Dropdown component
    });
});


test("Add & remove tags", async () => {
    let { container, store } = renderWithWrappers(<App />, {
        route: "/objects/edit/new"
    });

    // Wait for the page to load
    await waitFor(() => getByText(container, "Add a New Object"));

    let inputToggle = getByTitle(container, "Click to add tags");
    expect(inputToggle).toBeTruthy();
    fireEvent.click(inputToggle);
    let input = getInlineInputField({ container });

    // Add and remove an "existing" tag
    fireEvent.change(input, { target: { value: "tag #1" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });  // check enter key down handle
    let addedTag = getInlineItem({ container, text: "tag #1" });
    expect(addedTag.item).toBeTruthy();
    expect(input.value).toEqual("");
    fireEvent.click(addedTag.icons[0]);
    expect(getInlineItem({ container, text: "tag #1" }).item).toBeFalsy();
    
    // Add and remove a new tag
    fireEvent.change(input, { target: { value: "new tag" } });
    await waitFor(() => expect(store.getState().objectUI.tagsInput.matchingIDs.length).toEqual(10));
    let dropdown = getDropdownOptionsContainer({ container, currentQueryText: "new tag" });
    expect(dropdown).toBeTruthy();
    fireEvent.click(dropdown.childNodes[0]);    // click on "Add new tag" option
    addedTag = getInlineItem({ container, text: "new tag" });
    expect(addedTag.item).toBeTruthy();
    fireEvent.click(addedTag.icons[0]);
    expect(getInlineItem({ container, text: "new tag" }).item).toBeFalsy();
});


test("Reset tags", async () => {
    let { container, store } = renderWithWrappers(<App />, {
        route: "/objects/edit/new"
    });

    // Wait for the page to load
    await waitFor(() => getByText(container, "Add a New Object"));

    // Add an "existing" tag
    const inputToggle = getByTitle(container, "Click to add tags");
    expect(inputToggle).toBeTruthy();
    fireEvent.click(inputToggle);
    const input = getInlineInputField({ container });
    
    const tagText = "new tag";
    fireEvent.change(input, { target: { value: tagText } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
    expect(getInlineItem({ container, text: tagText }).item).toBeTruthy();

    // Reset a check if added tag was removed
    resetObject(container);

    expect(getInlineItem({ container, text: tagText }).item).toBeFalsy();
    expect(getCurrentObject(store.getState()).addedTags.length).toEqual(0);
});


test("Persist added tags", async () => {
    // Render switch with /objects/edit/:id and /objects page at /objects/edit/new
    let { container, store } = renderWithWrappers(<App />, {
        route: "/objects/edit/new" 
    });

    // Wait for the page to load
    await waitFor(() => getByText(container, "Add a New Object"));

    // Add a tag
    const inputToggle = getByTitle(container, "Click to add tags");
    expect(inputToggle).toBeTruthy();
    fireEvent.click(inputToggle);
    const input = getInlineInputField({ container });
    
    const tagText = "new tag";
    fireEvent.change(input, { target: { value: tagText } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
    expect(getInlineItem({ container, text: tagText }).item).toBeTruthy();

    // Get to /objects page and back
    const cancelButton = getSideMenuItem(container, "Cancel");
    fireEvent.click(cancelButton);
    await waitFor(() => getByText(container, "object #1"));

    const addObjectButton = getSideMenuItem(container, "Add a New Object");
    fireEvent.click(addObjectButton);

    // Wait for the page to load
    await waitFor(() => getByText(container, "Add a New Object"));

    // Check if added tag is displayed
    expect(getInlineItem({ container, text: tagText }).item).toBeTruthy();
    expect(getCurrentObject(store.getState()).addedTags.length).toEqual(1);
});


test("Tag item links", async () => {
    let { container, store, historyManager } = renderWithWrappers(<App />, {
        route: "/objects/edit/new" 
    });

    // Wait for the page to load
    await waitFor(() => getByText(container, "Add a New Object"));

    let inputToggle = getByTitle(container, "Click to add tags");
    expect(inputToggle).toBeTruthy();
    fireEvent.click(inputToggle);
    let input = getInlineInputField({ container });

    // Add a new tag
    fireEvent.change(input, { target: { value: "new tag" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });  // check enter key down handle
    const newTag = getInlineItem({ container, text: "new tag" });
    expect(newTag.item).toBeTruthy();
    expect(newTag.link).toBeFalsy();

    // Add an "existing" tag and click it
    fireEvent.change(input, { target: { value: "tag #1" } });
    await waitFor(() => expect(Object.keys(store.getState().tags).length).toBeGreaterThan(0));     // Wait for tag information to load before adding tag to avoid treating tag as new
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });  // check enter key down handle
    const existingTag = getInlineItem({ container, text: "tag #1" });
    expect(existingTag.item).toBeTruthy();
    expect(existingTag.link).toBeTruthy();
    
    fireEvent.click(existingTag.link);
    historyManager.ensureCurrentURL("/tags/view");
    historyManager.ensureCurrentURLParams("?tagIDs=1");
    await waitFor(() => expect(getFeedElements(container).placeholders.loading).toBeFalsy());
});


test("Add tags & save object", async () => {
    let { container, store, historyManager } = renderWithWrappers(<App />, {
        route: "/objects/edit/new"
    });

    // Wait for the page to load
    await waitFor(() => getByText(container, "Add a New Object"));

    let inputToggle = getByTitle(container, "Click to add tags");
    expect(inputToggle).toBeTruthy();
    fireEvent.click(inputToggle);
    let input = getInlineInputField({ container });

    // // Add an "existing" tag
    fireEvent.change(input, { target: { value: "tag #1" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });  // check enter key down handle
    expect(getInlineItem({ container, text: "tag #1" }).item).toBeTruthy();

    // // Add a new tag
    fireEvent.change(input, { target: { value: "new tag" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });  // check enter key down handle
    expect(getInlineItem({ container, text: "new tag" }).item).toBeTruthy();

    // Set object attributes
    let objectNameInput = getByPlaceholderText(container, "Object name");
    let objectDescriptionInput = getByPlaceholderText(container, "Object description");
    fireEvent.change(objectNameInput, { target: { value: "new object" } });
    await waitFor(() => expect(getCurrentObject(store.getState()).object_name).toBe("new object"));
    fireEvent.change(objectDescriptionInput, { target: { value: "new object description" } });
    await waitFor(() => expect(getCurrentObject(store.getState()).object_description).toBe("new object description"));

    // Set object data
    clickDataTabButton(container);
    let linkInput = getByPlaceholderText(container, "Link");
    fireEvent.change(linkInput, { target: { value: "https://google.com" } });
    await waitFor(() => expect(getCurrentObject(store.getState()).link.link).toBe("https://google.com"));

    // Save object
    let saveButton = getSideMenuItem(container, "Save");   
    fireEvent.click(saveButton);
    const object_id = 1000; // mock object returned has this id

    // Wait for redirect and tag fetch
    await historyManager.waitForCurrentURLToBe(`/objects/edit/${object_id}`);
    clickGeneralTabButton(container);
    await waitFor(() => expect(container.querySelector(".inline-item-list").childNodes.length).toEqual(3)); // 2 tags + input
});
