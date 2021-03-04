import React from "react";
import { Route } from "react-router-dom";

import { fireEvent } from "@testing-library/react";
import { getByText, getByPlaceholderText, waitFor, queryByText } from "@testing-library/dom";

import { renderWithWrappers } from "./test-utils/render";
import createStore from "../src/store/create-store";

import { AddTag, EditTag } from "../src/components/tag";
import { addTags, deleteTags } from "../src/actions/data-tags";


/*
    /tags/edit page tests.
*/
beforeEach(() => {
    // isolate fetch mock to avoid tests state collision because of cached data in fetch
    jest.isolateModules(() => {
        const { mockFetch, setFetchFail } = require("./mocks/mock-fetch");
        // reset fetch mocks
        jest.resetAllMocks();
        global.fetch = jest.fn(mockFetch);
        global.setFetchFail = jest.fn(setFetchFail);
    });
});


test("Load a non-existing tag + check buttons", async () => {
    // Route component is required for matching (getting :id part of the URL in the Tag component)
    let { container } = renderWithWrappers(<Route exact path="/tags/:id"><EditTag /></Route>, {
        route: "/tags/9999"
    });

    // Check if error message if displayed
    await waitFor(() => getByText(container, "not found", { exact: false }));

    // Check if save and delete buttons can't be clicked if tag fetch failed
    let saveButton = getByText(container, "Save");
    let deleteButton = getByText(container, "Delete");
    expect(saveButton.className.startsWith("disabled")).toBeTruthy(); // Semantic UI always adds onClick event to div elements, even if they are disabled (which does nothing in this case)
    // expect(saveButton.onclick).toBeNull();  
    expect(deleteButton.className.startsWith("disabled")).toBeTruthy();
    // expect(deleteButton.onclick).toBeNull();
});


test("Load a tag with fetch error", async () => {
    setFetchFail(true);

    // Route component is required for matching (getting :id part of the URL in the Tag component)
    let { container } = renderWithWrappers(<Route exact path="/tags/:id"><EditTag /></Route>, {
        route: "/tags/1"
    });

    // Check if error message if displayed
    await waitFor(() => getByText(container, "Failed to fetch data.", { exact: false }));
});


test("Load a tag from state", async () => {
    let store = createStore({ enableDebugLogging: false });
    let tag = { tag_id: 1, tag_name: "tag name", tag_description: "tag description", created_at: (new Date(Date.now() - 24*60*60*1000)).toUTCString(), modified_at: (new Date()).toUTCString() };
    store.dispatch(addTags([tag]));
    // Route component is required for matching (getting :id part of the URL in the Tag component)
    let { container } = renderWithWrappers(<Route exact path="/tags/:id"><EditTag /></Route>, {
        route: "/tags/1",
        store: store
    });

    // Check if tag information is displayed on the page
    await waitFor(() => getByText(container, "Tag Information"));
    let tagNameInput = getByPlaceholderText(container, "Tag name");
    let tagDescriptionInput = getByPlaceholderText(container, "Tag description");
    expect(tagNameInput.value).toEqual("tag name");
    expect(tagDescriptionInput.value).toEqual("tag description");
    // getByText(container, tag.created_at);
    // getByText(container, tag.modified_at);
    getByText(container, "Created at:");
    getByText(container, "Modified at:");
});


test("Load a tag from backend", async () => {
    // Route component is required for matching (getting :id part of the URL in the Tag component)
    let { container, store } = renderWithWrappers(<Route exact path="/tags/:id"><EditTag /></Route>, {
        route: "/tags/1"
    });

    // Check if tag information is displayed on the page
    await waitFor(() => getByText(container, "Tag Information"));
    let tag = store.getState().tags[1];
    let tagNameInput = getByPlaceholderText(container, "Tag name");
    let tagDescriptionInput = getByPlaceholderText(container, "Tag description");
    expect(tagNameInput.value).toEqual(tag.tag_name);
    expect(tagDescriptionInput.value).toEqual(tag.tag_description);
    // getByText(container, tag.created_at);
    // getByText(container, tag.modified_at);
    getByText(container, "Created at:");
    getByText(container, "Modified at:");
});


test("Check 'Add Tag' button", async () => {
    // Route component is required for matching (getting :id part of the URL in the Tag component)
    let { container, history } = renderWithWrappers(
        <Route exact path="/tags/:id" render={ props => props.match.params.id === "add" ? <AddTag /> : <EditTag /> } />, 
        { route: "/tags/1" }
    );

    // Check if object information is displayed on the page
    await waitFor(() => getByText(container, "Tag Information"));
    let addTagButton = getByText(container, "Add Tag");
    fireEvent.click(addTagButton);
    expect(history.entries[history.length - 1].pathname).toBe("/tags/add");
});


test("Modify a tag and click cancel", async () => {
    let store = createStore({ enableDebugLogging: false });
    let tag = { tag_id: 1, tag_name: "tag name", tag_description: "tag description", created_at: (new Date(Date.now() - 24*60*60*1000)).toUTCString(), modified_at: (new Date()).toUTCString() };
    store.dispatch(addTags([tag]));
    // Route component is required for matching (getting :id part of the URL in the Tag component)
    let { container, history } = renderWithWrappers(<Route exact path="/tags/:id"><EditTag /></Route>, {
        route: "/tags/1",
        store: store
    });

    // Wait for tag information to be displayed on the page
    await waitFor(() => getByText(container, "Tag Information"));

    // Check if changing tag attributes modifies the currentTag in the state
    let tagNameInput = getByPlaceholderText(container, "Tag name");
    let tagDescriptionInput = getByPlaceholderText(container, "Tag description");
    fireEvent.change(tagNameInput, { target: { value: "modified tag name" } });
    await waitFor(() => expect(store.getState().tagUI.currentTag.tag_name).toBe("modified tag name"));
    fireEvent.change(tagDescriptionInput, { target: { value: "modified tag description" } });
    await waitFor(() => expect(store.getState().tagUI.currentTag.tag_description).toBe("modified tag description"));

    // Check if cancel button redirects to /tags page and does not modify tag values
    let cancelButton = getByText(container, "Cancel");
    fireEvent.click(cancelButton);
    expect(history.entries[history.length - 1].pathname).toBe("/tags");
    for (let attr of ["tag_id", "tag_name", "tag_description", "created_at", "modified_at"]) {
        expect(store.getState().tags[tag["tag_id"]][attr]).toEqual(tag[attr]);
    }
});


test("Delete a tag", async () => {
    // Route component is required for matching (getting :id part of the URL in the Tag component)
    let { container, store, history } = renderWithWrappers(<Route exact path="/tags/:id"><EditTag /></Route>, {
        route: "/tags/1"
    });

    // Wait for tag information to be displayed on the page
    await waitFor(() => getByText(container, "Tag Information"));
    let deleteButton = getByText(container, "Delete");
    fireEvent.click(deleteButton);

    // Check if confirmation dialog has appeared
    getByText(container, "Delete This Tag?");
    let confimationDialogButtonNo = getByText(container, "No");
    fireEvent.click(confimationDialogButtonNo);
    expect(queryByText(container, "Delete This Tag?")).toBeNull();

    // Check if delete removes the tag and redirects
    deleteButton = getByText(container, "Delete");
    fireEvent.click(deleteButton);
    let confimationDialogButtonYes = getByText(container, "Yes");
    fireEvent.click(confimationDialogButtonYes);

    await waitFor(() => expect(history.entries[history.length - 1].pathname).toBe("/tags"));
    expect(store.getState().tags[1]).toBeUndefined();
});


test("Delete a tag with fetch error", async () => {
    // Route component is required for matching (getting :id part of the URL in the Tag component)
    let { container, store } = renderWithWrappers(<Route exact path="/tags/:id"><EditTag /></Route>, {
        route: "/tags/1"
    });

    // Wait for tag information to be displayed on the page and try to delete the tag
    await waitFor(() => getByText(container, "Tag Information"));
    setFetchFail(true);
    let deleteButton = getByText(container, "Delete");
    fireEvent.click(deleteButton);
    let confimationDialogButtonYes = getByText(container, "Yes");
    fireEvent.click(confimationDialogButtonYes);

    // Check if error message is displayed and tag is not deleted from state
    await waitFor(() => getByText(container, "Failed to fetch data."));
    expect(store.getState().tags[1]).toBeTruthy();
});


test("Save an existing tag", async () => {
    // Route component is required for matching (getting :id part of the URL in the Tag component)
    let { container, store } = renderWithWrappers(<Route exact path="/tags/:id"><EditTag /></Route>, {
        route: "/tags/1"
    });

    // Wait for tag information to be displayed on the page
    await waitFor(() => getByText(container, "Tag Information"));
    let saveButton = getByText(container, "Save");
    let tagNameInput = getByPlaceholderText(container, "Tag name");
    let tagDescriptionInput = getByPlaceholderText(container, "Tag description");
    let oldTag = {...store.getState().tags[1]};

    // Check if existing tag name (in local state) is not saved
    store.dispatch(addTags([ { tag_id: 2, tag_name: "existing tag name", tag_description: "", created_at: (new Date(Date.now() - 24*60*60*1000)).toUTCString(), modified_at: (new Date()).toUTCString() } ]));
    fireEvent.change(tagNameInput, { target: { value: "existing tag name" } });
    await waitFor(() => expect(store.getState().tagUI.currentTag.tag_name).toBe("existing tag name"));
    fireEvent.change(tagDescriptionInput, { target: { value: "modified tag description" } });
    await waitFor(() => expect(store.getState().tagUI.currentTag.tag_description).toBe("modified tag description"));
    fireEvent.click(saveButton);
    await waitFor(() => getByText(container, "already exists", { exact: false }));
    for (let attr of ["tag_name", "tag_description", "created_at", "modified_at"]) {
        expect(store.getState().tags[1][attr]).toEqual(oldTag[attr]);
    }

    // Check if existing tag name (on backend) is not saved
    store.dispatch(deleteTags([2]));
    fireEvent.click(saveButton);
    await waitFor(() => getByText(container, "already exists", { exact: false }));
    for (let attr of ["tag_name", "tag_description", "created_at", "modified_at"]) {
        expect(store.getState().tags[1][attr]).toEqual(oldTag[attr]);
    }
});


test("Update a tag", async () => {
    // Route component is required for matching (getting :id part of the URL in the Tag component)
    let { container, store } = renderWithWrappers(<Route exact path="/tags/:id"><EditTag /></Route>, {
        route: "/tags/1"
    });

    // Wait for tag information to be displayed on the page
    await waitFor(() => getByText(container, "Tag Information"));
    let saveButton = getByText(container, "Save");
    let tagNameInput = getByPlaceholderText(container, "Tag name");
    let tagDescriptionInput = getByPlaceholderText(container, "Tag description");

    // Modify tag attributes and save
    fireEvent.change(tagNameInput, { target: { value: "modified tag name" } });
    await waitFor(() => expect(store.getState().tagUI.currentTag.tag_name).toBe("modified tag name"));
    fireEvent.change(tagDescriptionInput, { target: { value: "modified tag description" } });
    await waitFor(() => expect(store.getState().tagUI.currentTag.tag_description).toBe("modified tag description"));
    fireEvent.click(saveButton);
    await waitFor(() => expect(store.getState().tags[1].tag_name).toEqual("modified tag name"));
    expect(store.getState().tags[1].tag_description).toEqual("modified tag description");
});


test("Update a tag with fetch error", async () => {
    // Route component is required for matching (getting :id part of the URL in the Tag component)
    let { container, store } = renderWithWrappers(<Route exact path="/tags/:id"><EditTag /></Route>, {
        route: "/tags/1"
    });

    // Wait for tag information to be displayed on the page and try modifying the tag
    await waitFor(() => getByText(container, "Tag Information"));
    let tag = {...store.getState().tags[1]};
    let saveButton = getByText(container, "Save");
    let tagNameInput = getByPlaceholderText(container, "Tag name");
    let tagDescriptionInput = getByPlaceholderText(container, "Tag description");
    fireEvent.change(tagNameInput, { target: { value: "error" } });
    await waitFor(() => expect(store.getState().tagUI.currentTag.tag_name).toBe("error"));
    fireEvent.change(tagDescriptionInput, { target: { value: "modified tag description" } });
    await waitFor(() => expect(store.getState().tagUI.currentTag.tag_description).toBe("modified tag description"));
    setFetchFail(true);
    fireEvent.click(saveButton);

    // Check error message is displayed and tag is not modified in the state
    await waitFor(() => getByText(container, "Failed to fetch data."));
    for (let attr of ["tag_name", "tag_description", "created_at", "modified_at"]) {
        expect(store.getState().tags[1][attr]).toEqual(tag[attr]);
    }
});
