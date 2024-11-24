import React from "react";

import { fireEvent } from "@testing-library/react";
import { getByText, getByPlaceholderText, waitFor, getByTitle } from "@testing-library/dom";

import { resetTestConfig } from "../../../../_mocks/config";
import { renderWithWrappers } from "../../../../_util/render";
import { createTestStore } from "../../../../_util/create-test-store";
import { getSideMenuItem } from "../../../../_util/ui-common";
import { getCurrentObject, getObjectTypeSwitchElements, clickGeneralTabButton, clickDataTabButton } from "../../../../_util/ui-objects-edit";
import { getMarkdownEditorElements, setMarkdownRawText, waitForMarkdownHeaderRender } from "../../../../_util/ui-markdown-editor";

import { setNewState } from "../../../../../src/reducers/common";
import { loadEditedObjects } from "../../../../../src/reducers/data/edited-objects";

import { App } from "../../../../../src/components/app";

/*
    /objects/edit/new page tests, general (page load & ui elements).
*/
beforeEach(() => {
    // isolate fetch mock to avoid tests state collision because of cached data in fetch
    jest.isolateModules(() => {
        const { mockFetch, setFetchFail, addCustomRouteResponse } = require("../../../../_mocks/mock-fetch");
        
        // Set test app configuration
        resetTestConfig();

        // reset fetch mocks
        jest.resetAllMocks();
        global.fetch = jest.fn(mockFetch);
        global.setFetchFail = jest.fn(setFetchFail);
        global.addCustomRouteResponse = jest.fn(addCustomRouteResponse);
    });
});


test("Load page with a fetch error", async () => {
    // Add an error when loading tag data
    addCustomRouteResponse("/tags/view", "POST", { generator: body => {
        throw TypeError("NetworkError");
    }});

    // Create a store with an edited new object, which contains an existing tag (which data will be fetched on load)
    const { store } = createTestStore();
    store.dispatch(loadEditedObjects([0]));    // add an edited new object
    const state = store.getState();
    store.dispatch(setNewState({    // add an existing tag ID as new object added tag
        ...state,
        editedObjects: {
            [0]: { ...state.editedObjects[0], addedTags: [100] }
        }
    }));

    // Render page
    let { container } = renderWithWrappers(<App />, {
        route: "/objects/edit/new",
        store
    });

    // Wait for the error message to be displayed
    await waitFor(() => getByText(container, "Failed to fetch data."));
});


test("Render page and click cancel button", async () => {
    let { container, historyManager } = renderWithWrappers(<App />, {
        route: "/objects/edit/new"
    });

    // Wait for the page to load
    await waitFor(() => getByText(container, "Add a New Object"));
    
    // Check if add object page was loaded with empty input fields
    getByText(container, "Add a New Object");
    let objectNameInput = getByPlaceholderText(container, "Object name");
    let objectDescriptionInput = getByPlaceholderText(container, "Object description");
    expect(objectNameInput.value).toBe("");
    expect(objectDescriptionInput.value).toBe("");

    // Check if an empty name can't be submitted
    let saveButton = getSideMenuItem(container, "Save");
    let cancelButton = getSideMenuItem(container, "Cancel");
    expect(saveButton.classList.contains("disabled")).toBeTruthy(); // Semantic UI always adds onClick event to div elements, even if they are disabled (which does nothing in this case)
    // expect(saveButton.onclick).toBeNull(); 

    // Check if cancel button redirects to /objects page
    fireEvent.click(cancelButton);
    historyManager.ensureCurrentURL("/objects/list");
});


test("Select different object types", async () => {
    let { container, store } = renderWithWrappers(<App />, {
        route: "/objects/edit/new"
    });

    // Wait for the page to load
    await waitFor(() => getByText(container, "Add a New Object"));

    // Select markdown object type and check if markdown inputs are rendered
    let { switchContainer, markdownOption } = getObjectTypeSwitchElements(container);
    fireEvent.click(switchContainer);
    fireEvent.click(markdownOption);
    clickDataTabButton(container);
    const markdownContainer = document.querySelector(".markdown-editor-container");
    expect(markdownContainer).toBeTruthy();
    expect(getCurrentObject(store.getState()).object_type).toEqual("markdown");
    getByText(container, "Markdown", { exact: false });

    // Select to-do object type and check if to-do inputs are rendered
    clickGeneralTabButton(container);
    let { toDoListOption } = getObjectTypeSwitchElements(container);
    fireEvent.click(switchContainer);
    fireEvent.click(toDoListOption);
    clickDataTabButton(container);
    const TDLContainer = container.querySelector(".to-do-list-container");
    expect(TDLContainer).toBeTruthy();
    expect(getCurrentObject(store.getState()).object_type).toEqual("to_do_list");

    // Composite subobject selection is tested in composite.test.js

    // Select link object type and check if link inputs are rendered    
    clickGeneralTabButton(container);
    let { linkOption } = getObjectTypeSwitchElements(container);
    fireEvent.click(switchContainer);
    fireEvent.click(linkOption);
    clickDataTabButton(container);
    expect(getCurrentObject(store.getState()).object_type).toEqual("link");
    getByPlaceholderText(container, "Link", { exact: false });
});


test("Object description editor", async () => {
    let { container, store } = renderWithWrappers(<App />, 
        { route: "/objects/edit/new" }
    );

    // Wait for the page to load
    await waitFor(() => getByText(container, "Add a New Object"));

    // Check if `both` mode is selected
    let markdownEditorElements = getMarkdownEditorElements({ container });
    expect(markdownEditorElements.displayModeMenu.bothModeButton.classList.contains("active")).toBeTruthy();
    
    // Set description and check if it was rendered
    setMarkdownRawText(markdownEditorElements.editMarkdownInput, "# Some text");
    await waitForMarkdownHeaderRender({ editorContainer: markdownEditorElements.editorContainer, text: "Some text" });
    expect(store.getState().editedObjects[0].object_description).toBe("# Some text");

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


test("Change markdown display modes & render markdown", async () => {
    let { container, store } = renderWithWrappers(<App />, {
        route: "/objects/edit/new"
    });

    // Wait for the page to load
    await waitFor(() => getByText(container, "Add a New Object"));

    // Change object type
    let { switchContainer, markdownOption } = getObjectTypeSwitchElements(container);
    fireEvent.click(switchContainer);
    fireEvent.click(markdownOption);

    // Select data tab
    clickDataTabButton(container);
    const markdownContainer = document.querySelector(".markdown-editor-container");
    expect(markdownContainer).toBeTruthy();

    // Click on edit mode
    let editModeButton = getByTitle(markdownContainer, "Display edit window")
    fireEvent.click(editModeButton);
    let inputForm = getByPlaceholderText(markdownContainer, "Enter text here...");
    expect(inputForm.textLength).toEqual(0);

    // Insert text
    fireEvent.change(inputForm, { target: { value: "**Test text**" } });
    expect(getCurrentObject(store.getState()).markdown.raw_text).toEqual("**Test text**");

    // Click on view mode & wait for rendered markdown to appear
    let viewModeButton = getByTitle(markdownContainer, "Display parsed markdown");
    fireEvent.click(viewModeButton);
    await waitFor(() => expect(getCurrentObject(store.getState()).markdown.parsed.indexOf("Test text")).toBeGreaterThan(-1));  // wait until there is rendered text to display
    let viewContainer = markdownContainer.querySelector(".markdown-editor-view-container");
    getByText(viewContainer, "Test text");

    // Click on both mode
    let bothModeButton = getByTitle(markdownContainer, "Display edit window and parsed markdown");
    fireEvent.click(bothModeButton);
    inputForm = getByPlaceholderText(markdownContainer, "Enter text here...");
    viewContainer = markdownContainer.querySelector(".markdown-editor-view-container");
    
    // Update markdown & wait for it to appear
    fireEvent.change(inputForm, { target: { value: "**Test text 2**" } });
    await waitFor(() => getByText(viewContainer, "Test text 2"));
});
