import React from "react";
import ReactDOM from "react-dom";

import { fireEvent } from "@testing-library/react";
import { getByText, getByPlaceholderText, waitFor, getByTitle } from "@testing-library/dom";

import { resetTestConfig } from "../../../../_mocks/config";
import { createTestStore } from "../../../../_util/create-test-store";
import { renderWithWrappers } from "../../../../_util/render";
import { getSideMenuItem } from "../../../../_util/ui-common";
import { getCurrentObject, clickDataTabButton, getObjectTypeSwitchElements } from "../../../../_util/ui-objects-edit";
import { clickSubobjectCardDataTabButton, getSubobjectCardAttributeElements, getSubobjectCards } from "../../../../_util/ui-composite";
import { getObjectsViewCardElements } from "../../../../_util/ui-objects-view";
import { getMarkdownEditorElements, setMarkdownRawText, waitForMarkdownHeaderRender } from "../../../../_util/ui-markdown-editor";

import { getTDLByObjectID } from "../../../../_mocks/data-to-do-lists";
import { getStoreWithCompositeObjectAndSubobjects, getStoreWithCompositeObject } from "../../../../_mocks/data-composite";

import { App } from "../../../../../src/components/app";
import { setObjectsTags } from "../../../../../src/actions/data-tags";
import { addObjects, addObjectData } from "../../../../../src/actions/data-objects";
import { enumDeleteModes } from "../../../../../src/store/state-templates/composite-subobjects";
import { generateObjectAttributes, generateObjectData } from "../../../../_mocks/data-objects";


/*
    /objects/edit/:id page tests, general (page load & ui elements).
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


describe("Load object errors & UI checks", () => {
    test("Load an object with fetch error + check buttons", async () => {
        setFetchFail(true);
    
        let { container } = renderWithWrappers(<App />, {
            route: "/objects/edit/1"
        });
    
        // Check if error message if displayed
        await waitFor(() => getByText(container, "Failed to fetch data."));
    
        // Check if save and delete buttons can't be clicked if object fetch failed
        let saveButton = getSideMenuItem(container, "Save");
        let resetButton = getSideMenuItem(container, "Reset");
        let deleteButton = getSideMenuItem(container, "Delete");
        let cancelButton = getSideMenuItem(container, "Cancel");
        expect(saveButton.classList.contains("disabled")).toBeTruthy(); // Semantic UI always adds onClick event to div elements, even if they are disabled (which does nothing in this case)
        // expect(saveButton.onclick).toBeNull(); 
        expect(resetButton.classList.contains("disabled")).toBeTruthy(); // Semantic UI always adds onClick event to div elements, even if they are disabled (which does nothing in this case)
        // expect(deleteButton.onclick).toBeNull(); 
        expect(deleteButton.classList.contains("disabled")).toBeTruthy(); // Semantic UI always adds onClick event to div elements, even if they are disabled (which does nothing in this case)
        // expect(deleteButton.onclick).toBeNull(); 
    });


    test("Load a non-existing object", async () => {
        let { container } = renderWithWrappers(<App />, {
            route: "/objects/edit/9999"
        });
    
        // Check if error message if displayed
        await waitFor(() => getByText(container, "not found", { exact: false }));
    });


    test("Load objects with invalid IDs", async () => {
        for (let objectID of ["0", "str"]) {
            let { container } = renderWithWrappers(<App />, {
                route: `/objects/edit/${objectID}`
            });
        
            // Check if error message if displayed
            await waitFor(() => getByText(container, "not found", { exact: false }));

            ReactDOM.unmountComponentAtNode(container);
        }
    });


    test("Check 'Add a New Object' button", async () => {
        let { container, historyManager } = renderWithWrappers(<App />, 
            { route: "/objects/edit/1" }
        );
    
        // Check if object information is displayed on the page
        await waitFor(() => getByText(container, "Object Information"));
        let addObjectButton = getSideMenuItem(container, "Add a New Object");
        fireEvent.click(addObjectButton);
        historyManager.ensureCurrentURL("/objects/edit/new");
    });


    test("Check 'View Object' button", async () => {
        let { container, historyManager } = renderWithWrappers(<App />, 
            { route: "/objects/edit/1" }
        );
    
        // Check if object information is displayed on the page
        await waitFor(() => getByText(container, "Object Information"));
        let viewObjectButton = getSideMenuItem(container, "View Object");
        fireEvent.click(viewObjectButton);
        historyManager.ensureCurrentURL("/objects/view/1");
        await waitFor(() => expect(getObjectsViewCardElements({ container }).placeholders.loading).toBeTruthy());
        await waitFor(() => expect(getObjectsViewCardElements({ container }).placeholders.loading).toBeFalsy());
    });


    test("Load composite object's subobjects with fetch error", async () => {
        let store = getStoreWithCompositeObject();
        setFetchFail(true);
        
        let { container } = renderWithWrappers(<App />, { 
            route: "/objects/edit/1", store
        });
        
        // Load page
        await waitFor(() => getByText(container, "Object Information"));
        clickDataTabButton(container);

        // Wait for subobject fetchs to end
        await waitFor(() => expect(store.getState().editedObjects[1].composite.subobjects[2].fetchError).not.toEqual(""));
        const cards = getSubobjectCards(container, { expectedNumbersOfCards: [2] });
        getByText(cards[0][0], "Object is unavailable.");

        // Delete and restore unaviable subobject
        fireEvent.click(getByText(cards[0][0], "Delete"));
        expect(store.getState().editedObjects[1].composite.subobjects[2].deleteMode).toEqual(enumDeleteModes.subobjectOnly);

        fireEvent.click(getByText(cards[0][0], "Restore"));
        expect(store.getState().editedObjects[1].composite.subobjects[2].deleteMode).toEqual(enumDeleteModes.none);
    });


    test("Object description editor", async () => {
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/edit/1" 
        });
        
        // Load page
        await waitFor(() => getByText(container, "Object Information"));
    
        // Check if `both` mode is selected
        let markdownEditorElements = getMarkdownEditorElements({ container });
        expect(markdownEditorElements.displayModeMenu.bothModeButton.classList.contains("active")).toBeTruthy();
        
        // Set description and check if it was rendered
        setMarkdownRawText(markdownEditorElements.editMarkdownInput, "# Some text");
        await waitForMarkdownHeaderRender({ editorContainer: markdownEditorElements.editorContainer, text: "Some text" });
        expect(store.getState().editedObjects[1].object_description).toBe("# Some text");
    
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
});


describe("Load object from state", () => {
    test("Load a link object from state", async () => {
        let { store } = createTestStore();
        let object = generateObjectAttributes(1, {
            object_type: "link", object_name: "object name", object_description: "object description", 
            created_at: (new Date(Date.now() - 24*60*60*1000)).toUTCString(), modified_at: (new Date()).toUTCString(), current_tag_ids: [1, 2, 3, 4, 5] 
        });
        let objectData = generateObjectData(1, "link", { "link": "https://test.link" });
        store.dispatch(addObjects([object]));
        store.dispatch(setObjectsTags([object]));
        store.dispatch(addObjectData([objectData]));
        
        let { container } = renderWithWrappers(<App />, {
            route: "/objects/edit/1", store
        });
    
        // Check if object information is displayed on the page
        await waitFor(() => getByText(container, "Object Information"));
        let objectNameInput = getByPlaceholderText(container, "Object name");
        let objectDescriptionInput = getByPlaceholderText(container, "Object description");
        expect(objectNameInput.value).toEqual("object name");
        expect(objectDescriptionInput.value).toEqual("object description");
        getByText(container, "Created at:");
        getByText(container, "Modified at:");
    
        // Check if object type is displayed, but can't be changed
        const { switchContainer, selectedObjectType, dropdownOptionsContainer } = getObjectTypeSwitchElements(container);
        getByText(selectedObjectType, "Link");
        fireEvent.click(switchContainer);
        expect(dropdownOptionsContainer.classList.contains("visible")).toBeFalsy();  // classname is required to display dropdown options
    
        // Check if link data is displayed
        clickDataTabButton(container);
        expect(getByPlaceholderText(container, "Link").value).toEqual(objectData.object_data.link);
    });


    test("Load a markdown object from state", async () => {
        let { store } = createTestStore();
        let object = generateObjectAttributes(1, {
            object_type: "markdown", object_name: "object name", object_description: "object description", 
            created_at: (new Date(Date.now() - 24*60*60*1000)).toUTCString(), modified_at: (new Date()).toUTCString(), current_tag_ids: [1, 2, 3, 4, 5] 
        });
        let objectData = generateObjectData(1, "markdown", { "raw_text": "**Test text**" });
        store.dispatch(addObjects([object]));
        store.dispatch(setObjectsTags([object]));
        store.dispatch(addObjectData([objectData]));
        
        let { container } = renderWithWrappers(<App />, {
            route: "/objects/edit/1", store
        });
    
        // Check if object information is displayed on the page
        await waitFor(() => getByText(container, "Object Information"));
        let objectNameInput = getByPlaceholderText(container, "Object name");
        let objectDescriptionInput = getByPlaceholderText(container, "Object description");
        expect(objectNameInput.value).toEqual("object name");
        expect(objectDescriptionInput.value).toEqual("object description");
        // getByText(container, object.created_at);
        // getByText(container, object.modified_at);
    
        // Check if object type is displayed, but can't be changed
        const { switchContainer, selectedObjectType, dropdownOptionsContainer } = getObjectTypeSwitchElements(container);
        getByText(selectedObjectType, "Markdown");
        fireEvent.click(switchContainer);
        expect(dropdownOptionsContainer.classList.contains("visible")).toBeFalsy();  // classname is required to display dropdown options
    
        // Check if markdown data is displayed in "both" mode
        clickDataTabButton(container);
        const markdownContainer = document.querySelector(".markdown-editor-container");
        expect(markdownContainer).toBeTruthy();
        let bothModeButton = getByTitle(markdownContainer, "Display edit window and parsed markdown");
        fireEvent.click(bothModeButton);
        let inputForm = getByPlaceholderText(markdownContainer, "Enter text here...");
        expect(inputForm.textContent).toEqual("**Test text**");
        await waitFor(() => {   // viewContainer is rendered when there is parsed text
            let viewContainer = markdownContainer.querySelector(".markdown-editor-view-container");
            getByText(viewContainer, "Test text");
        });
    
        // Check if parsed markdown is displayed in "view" mode
        let viewModeButton = getByTitle(markdownContainer, "Display parsed markdown");
        fireEvent.click(viewModeButton);
        let viewContainer = markdownContainer.querySelector(".markdown-editor-view-container");
        getByText(viewContainer, "Test text");
    });


    test("Load a to-do list object from state", async () => {
        let { store } = createTestStore();
        let object = generateObjectAttributes(1, {
            object_type: "to_do_list", object_name: "object name", object_description: "object description", 
            created_at: (new Date(Date.now() - 24*60*60*1000)).toUTCString(), modified_at: (new Date()).toUTCString(), current_tag_ids: [1, 2, 3, 4, 5] 
        });
        let objectData = generateObjectData(1, "to_do_list", getTDLByObjectID(2001));
        store.dispatch(addObjects([object]));
        store.dispatch(setObjectsTags([object]));
        store.dispatch(addObjectData([objectData]));
        
        let { container } = renderWithWrappers(<App />, {
            route: "/objects/edit/1", store
        });
    
        // Check if object information is displayed on the page
        await waitFor(() => getByText(container, "Object Information"));
        let objectNameInput = getByPlaceholderText(container, "Object name");
        let objectDescriptionInput = getByPlaceholderText(container, "Object description");
        expect(objectNameInput.value).toEqual("object name");
        expect(objectDescriptionInput.value).toEqual("object description");
        // getByText(container, object.created_at);
        // getByText(container, object.modified_at);
    
        // Check if object type is displayed, but can't be changed
        const { switchContainer, selectedObjectType, dropdownOptionsContainer } = getObjectTypeSwitchElements(container);
        getByText(selectedObjectType, "To-do list");
        fireEvent.click(switchContainer);
        expect(dropdownOptionsContainer.classList.contains("visible")).toBeFalsy();  // classname is required to display dropdown options
    
        // Check if all items are displayed (detailed interface checks are performed in to-do-lists.test.js)
        clickDataTabButton(container);
        const TDLContainer = container.querySelector(".to-do-list-container");
        expect(TDLContainer).toBeTruthy();
        for (let item of objectData.object_data.items) getByText(TDLContainer, item.item_text);
        getByPlaceholderText(TDLContainer, "New item");
    });


    test("Load a composite object and subobjects from state", async () => {
        let store = getStoreWithCompositeObjectAndSubobjects();

        let { container } = renderWithWrappers(<App />, {
            route: "/objects/edit/1", store
        });
        
        // Load page
        await waitFor(() => getByText(container, "Object Information"));

        // Check if object type is displayed, but can't be changed
        const { switchContainer, selectedObjectType, dropdownOptionsContainer } = getObjectTypeSwitchElements(container);
        getByText(selectedObjectType, "Composite object");
        fireEvent.click(switchContainer);
        expect(dropdownOptionsContainer.classList.contains("visible")).toBeFalsy();  // classname is required to display dropdown options


        // Wait for subobjects to be loaded into state.editedObjects
        clickDataTabButton(container);
        await waitFor(() => expect(store.getState().editedObjects).toHaveProperty("2"));
        await waitFor(() => expect(store.getState().editedObjects).toHaveProperty("3"));
        const cards = getSubobjectCards(container, { expectedNumbersOfCards: [2] });
        const state = store.getState();

        // Check first subobject
        expect(getSubobjectCardAttributeElements(cards[0][0]).subobjectNameInput.value).toEqual(state.editedObjects[2].object_name);
        expect(getSubobjectCardAttributeElements(cards[0][0]).subobjectDescriptionInput.value).toEqual(state.editedObjects[2].object_description);
        clickSubobjectCardDataTabButton(cards[0][0]);
        const linkInput = getByPlaceholderText(cards[0][0], "Link");
        expect(linkInput.value).toEqual(state.editedObjects[2].link.link);

        // Check second subobject
        expect(getSubobjectCardAttributeElements(cards[0][1]).subobjectNameInput.value).toEqual(state.editedObjects[3].object_name);
        expect(getSubobjectCardAttributeElements(cards[0][1]).subobjectDescriptionInput.value).toEqual(state.editedObjects[3].object_description);
        clickSubobjectCardDataTabButton(cards[0][1]);

        const markdownContainer = cards[0][1].querySelector(".markdown-editor-container");
        expect(markdownContainer).toBeTruthy();
        const markdownInput = markdownContainer.querySelector(".edit-page-textarea");
        expect(markdownInput).toBeTruthy();
        expect(markdownInput.value).toEqual(state.editedObjects[3].markdown.raw_text);
    });
});


describe("Load object from backend", () => {
    test("Load a link object attributes from state and data from backend", async () => {
        let { store } = createTestStore();
        let object = generateObjectAttributes(1, {
            object_type: "link", object_name: "object name", object_description: "object description", 
            created_at: (new Date(Date.now() - 24*60*60*1000)).toUTCString(), modified_at: (new Date()).toUTCString(), current_tag_ids: [1, 2, 3, 4, 5]
        });
        store.dispatch(addObjects([object]));
        store.dispatch(setObjectsTags([object]));
        
        let { container } = renderWithWrappers(<App />, {
            route: "/objects/edit/1", store
        });
        
        // Check if object information is displayed on the page
        await waitFor(() => getByText(container, "Object Information"));
        let objectNameInput = getByPlaceholderText(container, "Object name");
        let objectDescriptionInput = getByPlaceholderText(container, "Object description");
        expect(objectNameInput.value).toEqual("object name");
        expect(objectDescriptionInput.value).toEqual("object description");
        getByText(container, "Created at:");
        getByText(container, "Modified at:");
    
        // Check if object type is displayed, but can't be changed
        const { switchContainer, selectedObjectType, dropdownOptionsContainer } = getObjectTypeSwitchElements(container);
        getByText(selectedObjectType, "Link");
        fireEvent.click(switchContainer);
        expect(dropdownOptionsContainer.classList.contains("visible")).toBeFalsy();  // classname is required to display dropdown options
    
        // Check if link data is displayed
        let objectData = store.getState().links[1];
        expect(objectData).toHaveProperty("link");
        clickDataTabButton(container);
        expect(getByPlaceholderText(container, "Link").value).toEqual("https://website1.com");
    });
    
    
    test("Load a link object from backend", async () => {
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/edit/1"
        });
    
        // Check if object information is displayed on the page
        await waitFor(() => getByText(container, "Object Information"));
        let object = store.getState().objects[1];
        let objectNameInput = getByPlaceholderText(container, "Object name");
        let objectDescriptionInput = getByPlaceholderText(container, "Object description");
        expect(objectNameInput.value).toEqual(object.object_name);
        expect(objectDescriptionInput.value).toEqual(object.object_description);
        getByText(container, "Created at:");
        getByText(container, "Modified at:");
    
        // Check if link is displayed (shortened verison of previous test)
        clickDataTabButton(container);
        expect(getByPlaceholderText(container, "Link").value).toEqual("https://website1.com");
    });

    
    test("Load a markdown object attributes from state and data from backend", async () => {
        let { store } = createTestStore();
        let object = generateObjectAttributes(1001, {
            object_type: "markdown", object_name: "object name", object_description: "object description", 
            created_at: (new Date(Date.now() - 24*60*60*1000)).toUTCString(), modified_at: (new Date()).toUTCString(), current_tag_ids: [1, 2, 3, 4, 5] 
        });
        store.dispatch(addObjects([object]));
        store.dispatch(setObjectsTags([object]));
        
        let { container } = renderWithWrappers(<App />, {
            route: "/objects/edit/1001", store
        });
        
        // Check if object information is displayed on the page
        await waitFor(() => getByText(container, "Object Information"));
        let objectNameInput = getByPlaceholderText(container, "Object name");
        let objectDescriptionInput = getByPlaceholderText(container, "Object description");
        expect(objectNameInput.value).toEqual("object name");
        expect(objectDescriptionInput.value).toEqual("object description");
        // getByText(container, object.created_at);
        // getByText(container, object.modified_at);
    
        // Check if object type is displayed, but can't be changed
        const { switchContainer, selectedObjectType, dropdownOptionsContainer } = getObjectTypeSwitchElements(container);
        getByText(selectedObjectType, "Markdown");
        fireEvent.click(switchContainer);
        expect(dropdownOptionsContainer.classList.contains("visible")).toBeFalsy();  // classname is required to display dropdown options
    
        // Check if markdown data is displayed
        clickDataTabButton(container);
        let objectData = store.getState().markdown[1001];
        expect(objectData).toHaveProperty("raw_text");
        const markdownContainer = document.querySelector(".markdown-editor-container");
        expect(markdownContainer).toBeTruthy();
        await waitFor(() => {
            let viewContainer = markdownContainer.querySelector(".markdown-editor-view-container");
            getByText(viewContainer, "Markdown Object #1001");
        });
    });


    test("Load a to-do list object attributes from state and data from backend", async () => {
        let { store } = createTestStore();
        let object = generateObjectAttributes(2001, {
            object_type: "to_do_list", object_name: "object name", object_description: "object description", 
                created_at: (new Date(Date.now() - 24*60*60*1000)).toUTCString(), modified_at: (new Date()).toUTCString(), current_tag_ids: [1, 2, 3, 4, 5] 
        });
        store.dispatch(addObjects([object]));
        store.dispatch(setObjectsTags([object]));
        
        let { container } = renderWithWrappers(<App />, {
            route: "/objects/edit/2001", store
        });
        
        // Check if object information is displayed on the page
        await waitFor(() => getByText(container, "Object Information"));
        let objectNameInput = getByPlaceholderText(container, "Object name");
        let objectDescriptionInput = getByPlaceholderText(container, "Object description");
        expect(objectNameInput.value).toEqual("object name");
        expect(objectDescriptionInput.value).toEqual("object description");
        // getByText(container, object.created_at);
        // getByText(container, object.modified_at);
    
        // Check if object type is displayed, but can't be changed
        const { switchContainer, selectedObjectType, dropdownOptionsContainer } = getObjectTypeSwitchElements(container);
        getByText(selectedObjectType, "To-do list");
        fireEvent.click(switchContainer);
        expect(dropdownOptionsContainer.classList.contains("visible")).toBeFalsy();  // classname is required to display dropdown options
    
        // Check if all items are displayed (detailed interface checks are performed in to-do-lists.test.js)
        clickDataTabButton(container);
        const TDLContainer = container.querySelector(".to-do-list-container");
        expect(TDLContainer).toBeTruthy();
        for (let key of getCurrentObject(store.getState()).toDoList.itemOrder) getByText(TDLContainer, getCurrentObject(store.getState()).toDoList.items[key].item_text);
        getByPlaceholderText(TDLContainer, "New item");
    });


    test("Load a composite object from state and subobjects from backend", async () => {
        let store = getStoreWithCompositeObject();

        let { container } = renderWithWrappers(<App />, {
            route: "/objects/edit/1", store
        });
        
        // Load page
        await waitFor(() => getByText(container, "Object Information"));

        // Wait for subobjects to be loaded into state.editedObjects
        clickDataTabButton(container);
        await waitFor(() => expect(store.getState().editedObjects).toHaveProperty("2"));
        await waitFor(() => expect(store.getState().editedObjects).toHaveProperty("3"));
        const cards = getSubobjectCards(container, { expectedNumbersOfCards: [2] });
        const state = store.getState();

        // Check first subobject
        expect(getSubobjectCardAttributeElements(cards[0][0]).subobjectNameInput.value).toEqual(state.editedObjects[2].object_name);
        expect(getSubobjectCardAttributeElements(cards[0][0]).subobjectDescriptionInput.value).toEqual(state.editedObjects[2].object_description);
        clickSubobjectCardDataTabButton(cards[0][0]);
        let linkInput = getByPlaceholderText(cards[0][0], "Link");
        expect(linkInput.value).toEqual(state.editedObjects[2].link.link);

        // Check second subobject
        expect(getSubobjectCardAttributeElements(cards[0][1]).subobjectNameInput.value).toEqual(state.editedObjects[3].object_name);
        expect(getSubobjectCardAttributeElements(cards[0][1]).subobjectDescriptionInput.value).toEqual(state.editedObjects[3].object_description);
        clickSubobjectCardDataTabButton(cards[0][1]);
        linkInput = getByPlaceholderText(cards[0][1], "Link");
        expect(linkInput.value).toEqual(state.editedObjects[3].link.link);
    });


    test("Load a composite object and subobjects from backend", async () => {
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/edit/3901"
        });

        // Load page and wait for subobjects to load
        await waitFor(() => getByText(container, "Object Information"));
        clickDataTabButton(container);
        for (let subobjectID of Object.keys(store.getState().editedObjects[3901].composite.subobjects))
            await waitFor(() => expect(store.getState().editedObjects).toHaveProperty(subobjectID));
        
        // Check if subobjects are properly displayed
        const state = store.getState();
        const cards = getSubobjectCards(container, { expectedNumbersOfCards: [4] });

        // Check first subobject
        const firstID = cards[0][0].id;
        expect(getSubobjectCardAttributeElements(cards[0][0]).subobjectNameInput.value).toEqual(state.editedObjects[firstID].object_name);
        expect(getSubobjectCardAttributeElements(cards[0][0]).subobjectDescriptionInput.value).toEqual(state.editedObjects[firstID].object_description);
        clickSubobjectCardDataTabButton(cards[0][0]);
        let linkInput = getByPlaceholderText(cards[0][0], "Link");
        expect(linkInput.value).toEqual(state.editedObjects[firstID].link.link);

        // Check second subobject
        const secondID = cards[0][1].id;
        expect(getSubobjectCardAttributeElements(cards[0][1]).subobjectNameInput.value).toEqual(state.editedObjects[secondID].object_name);
        expect(getSubobjectCardAttributeElements(cards[0][1]).subobjectDescriptionInput.value).toEqual(state.editedObjects[secondID].object_description);
        clickSubobjectCardDataTabButton(cards[0][1]);

        const markdownContainer = cards[0][1].querySelector(".markdown-editor-container");
        expect(markdownContainer).toBeTruthy();
        const markdownInput = markdownContainer.querySelector(".edit-page-textarea");
        expect(markdownInput).toBeTruthy();
        expect(markdownInput.value).toEqual(state.editedObjects[secondID].markdown.raw_text);

        // Check third subobject
        const thirdID = cards[0][2].id;
        expect(getSubobjectCardAttributeElements(cards[0][2]).subobjectNameInput.value).toEqual(state.editedObjects[thirdID].object_name);
        expect(getSubobjectCardAttributeElements(cards[0][2]).subobjectDescriptionInput.value).toEqual(state.editedObjects[thirdID].object_description);
        clickSubobjectCardDataTabButton(cards[0][2]);
        
        const TDLContainer = cards[0][2].querySelector(".to-do-list-container");
        expect(TDLContainer).toBeTruthy();
        for (let key of state.editedObjects[thirdID].toDoList.itemOrder) getByText(TDLContainer, state.editedObjects[thirdID].toDoList.items[key].item_text);
        getByPlaceholderText(TDLContainer, "New item");

        // Check fourth subobject
        const fourthID = cards[0][3].id;
        expect(getSubobjectCardAttributeElements(cards[0][3]).subobjectNameInput.value).toEqual(state.editedObjects[fourthID].object_name);
        expect(getSubobjectCardAttributeElements(cards[0][3]).subobjectDescriptionInput.value).toEqual(state.editedObjects[fourthID].object_description);
        clickSubobjectCardDataTabButton(cards[0][3]);

        getByText(cards[0][3], "Object preview unavailable.");
    });


    test("Load a composite object without subobjects from backend", async () => {
        let { container } = renderWithWrappers(<App />, {
            route: "/objects/edit/3902"
        });

        // Check if data tab is correctly displayed after page load
        await waitFor(() => getByText(container, "Object Information"));
        clickDataTabButton(container);
        getSubobjectCards(container, { expectedNumbersOfCards: [1], countAddMenusAsCards: true }); 
    });
});
