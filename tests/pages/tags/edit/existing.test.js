import React from "react";
import ReactDOM from "react-dom";

import { fireEvent } from "@testing-library/react";
import { getByText, waitFor } from "@testing-library/dom";

import { resetTestConfig } from "../../../_mocks/config";
import { getSideMenuDialogControls, getSideMenuItem } from "../../../_util/ui-common";
import { compareArrays } from "../../../_util/data-checks";
import { getTagsViewElements } from "../../../_util/ui-tags-view";
import { renderWithWrappers } from "../../../_util/render";
import { createTestStore } from "../../../_util/create-test-store";
import { setMarkdownRawText, waitForMarkdownHeaderRender } from "../../../_util/ui-markdown-editor";
import { getTag } from "../../../_mocks/data-tags";
import { generateObjectAttributes } from "../../../_mocks/data-objects";

import { App } from "../../../../src/components/app";
import { addTags } from "../../../../src/reducers/data/tags";
import { addObjectsTags } from "../../../../src/reducers/data/objects-tags";
import { addObjectsAttributes } from "../../../../src/reducers/data/objects";

import { getTagsEditElements } from "../../../_util/ui-tags-edit";


/*
    /tags/edit/:id page tests.
*/
beforeEach(() => {
    // isolate fetch mock to avoid tests state collision because of cached data in fetch
    jest.isolateModules(() => {
        const { mockFetch, setFetchFail } = require("../../../_mocks/mock-fetch");
        
        // Set test app configuration
        resetTestConfig();
        
        // reset fetch mocks
        jest.resetAllMocks();
        global.fetch = jest.fn(mockFetch);
        global.setFetchFail = jest.fn(setFetchFail);
    });
});


describe("Page load & render", () => {
    test("Load a non-existing tag + check buttons", async () => {
        let { container } = renderWithWrappers(<App />, {
            route: "/tags/edit/9999"
        });
    
        // Check if error message if displayed
        await waitFor(() => {
            const elements = getTagsEditElements(container);
            expect(elements.placeholders.fetchError).toBeTruthy();
            getByText(elements.placeholders.fetchError, "not found", { exact: false });

            // Check if side menu buttons are disabled
            expect(elements.sideMenu.saveButton.classList.contains("disabled")).toBeTruthy();
            expect(elements.sideMenu.deleteButton.classList.contains("disabled")).toBeTruthy();
        });
    });
    
    
    test("Load tags with invalid IDs", async () => {
        for (let tagID of ["0", "str"]) {
            // Route component is required for matching (getting :id part of the URL in the component)
            let { container } = renderWithWrappers(<App />, {
                route: `/tags/edit/${tagID}`
            });
        
            // Check if error message if displayed
            await waitFor(() => {
                const elements = getTagsEditElements(container);
                expect(elements.placeholders.fetchError).toBeTruthy();
                getByText(elements.placeholders.fetchError, "not found", { exact: false });
            });
    
            ReactDOM.unmountComponentAtNode(container);
        }
    });
    
    
    test("Load a tag with fetch error", async () => {
        setFetchFail(true);
    
        let { container } = renderWithWrappers(<App />, {
            route: "/tags/edit/1"
        });
    
        // Check if error message if displayed
        await waitFor(() => {
            const elements = getTagsEditElements(container);
            expect(elements.placeholders.fetchError).toBeTruthy();
            getByText(elements.placeholders.fetchError, "Failed to fetch data.", { exact: false });
        });
    });
    
    
    test("Load a tag from state", async () => {
        const { store } = createTestStore();
        const tag = getTag({ tag_id: 1, is_published: false });
        store.dispatch(addTags([tag]));
        let { container } = renderWithWrappers(<App />, {
            route: "/tags/edit/1", store
        });
    
        // Check if tag information is displayed on the page
        await waitFor(() => expect(getTagsEditElements(container).header).toBeTruthy());

        const elements = getTagsEditElements(container);
        expect(elements.tagNameInput.value).toEqual(tag.tag_name);
        expect(elements.tagDescription.editMarkdownInput.value).toEqual(tag.tag_description);
        expect(elements.publishTagCheckbox.checked).toEqual(tag.is_published);

        expect(elements.createdAt).toBeTruthy();
        expect(elements.modifiedAt).toBeTruthy();
    });
    
    
    test("Load a tag from backend", async () => {
        let { container, store } = renderWithWrappers(<App />, {
            route: "/tags/edit/1"
        });
    
        // Check if tag information is displayed on the page
        await waitFor(() => expect(getTagsEditElements(container).header).toBeTruthy());

        const elements = getTagsEditElements(container);
        const tag = store.getState().tags[1];

        expect(elements.tagNameInput.value).toEqual(tag.tag_name);
        expect(elements.tagDescription.editMarkdownInput.value).toEqual(tag.tag_description);
        expect(elements.publishTagCheckbox.checked).toEqual(tag.is_published);

        expect(elements.createdAt).toBeTruthy();
        expect(elements.modifiedAt).toBeTruthy();
    });
});


describe("Side menu ", () => {
    test("'Add Tag' button", async () => {
        let { container, historyManager } = renderWithWrappers(<App />, 
            { route: "/tags/edit/1" }
        );

        // Check if tag information is displayed on the page
        await waitFor(() => expect(getTagsEditElements(container).header).toBeTruthy());

        // Click button
        fireEvent.click(getTagsEditElements(container).sideMenu.addNewTagButton);
        historyManager.ensureCurrentURL("/tags/edit/new");
    });


    test("'View Tag' button", async () => {
        let { container, historyManager } = renderWithWrappers(<App />, 
            { route: "/tags/edit/1" }
        );
    
        // Check if tag information is displayed on the page
        await waitFor(() => expect(getTagsEditElements(container).header).toBeTruthy());
        
        // Click button
        fireEvent.click(getTagsEditElements(container).sideMenu.viewTagButton);
        historyManager.ensureCurrentURL("/tags/view");
        historyManager.ensureCurrentURLParams("?tagIDs=1");
        await waitFor(() => expect(getTagsViewElements(container).feed.placeholders.loading).toBeFalsy());
    });


    test("'Cancel' button", async () => {
        const { store } = createTestStore();
        const tag = getTag({ tag_id: 1 });
        store.dispatch(addTags([tag]));
        let { container, historyManager } = renderWithWrappers(<App />, {
            route: "/tags/edit/1", store
        });

        // Wait for tag information to be displayed on the page
        await waitFor(() => expect(getTagsEditElements(container).header).toBeTruthy());

        // Modify tag name & description
        const elements = getTagsEditElements(container);
        fireEvent.change(elements.tagNameInput, { target: { value: "modified tag name" } });
        setMarkdownRawText(elements.tagDescription.editMarkdownInput, "modified tag description");

        // Click button and check redirect & state
        fireEvent.click(elements.sideMenu.cancelButton);
        historyManager.ensureCurrentURL("/tags/list");
        for (let attr of Object.keys(tag)) expect(store.getState().tags[tag.tag_id][attr]).toEqual(tag[attr]);
    });


    test("Delete a tag", async () => {
        let { container, store, historyManager } = renderWithWrappers(<App />, {
            route: "/tags/edit/1"
        });

        // Wait for tag information to be displayed on the page
        await waitFor(() => expect(getTagsEditElements(container).header).toBeTruthy());

        // Click delete button & cancel deletion
        fireEvent.click(getTagsEditElements(container).sideMenu.deleteButton);
        let elements = getTagsEditElements(container);
        expect(elements.sideMenu.deleteDialogControls.header.title).toEqual("Delete This Tag?");
        fireEvent.click(elements.sideMenu.deleteDialogControls.buttons["No"]);
        elements = getTagsEditElements(container);
        expect(elements.sideMenu.deleteDialogControls).toBeNull();

        // Click delete button & confirm deletion
        fireEvent.click(getTagsEditElements(container).sideMenu.deleteButton);
        fireEvent.click(getTagsEditElements(container).sideMenu.deleteDialogControls.buttons["Yes"]);
        await waitFor(() => expect(store.getState().tags[1]).toBeUndefined());
        await historyManager.waitForCurrentURLToBe("/tags/list");
    });


    test("Delete a tag with fetch error", async () => {
        let { container, store } = renderWithWrappers(<App />, {
            route: "/tags/edit/1"
        });

        // Wait for tag information to be displayed on the page and try to delete the tag
        await waitFor(() => expect(getTagsEditElements(container).header).toBeTruthy());
        setFetchFail(true);
        fireEvent.click(getTagsEditElements(container).sideMenu.deleteButton);
        fireEvent.click(getTagsEditElements(container).sideMenu.deleteDialogControls.buttons["Yes"]);

        // Check if error message is displayed and tag is not deleted from state
        await waitFor(() => {
            const { tagSaveError } = getTagsEditElements(container);
            getByText(tagSaveError, "Failed to fetch data.");
        });
        expect(store.getState().tags[1]).toBeTruthy();
    });
});


describe("Edit & save ", () => {
    test("Tag description editor", async () => {
        let { container, store } = renderWithWrappers(<App />, 
            { route: "/tags/edit/1" }
        );
    
        // Check if tag information is displayed on the page
        await waitFor(() => expect(getTagsEditElements(container).header).toBeTruthy());
    
        // Check if `both` mode is selected
        let tagDescription = getTagsEditElements(container).tagDescription;
        expect(tagDescription.displayModeMenu.bothModeButton.classList.contains("active")).toBeTruthy();
        
        // Set description and check if it was rendered
        setMarkdownRawText(tagDescription.editMarkdownInput, "# Some text");
        await waitForMarkdownHeaderRender({ editorContainer: tagDescription.editorContainer, text: "Some text" });
        expect(store.getState().tagsEditUI.currentTag.tag_description).toBe("# Some text");
    
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


    test("Save an existing tag", async () => {
        const { store } = createTestStore();
        const tag = getTag({ tag_id: 2, tag_name: "existing tag name" });
        store.dispatch(addTags([tag]));
        let { container } = renderWithWrappers(<App />, {
            route: "/tags/edit/1", store
        });

        // Wait for tag information to be displayed on the page
        await waitFor(() => expect(getTagsEditElements(container).header).toBeTruthy());

        // Modify tag name to existing tag and try saving
        const oldTag = {...store.getState().tags[1]};
        fireEvent.change(getTagsEditElements(container).tagNameInput, { target: { value: "existing tag name" } });
        fireEvent.click(getTagsEditElements(container).sideMenu.saveButton);

        // Wait for error message to appear & check if tag state was not updated
        await waitFor(() => {
            const { tagSaveError } = getTagsEditElements(container);
            getByText(tagSaveError, "already exists", { exact: false });
        });
        
        for (let attr of Object.keys(oldTag)) expect(store.getState().tags[oldTag.tag_id][attr]).toEqual(oldTag[attr]);
    });


    test("Update a tag with fetch error", async () => {
        let { container, store } = renderWithWrappers(<App />, {
            route: "/tags/edit/1"
        });

        // Wait for tag information to be displayed on the page
        await waitFor(() => expect(getTagsEditElements(container).header).toBeTruthy());

        // Modify tag name and try saving the tag
        setFetchFail(true);
        const oldTag = {...store.getState().tags[1]};
        fireEvent.change(getTagsEditElements(container).tagNameInput, { target: { value: "modified tag name" } });
        fireEvent.click(getTagsEditElements(container).sideMenu.saveButton);

        // Wait for error message to appear & check if tag state was not updated
        await waitFor(() => {
            const { tagSaveError } = getTagsEditElements(container);
            getByText(tagSaveError, "Failed to fetch data.", { exact: false });
        });
        
        for (let attr of Object.keys(oldTag)) expect(store.getState().tags[oldTag.tag_id][attr]).toEqual(oldTag[attr]);
    });

    
    test("Update tag's name", async () => {
        let { container, store } = renderWithWrappers(<App />, {
            route: "/tags/edit/1"
        });

        // Wait for tag information to be displayed on the page
        await waitFor(() => expect(getTagsEditElements(container).header).toBeTruthy());

        // Modify tag name and save the tag
        fireEvent.change(getTagsEditElements(container).tagNameInput, { target: { value: "modified tag name" } });
        fireEvent.click(getTagsEditElements(container).sideMenu.saveButton);

        // Wait for tag state to be updated
        await waitFor(() => expect(store.getState().tags[1].tag_name).toEqual("modified tag name"));
        expect(getTagsEditElements(container).placeholders.loading).toBeFalsy();
    });


    test("Update tag's description", async () => {
        let { container, store } = renderWithWrappers(<App />, {
            route: "/tags/edit/1"
        });

        // Wait for tag information to be displayed on the page
        await waitFor(() => expect(getTagsEditElements(container).header).toBeTruthy());

        // Modify tag description and save the tag
        const elements = getTagsEditElements(container);
        setMarkdownRawText(elements.tagDescription.editMarkdownInput, "# Some text");
        await waitForMarkdownHeaderRender({ editorContainer: elements.tagDescription.editorContainer, text: "Some text" });
        fireEvent.click(getTagsEditElements(container).sideMenu.saveButton);

        // Wait for tag state to be updated
        await waitFor(() => expect(store.getState().tags[1].tag_description).toEqual("# Some text"));
        expect(getTagsEditElements(container).placeholders.loading).toBeFalsy();
    });


    test("Update tag's is_published setting", async () => {
        let { container, store } = renderWithWrappers(<App />, {
            route: "/tags/edit/1"
        });

        // Wait for tag information to be displayed on the page
        await waitFor(() => expect(getTagsEditElements(container).header).toBeTruthy());

        // Modify `is_published` and save the tag
        const elements = getTagsEditElements(container);
        
        expect(elements.publishTagCheckbox.checked).toBeTruthy();
        for (let i = 0; i < 3; i++) {
            fireEvent.click(elements.publishTagCheckbox);
            expect(store.getState().tagsEditUI.currentTag.is_published).toEqual(Boolean(i % 2));
            expect(elements.publishTagCheckbox.checked).toEqual(Boolean(i % 2));
        }

        fireEvent.click(elements.sideMenu.saveButton);

        // Wait for tag state to be updated
        await waitFor(() => expect(store.getState().tags[1].is_published).toBeFalsy());
        expect(getTagsEditElements(container).placeholders.loading).toBeFalsy();
    });
});


describe("Delete a tag", () => {
    test("Delete a tag and check objects' tags", async () => {
        let { store } = createTestStore();
        
        let objects = [
            generateObjectAttributes(1, {
                object_type: "link", object_name: "object one", object_description: "", 
                created_at: (new Date(Date.now() - 24*60*60*1000)).toISOString(), modified_at: (new Date()).toISOString(), current_tag_ids: [1, 2, 3] 
            }),
            generateObjectAttributes(2, {
                object_type: "link", object_name: "object two", object_description: "", 
                created_at: (new Date(Date.now() - 24*60*60*1000)).toISOString(), modified_at: (new Date()).toISOString(), current_tag_ids: [1] 
            }),
            generateObjectAttributes(3, {
                object_type: "link", object_name: "object three", object_description: "", 
                created_at: (new Date(Date.now() - 24*60*60*1000)).toISOString(), modified_at: (new Date()).toISOString(), current_tag_ids: [3, 4, 5] 
            })
        ];
    
        store.dispatch(addObjectsAttributes(objects));
        store.dispatch(addObjectsTags(objects));
        
        let { container, historyManager } = renderWithWrappers(<App />, {
            route: "/tags/edit/1", store
        });
    
        // Wait for tag information to be displayed on the page and delete the tag
        await waitFor(() => getByText(container, "Tag Information"));
        let deleteButton = getSideMenuItem(container, "Delete");
        fireEvent.click(deleteButton);
        fireEvent.click(getSideMenuDialogControls(container).buttons["Yes"]);
    
        // Wait for deletion to complete => check objects' tags
        await historyManager.waitForCurrentURLToBe("/tags/list");
        expect(compareArrays(Object.keys(store.getState().objectsTags), ["1", "3"])).toBeTruthy(); // 2 is removed, since it has no tags
        expect(compareArrays(store.getState().objectsTags[1], [2, 3])).toBeTruthy();        // 1 is updated
        expect(compareArrays(store.getState().objectsTags[3], [3, 4, 5])).toBeTruthy();     // 3 has the same tags
    });
});
