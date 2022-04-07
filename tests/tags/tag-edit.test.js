import React from "react";
import ReactDOM from "react-dom";

import { fireEvent } from "@testing-library/react";
import { getByText, getByPlaceholderText, waitFor } from "@testing-library/dom";

import { getSideMenuDialogControls, getSideMenuItem } from "../_util/ui-common";
import { renderWithWrappers } from "../_util/render";
import { createTestStore } from "../_util/create-test-store";
import { getMarkdownEditorElements, setMarkdownRawText, waitForMarkdownHeaderRender } from "../_util/ui-markdown-editor";

import { App } from "../../src/components/top-level/app";
import { addTags, deleteTags } from "../../src/actions/data-tags";


/*
    /tags/edit page tests.
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


test("Load a non-existing tag + check buttons", async () => {
    let { container } = renderWithWrappers(<App />, {
        route: "/tags/9999"
    });

    // Check if error message if displayed
    await waitFor(() => getByText(container, "not found", { exact: false }));

    // Check if save and delete buttons can't be clicked if tag fetch failed
    let saveButton = getSideMenuItem(container, "Save");
    let deleteButton = getSideMenuItem(container, "Delete");
    expect(saveButton.classList.contains("disabled")).toBeTruthy(); // Semantic UI always adds onClick event to div elements, even if they are disabled (which does nothing in this case)
    // expect(saveButton.onclick).toBeNull();  
    expect(deleteButton.classList.contains("disabled")).toBeTruthy();
    // expect(deleteButton.onclick).toBeNull();
});


test("Load tags with invalid IDs", async () => {
    for (let tagID of ["0", "str"]) {
        // Route component is required for matching (getting :id part of the URL in the component)
        let { container } = renderWithWrappers(<App />, {
            route: `/tags/${tagID}`
        });
    
        // Check if error message if displayed
        await waitFor(() => getByText(container, "not found", { exact: false }));

        ReactDOM.unmountComponentAtNode(container);
    }
});


test("Load a tag with fetch error", async () => {
    setFetchFail(true);

    let { container } = renderWithWrappers(<App />, {
        route: "/tags/1"
    });

    // Check if error message if displayed
    await waitFor(() => getByText(container, "Failed to fetch data.", { exact: false }));
});


test("Load a tag from state", async () => {
    let store = createTestStore({ enableDebugLogging: false });
    let tag = { tag_id: 1, tag_name: "tag name", tag_description: "tag description", created_at: (new Date(Date.now() - 24*60*60*1000)).toUTCString(), modified_at: (new Date()).toUTCString() };
    store.dispatch(addTags([tag]));
    let { container } = renderWithWrappers(<App />, {
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
    let { container, store } = renderWithWrappers(<App />, {
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
    let { container, history } = renderWithWrappers(<App />, 
        { route: "/tags/1" }
    );

    // Check if tag information is displayed on the page
    await waitFor(() => getByText(container, "Tag Information"));
    let addTagButton = getSideMenuItem(container, "Add a New Tag");
    fireEvent.click(addTagButton);
    expect(history.entries[history.length - 1].pathname).toBe("/tags/new");
});


test("Tag description editor", async () => {
    let { container, store } = renderWithWrappers(<App />, 
        { route: "/tags/1" }
    );

    // Check if tag information is displayed on the page
    await waitFor(() => getByText(container, "Tag Information"));

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


test("Modify a tag and click cancel", async () => {
    let store = createTestStore({ enableDebugLogging: false });
    let tag = { tag_id: 1, tag_name: "tag name", tag_description: "tag description", created_at: (new Date(Date.now() - 24*60*60*1000)).toUTCString(), modified_at: (new Date()).toUTCString() };
    store.dispatch(addTags([tag]));
    let { container, history } = renderWithWrappers(<App />, {
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
    let cancelButton = getSideMenuItem(container, "Cancel");
    fireEvent.click(cancelButton);
    expect(history.entries[history.length - 1].pathname).toBe("/tags");
    for (let attr of ["tag_id", "tag_name", "tag_description", "created_at", "modified_at"]) {
        expect(store.getState().tags[tag["tag_id"]][attr]).toEqual(tag[attr]);
    }
});


test("Delete a tag", async () => {
    let { container, store, history } = renderWithWrappers(<App />, {
        route: "/tags/1"
    });

    // Wait for tag information to be displayed on the page
    await waitFor(() => getByText(container, "Tag Information"));
    let deleteButton = getSideMenuItem(container, "Delete");
    fireEvent.click(deleteButton);

    // Check if confirmation dialog has appeared
    expect(getSideMenuDialogControls(container).header.title).toEqual("Delete This Tag?");
    fireEvent.click(getSideMenuDialogControls(container).buttons["No"]);
    expect(getSideMenuDialogControls(container)).toBeNull();

    // Check if delete removes the tag and redirects
    deleteButton = getSideMenuItem(container, "Delete");
    fireEvent.click(deleteButton);
    fireEvent.click(getSideMenuDialogControls(container).buttons["Yes"]);

    await waitFor(() => expect(store.getState().tags[1]).toBeUndefined());
    await waitFor(() => expect(history.entries[history.length - 1].pathname).toBe("/tags"));
});


test("Delete a tag with fetch error", async () => {
    let { container, store } = renderWithWrappers(<App />, {
        route: "/tags/1"
    });

    // Wait for tag information to be displayed on the page and try to delete the tag
    await waitFor(() => getByText(container, "Tag Information"));
    setFetchFail(true);
    let deleteButton = getSideMenuItem(container, "Delete");
    fireEvent.click(deleteButton);
    fireEvent.click(getSideMenuDialogControls(container).buttons["Yes"]);

    // Check if error message is displayed and tag is not deleted from state
    await waitFor(() => getByText(container, "Failed to fetch data."));
    expect(store.getState().tags[1]).toBeTruthy();
});


test("Save an existing tag", async () => {
    let { container, store } = renderWithWrappers(<App />, {
        route: "/tags/1"
    });

    // Wait for tag information to be displayed on the page
    await waitFor(() => getByText(container, "Tag Information"));
    let saveButton = getSideMenuItem(container, "Save");
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
    let { container, store } = renderWithWrappers(<App />, {
        route: "/tags/1"
    });

    // Wait for tag information to be displayed on the page
    await waitFor(() => getByText(container, "Tag Information"));
    let saveButton = getSideMenuItem(container, "Save");
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
    let { container, store } = renderWithWrappers(<App />, {
        route: "/tags/1"
    });

    // Wait for tag information to be displayed on the page and try modifying the tag
    await waitFor(() => getByText(container, "Tag Information"));
    let tag = {...store.getState().tags[1]};
    let saveButton = getSideMenuItem(container, "Save");
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
