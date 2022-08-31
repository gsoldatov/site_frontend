import React from "react";

import { fireEvent } from "@testing-library/react";
import { getByText, getByPlaceholderText, waitFor } from "@testing-library/dom";

import { renderWithWrappers } from "../_util/render";
import { getSideMenuItem } from "../_util/ui-common";
import { getMarkdownEditorElements, setMarkdownRawText, waitForMarkdownHeaderRender } from "../_util/ui-markdown-editor";

import { App } from "../../src/components/top-level/app";
import { addTags } from "../../src/actions/data-tags";


/*
    /tags/edit/new page tests.
*/
beforeEach(() => {
    // isolate fetch mock to avoid tests state collision because of cached data in fetch
    jest.isolateModules(() => {
        const { mockFetch, setFetchFail } = require("../_mocks/mock-fetch");
        // reset fetch mocks
        jest.resetAllMocks();
        global.fetch = jest.fn(mockFetch);
        global.setFetchFail = jest.fn(setFetchFail);
    });
});


test("Render and click cancel button", async () => {
    let { container, history } = renderWithWrappers(<App />, {
        route: "/tags/edit/new"
    });
    
    // Check if add tag page was loaded with empty input fields
    let addTagHeader = getByText(container, "Add a New Tag");
    let tagNameInput = getByPlaceholderText(container, "Tag name");
    let tagDescriptionInput = getByPlaceholderText(container, "Tag description");
    expect(tagNameInput.value).toBe("");
    expect(tagDescriptionInput.value).toBe("");

    // Check if an empty name can't be submitted
    let saveButton = getSideMenuItem(container, "Save");
    let cancelButton = getSideMenuItem(container, "Cancel");
    expect(saveButton.classList.contains("disabled")).toBeTruthy(); // Semantic UI always adds onClick event to div elements, even if they are disabled (which does nothing in this case)
    // expect(saveButton.onclick).toBeNull();

    // Check if cancel button redirects to /tags page
    fireEvent.click(cancelButton);
    expect(history.entries[history.length - 1].pathname).toBe("/tags/list");
});


test("Modify tag name and try saving an existing (in local state) tag name", async () => {
    let { container, store } = renderWithWrappers(<App />, {
        route: "/tags/edit/new"
    });

    // Check if input is updating the state
    let tagNameInput = getByPlaceholderText(container, "Tag name");
    let tagDescriptionInput = getByPlaceholderText(container, "Tag description");
    let saveButton = getSideMenuItem(container, "Save");
    fireEvent.change(tagNameInput, { target: { value: "existing tag_name" } });
    await waitFor(() => expect(store.getState().tagUI.currentTag.tag_name).toBe("existing tag_name"));
    fireEvent.change(tagDescriptionInput, { target: { value: "tag description" } });
    await waitFor(() => expect(store.getState().tagUI.currentTag.tag_description).toBe("tag description"));
    
    // Check if existing tag_name (in store) is not added
    store.dispatch(addTags([{ tag_id: 1, tag_name: "existing tag_name", tag_description: "", created_at: new Date(), modified_at: new Date() }]));
    saveButton = getSideMenuItem(container, "Save");
    fireEvent.click(saveButton);
    await waitFor(() => getByText(container, "already exists", { exact: false }));
});


test("Tag description editor", async () => {
    let { container, store } = renderWithWrappers(<App />, {
        route: "/tags/edit/new"
    });

    // Check if `both` mode is selected
    let markdownEditorElements = getMarkdownEditorElements({ container });
    expect(markdownEditorElements.displayModeMenu.bothModeButton.classList.contains("active")).toBeTruthy();
    
    // Set description and check if it was rendered
    setMarkdownRawText(markdownEditorElements.editMarkdownInput, "# Some text");
    await waitForMarkdownHeaderRender({ editorContainer: markdownEditorElements.editorContainer, text: "Some text" });
    expect(store.getState().tagUI.currentTag.tag_description).toBe("# Some text");

    // Click and check `view` mode
    fireEvent.click(markdownEditorElements.displayModeMenu.viewModeButton);
    markdownEditorElements = getMarkdownEditorElements({ container });
    expect(markdownEditorElements.displayModeMenu.viewModeButton.classList.contains("active")).toBeTruthy();
    expect(markdownEditorElements.renderedMarkdown).toBeTruthy();
    expect(markdownEditorElements.editMarkdownInput).toBeFalsy();

    // Click and check `edit` mode
    fireEvent.click(markdownEditorElements.displayModeMenu.editModeButton);
    markdownEditorElements = getMarkdownEditorElements({ container });
    expect(markdownEditorElements.displayModeMenu.editModeButton.classList.contains("active")).toBeTruthy();
    expect(markdownEditorElements.renderedMarkdown).toBeFalsy();
    expect(markdownEditorElements.editMarkdownInput).toBeTruthy();

    // Click and check `both` mode
    fireEvent.click(markdownEditorElements.displayModeMenu.bothModeButton);
    markdownEditorElements = getMarkdownEditorElements({ container });
    expect(markdownEditorElements.displayModeMenu.bothModeButton.classList.contains("active")).toBeTruthy();
    expect(markdownEditorElements.renderedMarkdown).toBeTruthy();
    expect(markdownEditorElements.editMarkdownInput).toBeTruthy();
});


test("Try saving an existing (on backend) tag name", async () => {
    let { container, store } = renderWithWrappers(<App />, {
        route: "/tags/edit/new"
    });

    // Check if existing tag_name (on backend) is not added
    let tagNameInput = getByPlaceholderText(container, "Tag name");
    let saveButton = getSideMenuItem(container, "Save");
    fireEvent.change(tagNameInput, { target: { value: "existing tag_name" } });
    await waitFor(() => expect(store.getState().tagUI.currentTag.tag_name).toBe("existing tag_name"));  // wait for tag_name to be updated in state
    fireEvent.click(saveButton);
    await waitFor(() => getByText(container, "already exists", { exact: false }));
});


test("Handle fetch error", async () => {
    let { container, history, store } = renderWithWrappers(<App />, {
        route: "/tags/edit/new"
    });

    // Check if an error message is displayed and tag is not added to the state
    let tagNameInput = getByPlaceholderText(container, "Tag name");
    let saveButton = getSideMenuItem(container, "Save");
    fireEvent.change(tagNameInput, { target: { value: "error" } });
    await waitFor(() => expect(store.getState().tagUI.currentTag.tag_name).toBe("error"));  // wait for tag_name to be updated in state
    setFetchFail(true);
    fireEvent.click(saveButton);
    await waitFor(() => getByText(container, "Failed to fetch data."));
    expect(history.entries[history.length - 1].pathname).toBe("/tags/edit/new");
    expect(store.getState().tags[1000]).toBeUndefined();
});


test("Save a new tag", async () => {
    let { container, history, store } = renderWithWrappers(<App />, 
        { route: "/tags/edit/new" }
    );

    let tagNameInput = getByPlaceholderText(container, "Tag name");
    let tagDescriptionInput = getByPlaceholderText(container, "Tag description");
    let saveButton = getSideMenuItem(container, "Save");

    // Check if tag is redirected after adding a correct tag
    fireEvent.change(tagNameInput, { target: { value: "new tag" } });
    await waitFor(() => expect(store.getState().tagUI.currentTag.tag_name).toBe("new tag"));
    fireEvent.change(tagDescriptionInput, { target: { value: "new tag description" } });
    await waitFor(() => expect(store.getState().tagUI.currentTag.tag_description).toBe("new tag description"));
    fireEvent.click(saveButton);
    await waitFor(() => expect(store.getState().tagUI.currentTag.tag_id).toBeGreaterThan(0));
    let tag_id = store.getState().tagUI.currentTag.tag_id;
    expect(history.entries[history.length - 1].pathname).toBe(`/tags/edit/${tag_id}`);
    let tag = store.getState().tags[tag_id];
    expect(getByPlaceholderText(container, "Tag name").value).toEqual(tag["tag_name"]);
    expect(getByPlaceholderText(container, "Tag description").value).toEqual(tag["tag_description"]);
    // getByText(container, tag["created_at"]);
    // getByText(container, tag["modified_at"]);
    getByText(container, "Created at:");
    getByText(container, "Modified at:");
});
