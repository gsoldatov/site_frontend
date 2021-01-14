/* 
// Old imports and setup/teardown functions.
// Tests sometimes fail because of using the shared state of mock fetch when they're run concurrently.

// import React from "react";
// import { Route } from "react-router-dom";

// import { fireEvent } from "@testing-library/react";
// import { getByText, getByPlaceholderText, waitFor, getByTitle, queryByPlaceholderText, queryByTitle, queryByText } from '@testing-library/dom'

// import { mockFetch, resetMocks } from "./mocks/mock-fetch";
// import { renderWithWrappers } from "./test-utils";

// import createStore from "../src/store/create-store";
// import { AddObject, EditObject } from "../src/components/object";
// import { addObjects, addObjectData, setObjectsTags } from "../src/actions/objects";

// beforeAll(() => { global.fetch = jest.fn(mockFetch); });
// afterAll(() => { jest.resetAllMocks(); });
// afterEach(() => { resetMocks(); });
*/
import React from "react";
import { Route } from "react-router-dom";

import { fireEvent } from "@testing-library/react";
import { getByText, getByPlaceholderText, waitFor, getByTitle, queryByPlaceholderText, queryByTitle, queryByText } from '@testing-library/dom'

import { renderWithWrappers } from "./test-utils";

import createStore from "../src/store/create-store";
import { AddObject, EditObject } from "../src/components/object";
import { addObjects, addObjectData, setObjectsTags } from "../src/actions/objects";


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


test("Add object => check tag input elements", async () => {
    let { container, store } = renderWithWrappers(<Route exact path="/objects/:id"><AddObject /></Route>, {
        route: "/objects/add"
    });

    // Click the tag input toggle icon
    let inputToggle = getByTitle(container, "Click to add tags");
    expect(inputToggle).toBeTruthy();
    fireEvent.click(inputToggle);

    // Check if input is rendered (without add tag button)
    let input = getByPlaceholderText(container, "Enter tag name...");
    expect(queryByTitle(container, "Add a new tag")).toBeFalsy();

    // Change input value
    fireEvent.change(input, { target: { value: "some text" } });
    expect(store.getState().objectUI.currentObject.tagsInput.inputText).toEqual("some text");

    // Check if button is rendered
    getByTitle(container, "Add a new tag");

    // Click Escape & check if input is not rendered
    fireEvent.keyDown(input, { key: "Escape", code: "Escape" });
    expect(queryByPlaceholderText(container, "Enter tag name...")).toBeFalsy();
    expect(queryByTitle(container, "Add a new tag")).toBeFalsy();
});


test("Add object => check input dropdown", async () => {
    let { container } = renderWithWrappers(<Route exact path="/objects/:id"><AddObject /></Route>, {
        route: "/objects/add"
    });

    // Change input text
    let inputToggle = getByTitle(container, "Click to add tags");
    expect(inputToggle).toBeTruthy();
    fireEvent.click(inputToggle);
    let input = getByPlaceholderText(container, "Enter tag name...");
    fireEvent.change(input, { target: { value: "some text" } });

    // Check if filtered options appeared
    let datalist = container.querySelector("#matching-tags");
    expect(datalist).toBeTruthy();
    await waitFor(() => expect(datalist.childNodes.length).toEqual(10));
});


test("Add object => add & remove tags", async () => {
    let { container } = renderWithWrappers(<Route exact path="/objects/:id"><AddObject /></Route>, {
        route: "/objects/add"
    });

    let inputToggle = getByTitle(container, "Click to add tags");
    expect(inputToggle).toBeTruthy();
    fireEvent.click(inputToggle);
    let input = getByPlaceholderText(container, "Enter tag name...");
    let datalist = container.querySelector("#matching-tags");

    // Add and remove an "existing" tag
    fireEvent.change(input, { target: { value: "tag #1" } });
    await waitFor(() => expect(datalist.childNodes.length).toBeGreaterThan(0));
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });  // check enter key down handle
    let addedTag = getByText(container, "tag #1");
    fireEvent.click(addedTag);
    expect(queryByText(container, "tag #1")).toBeFalsy();

    // Add and remove a new tag
    fireEvent.change(input, { target: { value: "new tag" } });
    let addTagButton = getByTitle(container, "Add a new tag");  // check add tag button
    fireEvent.click(addTagButton);
    addedTag = getByText(container, "new tag");
    fireEvent.click(addedTag);
    expect(queryByText(container, "new tag")).toBeFalsy();
});


test("Add object => add & remove tags", async () => {
    let { container, history, store } = renderWithWrappers(
        <Route exact path="/objects/:id" render={ props => props.match.params.id === "add" ? <AddObject /> : <EditObject /> } />, 
        { route: "/objects/add" }
    );

    let inputToggle = getByTitle(container, "Click to add tags");
    expect(inputToggle).toBeTruthy();
    fireEvent.click(inputToggle);
    let input = getByPlaceholderText(container, "Enter tag name...");
    let datalist = container.querySelector("#matching-tags");

    // Add an "existing" tag
    fireEvent.change(input, { target: { value: "tag #1" } });
    await waitFor(() => expect(datalist.childNodes.length).toBeGreaterThan(0));
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    // Add a new tag
    fireEvent.change(input, { target: { value: "new tag" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    // Set the object values and save the object
    let objectNameInput = getByPlaceholderText(container, "Object name");
    let objectDescriptionInput = getByPlaceholderText(container, "Object description");
    let linkInput = getByPlaceholderText(container, "Link");
    let saveButton = getByText(container, "Save");
    fireEvent.change(objectNameInput, { target: { value: "new object" } });
    await waitFor(() => expect(store.getState().objectUI.currentObject.object_name).toBe("new object"));
    fireEvent.change(objectDescriptionInput, { target: { value: "new object description" } });
    await waitFor(() => expect(store.getState().objectUI.currentObject.object_description).toBe("new object description"));
    fireEvent.change(linkInput, { target: { value: "https://google.com" } });
    await waitFor(() => expect(store.getState().objectUI.currentObject.link).toBe("https://google.com"));
    fireEvent.click(saveButton);
    const object_id = 1000; // mock object returned has this id

    // Wait for redirect and tag fetch
    await waitFor(() => expect(history.entries[history.length - 1].pathname).toBe(`/objects/${object_id}`));
    await waitFor(() => expect(container.querySelector(".inline-item-list-wrapper").childNodes.length).toEqual(3)); // 2 tags + input
});


test("Edit object => load object tags from state", async () => {
    let store = createStore({ enableDebugLogging: false });
    let object = { object_id: 1, object_type: "link", object_name: "object name", object_description: "object description", 
                    created_at: (new Date(Date.now() - 24*60*60*1000)).toUTCString(), modified_at: (new Date()).toUTCString(), current_tag_ids: [1, 2, 3, 4, 5] };
    let objectData = { object_id: 1, object_type: "link", object_data: {"link": "https://test.link"} };
    store.dispatch(addObjects([object]));
    store.dispatch(setObjectsTags([object]));
    store.dispatch(addObjectData([objectData]));
    
    // Route component is required for matching (getting :id part of the URL in the EditObject component)
    let { container } = renderWithWrappers(<Route exact path="/objects/:id"><EditObject /></Route>, {
        route: "/objects/1",
        store: store
    });

    // Check if tags are rendered on the page
    await waitFor(() => expect(container.querySelector(".inline-item-list-wrapper").childNodes.length).toBeGreaterThan(1));
    for(let i = 1; i <= 5; i++)
        getByText(container, `tag #${i}`);
});


test("Edit object => load object tags from backend & test tag removal", async () => {
    // Route component is required for matching (getting :id part of the URL in the EditObject component)
    let { container, store } = renderWithWrappers(<Route exact path="/objects/:id"><EditObject /></Route>, {
        route: "/objects/1"
    });

    // Check if tags are rendered on the page
    await waitFor(() => expect(container.querySelector(".inline-item-list-wrapper").childNodes.length).toBeGreaterThan(1));
    for(let i = 1; i <= 5; i++) getByText(container, `tag #${i}`);
    
    // Check tag removal
    let tag = getByText(container, "tag #1");
    fireEvent.click(tag);
    expect(store.getState().objectUI.currentObject.removedTagIDs.includes(1)).toBeTruthy();
    fireEvent.click(tag);
    expect(store.getState().objectUI.currentObject.removedTagIDs.includes(1)).toBeFalsy();
});


test("Edit object => load object tags from backend, add tags and update the object", async () => {
    // Route component is required for matching (getting :id part of the URL in the EditObject component)
    let { container, store } = renderWithWrappers(<Route exact path="/objects/:id"><EditObject /></Route>, {
        route: "/objects/1"
    });

    // Wait for the page to load
    await waitFor(() => getByText(container, "Object Information"));
    let inputToggle = getByTitle(container, "Click to add tags");
    expect(inputToggle).toBeTruthy();
    fireEvent.click(inputToggle);
    let input = getByPlaceholderText(container, "Enter tag name...");
    let datalist = container.querySelector("#matching-tags");

    // Add an "existing" tag
    fireEvent.change(input, { target: { value: "tag #6" } });
    await waitFor(() => expect(datalist.childNodes.length).toBeGreaterThan(0));
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    // Add a new tag
    fireEvent.change(input, { target: { value: "new tag" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    let deletedTag = getByText(container, "tag #1");
    fireEvent.click(deletedTag);

    // Update the tag and check if tags are updated
    let saveButton = getByText(container, "Save");
    fireEvent.click(saveButton);

    await waitFor(() => store.getState().objectUI.currentObject.currentTagIDs.includes(6));
    expect(queryByText(container, "tag #1")).toBeFalsy();
    for(let i = 2; i <= 6; i++) getByText(container, `tag #${i}`);
    getByText(container, "new tag");
});


test("Edit object => check adding current tags with tag input", async () => {
    let { container, store } = renderWithWrappers(<Route exact path="/objects/:id"><EditObject /></Route>, {
        route: "/objects/1"
    });

    // Wait for the page to load
    await waitFor(() => getByText(container, "Object Information"));

    // Add a current tag with input => check if it's toggled for removal
    let inputToggle = getByTitle(container, "Click to add tags");
    fireEvent.click(inputToggle);
    let input = getByPlaceholderText(container, "Enter tag name...");
    fireEvent.change(input, { target: { value: "tag #1" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
    expect(store.getState().objectUI.currentObject.removedTagIDs.includes(1)).toBeTruthy();

    // Add the same tag again => check if it's no longer removed
    fireEvent.change(input, { target: { value: "tag #1" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
    expect(store.getState().objectUI.currentObject.removedTagIDs.includes(1)).toBeFalsy();
});


test("Edit object => delete object", async () => {
    // Route component is required for matching (getting :id part of the URL in the EditObject component)
    let { container, store, history } = renderWithWrappers(<Route exact path="/objects/:id"><EditObject /></Route>, {
        route: "/objects/1"
    });

    // Wait for the page to load
    await waitFor(() => getByText(container, "Object Information"));
    expect(store.getState().objectsTags.hasOwnProperty("1")).toBeTruthy();

    // Delete the object and check if its tags were removed
    let deleteButton = getByText(container, "Delete");
    fireEvent.click(deleteButton);
    let confimationDialogButtonYes = getByText(container, "Yes");
    fireEvent.click(confimationDialogButtonYes);

    await waitFor(() => expect(history.entries[history.length - 1].pathname).toBe("/objects"));
    expect(store.getState().objectsTags.hasOwnProperty("1")).toBeFalsy();
});
