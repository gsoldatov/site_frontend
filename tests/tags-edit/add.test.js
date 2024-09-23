import React from "react";

import { fireEvent } from "@testing-library/react";
import { getByText, waitFor } from "@testing-library/dom";

import { resetTestConfig } from "../_mocks/config";
import { renderWithWrappers } from "../_util/render";
import { getTagsEditElements } from "../_util/ui-tags-edit";
import { setMarkdownRawText, waitForMarkdownHeaderRender } from "../_util/ui-markdown-editor";

import { App } from "../../src/components/top-level/app";
import { addTags } from "../../src/actions/data-tags";


/*
    /tags/edit/new page tests.
*/
beforeEach(() => {
    // isolate fetch mock to avoid tests state collision because of cached data in fetch
    jest.isolateModules(() => {
        const { mockFetch, setFetchFail } = require("../_mocks/mock-fetch");
        
        // Set test app configuration
        resetTestConfig();
        
        // reset fetch mocks
        jest.resetAllMocks();
        global.fetch = jest.fn(mockFetch);
        global.setFetchFail = jest.fn(setFetchFail);
    });
});


describe("Basic render & side menu", () => {
    test("Page header", async () => {
        let { container } = renderWithWrappers(<App />, {
            route: "/tags/edit/new"
        });
        
        // Check if page header is rendered
        expect(getTagsEditElements(container).header).toBeTruthy();
    });


    test("Timestamps", async () => {
        let { container } = renderWithWrappers(<App />, {
            route: "/tags/edit/new"
        });
        
        // Check if timestamps are not rendered
        const elements = getTagsEditElements(container);
        expect(elements.createdAt).toBeFalsy();
        expect(elements.modifiedAt).toBeFalsy();
    });


    test("Save button", async () => {
        let { container } = renderWithWrappers(<App />, {
            route: "/tags/edit/new"
        });

        // Check if save button is disabled if no tag name is entered
        const { saveButton } = getTagsEditElements(container).sideMenu;
        expect(saveButton.classList.contains("disabled")).toBeTruthy(); // Semantic UI always adds onClick event to div elements, even if they are disabled (which does nothing in this case)

        // Check if save button is enabled when input text has minimal length
        const { tagNameInput } = getTagsEditElements(container);
        fireEvent.change(tagNameInput, { target: { value: "a" } });
        expect(saveButton.classList.contains("disabled")).toBeFalsy();

        // Check if save button is disabled when input text exceeds maximum length
        fireEvent.change(tagNameInput, { target: { value: "a".repeat(256) } });
        expect(saveButton.classList.contains("disabled")).toBeTruthy();

        // Check if save button is disabled when input text has maximum length
        fireEvent.change(tagNameInput, { target: { value: "a".repeat(255) } });
        expect(saveButton.classList.contains("disabled")).toBeFalsy();
    });


    test("Cancel button", async () => {
        let { container, historyManager } = renderWithWrappers(<App />, {
            route: "/tags/edit/new"
        });

        // Check if cancel button redirects to /tags page
        fireEvent.click(getTagsEditElements(container).sideMenu.cancelButton);
        historyManager.ensureCurrentURL("/tags/list");
    });
});


describe("Edit & save", () => {
    test("Modify tag name and try saving an existing (in local state) tag name", async () => {
        let { container, store } = renderWithWrappers(<App />, {
            route: "/tags/edit/new"
        });

        // Check if input is updating the state
        const { tagNameInput } = getTagsEditElements(container);
        fireEvent.change(tagNameInput, { target: { value: "existing tag_name" } });
        expect(store.getState().tagUI.currentTag.tag_name).toBe("existing tag_name");

        // Check if existing tag_name (in store) is not added
        store.dispatch(addTags([{ tag_id: 1, tag_name: "existing tag_name", tag_description: "", created_at: new Date(), modified_at: new Date() }]));
        const { saveButton } = getTagsEditElements(container).sideMenu;
        fireEvent.click(saveButton);
        await waitFor(() => {
            const { tagSaveError } = getTagsEditElements(container);
            getByText(tagSaveError, "already exists", { exact: false });
        });
    });


    test("Tag description editor", async () => {
        let { container, store } = renderWithWrappers(<App />, {
            route: "/tags/edit/new"
        });
    
        // Check if `both` mode is selected
        let tagDescription = getTagsEditElements(container).tagDescription;
        expect(tagDescription.displayModeMenu.bothModeButton.classList.contains("active")).toBeTruthy();
        
        // Set description and check if it was rendered
        setMarkdownRawText(tagDescription.editMarkdownInput, "# Some text");
        await waitForMarkdownHeaderRender({ editorContainer: tagDescription.editorContainer, text: "Some text" });
        expect(store.getState().tagUI.currentTag.tag_description).toBe("# Some text");
    
        // Click and check `view` mode
        fireEvent.click(tagDescription.displayModeMenu.viewModeButton);
        tagDescription = getTagsEditElements(container).tagDescription;
        expect(tagDescription.displayModeMenu.viewModeButton.classList.contains("active")).toBeTruthy();
        expect(tagDescription.renderedMarkdown).toBeTruthy();
        expect(tagDescription.editMarkdownInput).toBeFalsy();
    
        // Click and check `edit` mode
        fireEvent.click(tagDescription.displayModeMenu.editModeButton);
        tagDescription = getTagsEditElements(container).tagDescription;
        expect(tagDescription.displayModeMenu.editModeButton.classList.contains("active")).toBeTruthy();
        expect(tagDescription.renderedMarkdown).toBeFalsy();
        expect(tagDescription.editMarkdownInput).toBeTruthy();
    
        // Click and check `both` mode
        fireEvent.click(tagDescription.displayModeMenu.bothModeButton);
        tagDescription = getTagsEditElements(container).tagDescription;
        expect(tagDescription.displayModeMenu.bothModeButton.classList.contains("active")).toBeTruthy();
        expect(tagDescription.renderedMarkdown).toBeTruthy();
        expect(tagDescription.editMarkdownInput).toBeTruthy();
    });


    test("Try saving an existing (on backend) tag name", async () => {
        let { container, store } = renderWithWrappers(<App />, {
            route: "/tags/edit/new"
        });

        // Check if existing tag_name (on backend) is not added
        const elements = getTagsEditElements(container);
        fireEvent.change(elements.tagNameInput, { target: { value: "existing tag_name" } });
        await waitFor(() => expect(store.getState().tagUI.currentTag.tag_name).toBe("existing tag_name"));  // wait for tag_name to be updated in state
        fireEvent.click(elements.sideMenu.saveButton);
        await waitFor(() => {
            const { tagSaveError } = getTagsEditElements(container);
            getByText(tagSaveError, "already exists", { exact: false });
        });
    });


    test("Handle fetch error", async () => {
        let { container, store, historyManager } = renderWithWrappers(<App />, {
            route: "/tags/edit/new"
        });
    
        // Check if an error message is displayed and tag is not added to the state
        const elements = getTagsEditElements(container);
        fireEvent.change(elements.tagNameInput, { target: { value: "some name" } });
        await waitFor(() => expect(store.getState().tagUI.currentTag.tag_name).toBe("some name"));  // wait for tag_name to be updated in state
        setFetchFail(true);

        fireEvent.click(elements.sideMenu.saveButton);
        await waitFor(() => {
            const { tagSaveError } = getTagsEditElements(container);
            getByText(tagSaveError, "Failed to fetch data.");
        });
        historyManager.ensureCurrentURL("/tags/edit/new");
        expect(store.getState().tags[1000]).toBeUndefined();
    });


    test("Save new tag, tag name", async () => {
        let { container, store, historyManager } = renderWithWrappers(<App />, 
            { route: "/tags/edit/new" }
        );

        let elements = getTagsEditElements(container);

        // Modify tag name
        fireEvent.change(elements.tagNameInput, { target: { value: "new tag" } });
        expect(store.getState().tagUI.currentTag.tag_name).toBe("new tag");

        // Click save and check if redirect to saved tag's edit page occured
        fireEvent.click(elements.sideMenu.saveButton);
        await waitFor(() => expect(store.getState().tagUI.currentTag.tag_id).toBeGreaterThan(0));
        let tag_id = store.getState().tagUI.currentTag.tag_id;
        historyManager.ensureCurrentURL(`/tags/edit/${tag_id}`);
        elements = getTagsEditElements(container);
        expect(elements.tagNameInput.value).toEqual(store.getState().tags[tag_id].tag_name);
    });


    test("Save new tag, tag description", async () => {
        let { container, store, historyManager } = renderWithWrappers(<App />, 
            { route: "/tags/edit/new" }
        );

        let elements = getTagsEditElements(container);

        // Modify tag name & description
        fireEvent.change(elements.tagNameInput, { target: { value: "new tag" } });
        expect(store.getState().tagUI.currentTag.tag_name).toBe("new tag");

        setMarkdownRawText(elements.tagDescription.editMarkdownInput, "# Some text");
        await waitForMarkdownHeaderRender({ editorContainer: elements.tagDescription.editorContainer, text: "Some text" });
        expect(store.getState().tagUI.currentTag.tag_description).toBe("# Some text");

        // Click save and check if redirect to saved tag's edit page occured
        fireEvent.click(elements.sideMenu.saveButton);
        await waitFor(() => expect(store.getState().tagUI.currentTag.tag_id).toBeGreaterThan(0));
        let tag_id = store.getState().tagUI.currentTag.tag_id;
        historyManager.ensureCurrentURL(`/tags/edit/${tag_id}`);
        elements = getTagsEditElements(container);
        expect(elements.tagDescription.editMarkdownInput.value).toEqual(store.getState().tags[tag_id].tag_description);
    });


    test("Save new tag, publish tag", async () => {
        let { container, store, historyManager } = renderWithWrappers(<App />, 
            { route: "/tags/edit/new" }
        );

        let elements = getTagsEditElements(container);

        // Modify tag name & is_published
        fireEvent.change(elements.tagNameInput, { target: { value: "new tag" } });
        expect(store.getState().tagUI.currentTag.tag_name).toBe("new tag");

        expect(elements.publishTagCheckbox.checked).toBeTruthy();
        for (let i = 0; i < 3; i++) {
            fireEvent.click(elements.publishTagCheckbox);
            expect(store.getState().tagUI.currentTag.is_published).toEqual(Boolean(i % 2));
            expect(elements.publishTagCheckbox.checked).toEqual(Boolean(i % 2));
        }

        // Click save and check if redirect to saved tag's edit page occured
        fireEvent.click(elements.sideMenu.saveButton);
        await waitFor(() => expect(store.getState().tagUI.currentTag.tag_id).toBeGreaterThan(0));
        let tag_id = store.getState().tagUI.currentTag.tag_id;
        historyManager.ensureCurrentURL(`/tags/edit/${tag_id}`);
        elements = getTagsEditElements(container);
        expect(store.getState().tagUI.currentTag.is_published).toBeFalsy();
        expect(elements.publishTagCheckbox.checked).toBeFalsy();
    });
});
