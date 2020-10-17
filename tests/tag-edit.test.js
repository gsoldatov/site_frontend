import React from "react";
import { Route } from "react-router-dom";

import { fireEvent } from "@testing-library/react";
import { getByText, getByLabelText, waitFor, queryByText } from '@testing-library/dom'

import { mockFetch, setFetchFailParams } from "./mocks/mock-fetch";
import { renderWithWrappers } from "./test-utils";
import createStore from "../src/store/create-store";

import { EditTag } from "../src/components/tag/tag";
import { addTags, deleteTags } from "../src/actions/tags";

beforeAll(() => {
    global.fetch = jest.fn(mockFetch);
});

afterAll(() => {
    setFetchFailParams();   // reset fetch params
    jest.resetAllMocks();
})

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
    expect(saveButton.onclick).toBeNull();
    expect(deleteButton.onclick).toBeNull();
});

test("Load a tag with fetch error", async () => {
    setFetchFailParams(true, "Test view fetch error");

    // Route component is required for matching (getting :id part of the URL in the Tag component)
    let { container } = renderWithWrappers(<Route exact path="/tags/:id"><EditTag /></Route>, {
        route: "/tags/1"
    });

    // Check if error message if displayed
    await waitFor(() => getByText(container, "Test view fetch error", { exact: false }));
    setFetchFailParams();   // reset fetch params
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
    let tagNameInput = getByLabelText(container, "Tag name");
    let tagDescriptionInput = getByLabelText(container, "Tag description");
    expect(tagNameInput.value).toEqual("tag name");
    expect(tagDescriptionInput.value).toEqual("tag description");
    getByText(container, tag.created_at);
    getByText(container, tag.modified_at);
});

test("Load a tag from backend", async () => {
    // Route component is required for matching (getting :id part of the URL in the Tag component)
    let { container, store } = renderWithWrappers(<Route exact path="/tags/:id"><EditTag /></Route>, {
        route: "/tags/1"
    });

    // Check if tag information is displayed on the page
    await waitFor(() => getByText(container, "Tag Information"));
    let tag = store.getState().tags[1];
    let tagNameInput = getByLabelText(container, "Tag name");
    let tagDescriptionInput = getByLabelText(container, "Tag description");
    expect(tagNameInput.value).toEqual(tag.tag_name);
    expect(tagDescriptionInput.value).toEqual(tag.tag_description);
    getByText(container, tag.created_at);
    getByText(container, tag.modified_at);
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
    let tagNameInput = getByLabelText(container, "Tag name");
    let tagDescriptionInput = getByLabelText(container, "Tag description");
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
    getByText(container, "Delete this tag?");
    let confimationDialogButtonNo = getByText(container, "No");
    fireEvent.click(confimationDialogButtonNo);
    expect(queryByText(container, "Delete this tag?")).toBeNull();

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
    setFetchFailParams(true, "Test delete fetch error");
    let deleteButton = getByText(container, "Delete");
    fireEvent.click(deleteButton);
    let confimationDialogButtonYes = getByText(container, "Yes");
    fireEvent.click(confimationDialogButtonYes);

    // Check if error message is displayed and tag is not deleted from state
    await waitFor(() => getByText(container, "Test delete fetch error"));
    expect(store.getState().tags[1]).toBeTruthy();
    setFetchFailParams();   // reset fetch params
});

test("Save an existing tag", async () => {
    // Route component is required for matching (getting :id part of the URL in the Tag component)
    let { container, store } = renderWithWrappers(<Route exact path="/tags/:id"><EditTag /></Route>, {
        route: "/tags/1"
    });

    // Wait for tag information to be displayed on the page
    await waitFor(() => getByText(container, "Tag Information"));
    let saveButton = getByText(container, "Save");
    let tagNameInput = getByLabelText(container, "Tag name");
    let tagDescriptionInput = getByLabelText(container, "Tag description");
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
    let tagNameInput = getByLabelText(container, "Tag name");
    let tagDescriptionInput = getByLabelText(container, "Tag description");

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
    let tagNameInput = getByLabelText(container, "Tag name");
    let tagDescriptionInput = getByLabelText(container, "Tag description");
    fireEvent.change(tagNameInput, { target: { value: "error" } });
    await waitFor(() => expect(store.getState().tagUI.currentTag.tag_name).toBe("error"));
    fireEvent.change(tagDescriptionInput, { target: { value: "modified tag description" } });
    await waitFor(() => expect(store.getState().tagUI.currentTag.tag_description).toBe("modified tag description"));
    setFetchFailParams(true, "Test update fetch error");
    fireEvent.click(saveButton);

    // Check error message is displayed and tag is not modified in the state
    await waitFor(() => getByText(container, "Test update fetch error"));
    for (let attr of ["tag_name", "tag_description", "created_at", "modified_at"]) {
        expect(store.getState().tags[1][attr]).toEqual(tag[attr]);
    }
    setFetchFailParams();   // reset fetch params
});