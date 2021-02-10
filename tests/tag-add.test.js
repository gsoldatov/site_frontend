/*
// Old imports and setup/teardown functions.
// Tests sometimes fail because of using the shared state of mock fetch when they're run concurrently.

// import React from "react";
// import { Route } from "react-router-dom";

// import { fireEvent } from "@testing-library/react";
// import { getByText, getByPlaceholderText, waitFor } from '@testing-library/dom'

// import { mockFetch, setFetchFailParams, resetMocks } from "./mocks/mock-fetch";
// import { renderWithWrappers } from "./test-utils";

// import { AddTag, EditTag } from "../src/components/tag";
// import { addTags } from "../src/actions/tags";


// beforeAll(() => { global.fetch = jest.fn(mockFetch); });
// afterAll(() => { jest.resetAllMocks(); });
// afterEach(() => { resetMocks(); });
*/
import React from "react";
import { Route } from "react-router-dom";

import { fireEvent } from "@testing-library/react";
import { getByText, getByPlaceholderText, waitFor } from "@testing-library/dom";

import { renderWithWrappers } from "./test-utils/render";

import { AddTag, EditTag } from "../src/components/tag";
import { addTags } from "../src/actions/tags";


/*
    /tags/add page tests.
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


test("Render and click cancel button", async () => {
    // Route component is required for matching (getting :id part of the URL in the Tag component)
    let { container, history } = renderWithWrappers(<Route exact path="/tags/:id"><AddTag /></Route>, {
        route: "/tags/add"
    });
    
    // Check if add tag page was loaded with empty input fields
    let addTagHeader = getByText(container, "Add a New Tag");
    let tagNameInput = getByPlaceholderText(container, "Tag name");
    let tagDescriptionInput = getByPlaceholderText(container, "Tag description");
    expect(tagNameInput.value).toBe("");
    expect(tagDescriptionInput.value).toBe("");

    // Check if an empty name can't be submitted
    let saveButton = getByText(container, "Save");
    let cancelButton = getByText(container, "Cancel");
    expect(saveButton.className.startsWith("disabled")).toBeTruthy(); // Semantic UI always adds onClick event to div elements, even if they are disabled (which does nothing in this case)
    // expect(saveButton.onclick).toBeNull();   
    

    // Check if cancel button redirects to /tags page
    fireEvent.click(cancelButton);
    expect(history.entries[history.length - 1].pathname).toBe("/tags");
});


test("Modify tag name and try saving an existing (in local state) tag name", async () => {
    // Route component is required for matching (getting :id part of the URL in the Tag component)
    let { container, store } = renderWithWrappers(<Route exact path="/tags/:id"><AddTag /></Route>, {
        route: "/tags/add"
    });

    // Check if input is updating the state
    let tagNameInput = getByPlaceholderText(container, "Tag name");
    let tagDescriptionInput = getByPlaceholderText(container, "Tag description");
    let saveButton = getByText(container, "Save");
    fireEvent.change(tagNameInput, { target: { value: "existing tag_name" } });
    await waitFor(() => expect(store.getState().tagUI.currentTag.tag_name).toBe("existing tag_name"));
    fireEvent.change(tagDescriptionInput, { target: { value: "tag description" } });
    await waitFor(() => expect(store.getState().tagUI.currentTag.tag_description).toBe("tag description"));
    
    // Check if existing tag_name (in store) is not added
    store.dispatch(addTags([{ tag_id: 1, tag_name: "existing tag_name", tag_description: "", created_at: new Date(), modified_at: new Date() }]));
    saveButton = getByText(container, "Save");
    fireEvent.click(saveButton);
    let errorMessage = getByText(container, "already exists", { exact: false });
});


test("Try saving an existing (on backend) tag name", async () => {
    // Route component is required for matching (getting :id part of the URL in the Tag component)
    let { container, store } = renderWithWrappers(<Route exact path="/tags/:id"><AddTag /></Route>, {
        route: "/tags/add"
    });

    // Check if existing tag_name (on backend) is not added
    let tagNameInput = getByPlaceholderText(container, "Tag name");
    let saveButton = getByText(container, "Save");
    fireEvent.change(tagNameInput, { target: { value: "existing tag_name" } });
    await waitFor(() => expect(store.getState().tagUI.currentTag.tag_name).toBe("existing tag_name"));  // wait for tag_name to be updated in state
    fireEvent.click(saveButton);
    await waitFor(() => getByText(container, "already exists", { exact: false }));
});


test("Handle fetch error", async () => {
    // Route component is required for matching (getting :id part of the URL in the Tag component)
    let { container, history, store, debug } = renderWithWrappers(<Route exact path="/tags/:id"><AddTag /></Route>, {
        route: "/tags/add"
    });

    // Check if an error message is displayed and tag is not added to the state
    let tagNameInput = getByPlaceholderText(container, "Tag name");
    let saveButton = getByText(container, "Save");
    fireEvent.change(tagNameInput, { target: { value: "error" } });
    await waitFor(() => expect(store.getState().tagUI.currentTag.tag_name).toBe("error"));  // wait for tag_name to be updated in state
    setFetchFailParams(true, "Test add fetch error");
    fireEvent.click(saveButton);
    await waitFor(() => getByText(container, "Test add fetch error"));
    expect(history.entries[history.length - 1].pathname).toBe("/tags/add");
    expect(store.getState().tags[1000]).toBeUndefined();
});


test("Save a new tag", async () => {
    // Route component is required for matching (getting :id part of the URL in the Tag component)
    let { container, history, store } = renderWithWrappers(
        <Route exact path="/tags/:id" render={ props => props.match.params.id === "add" ? <AddTag /> : <EditTag /> } />, 
        { route: "/tags/add" }
    );

    let tagNameInput = getByPlaceholderText(container, "Tag name");
    let tagDescriptionInput = getByPlaceholderText(container, "Tag description");
    let saveButton = getByText(container, "Save");

    // Check if tag is redirected after adding a correct tag
    fireEvent.change(tagNameInput, { target: { value: "new tag" } });
    await waitFor(() => expect(store.getState().tagUI.currentTag.tag_name).toBe("new tag"));
    fireEvent.change(tagDescriptionInput, { target: { value: "new tag description" } });
    await waitFor(() => expect(store.getState().tagUI.currentTag.tag_description).toBe("new tag description"));
    fireEvent.click(saveButton);
    await waitFor(() => expect(store.getState().tagUI.currentTag.tag_id).toBeGreaterThan(0));
    let tag_id = store.getState().tagUI.currentTag.tag_id;
    expect(history.entries[history.length - 1].pathname).toBe(`/tags/${tag_id}`);
    let tag = store.getState().tags[tag_id];
    expect(getByPlaceholderText(container, "Tag name").value).toEqual(tag["tag_name"]);
    expect(getByPlaceholderText(container, "Tag description").value).toEqual(tag["tag_description"]);
    // getByText(container, tag["created_at"]);
    // getByText(container, tag["modified_at"]);
    getByText(container, "Created at:");
    getByText(container, "Modified at:");
});
