import React from "react";
import ReactDOM from "react-dom";
import { Route } from "react-router-dom";

import { fireEvent } from "@testing-library/react";
import { getByText, getByPlaceholderText, waitFor, getByTitle, queryByPlaceholderText, queryByText } from "@testing-library/dom";

import { createTestStore } from "../_util/create-test-store";
import { compareArrays } from "../_util/data-checks";
import { renderWithWrappers } from "../_util/render";
import { getSideMenuDialogControls, getSideMenuItem } from "../_util/ui-common";
import { getCurrentObject, waitForEditObjectPageLoad, clickDataTabButton, clickGeneralTabButton, clickDisplayTabButton, clickPublishObjectCheckbox,
    resetObject, getObjectTypeSwitchElements } from "../_util/ui-object";
import { addANewSubobject, addAnExistingSubobject, clickSubobjectCardDataTabButton, clickSubobjectCardDisplayTabButton, getSubobjectCardAttributeElements, getSubobjectCardMenuButtons, 
    getSubobjectCards, getSubobjectExpandToggleButton } from "../_util/ui-composite";

import { getTDLByObjectID } from "../_mocks/data-to-do-lists";
import { getStoreWithCompositeObjectAndSubobjects, getStoreWithCompositeObject, getMappedSubobjectID } from "../_mocks/data-composite";

import { AddObject, EditObject } from "../../src/components/top-level/object";
import { setObjectsTags } from "../../src/actions/data-tags";
import { addObjects, addObjectData } from "../../src/actions/data-objects";
import { enumDeleteModes } from "../../src/store/state-templates/composite-subobjects";


/*
    /objects/:id page tests.
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


describe("Load object errors & UI checks", () => {
    test("Load an object with fetch error + check buttons", async () => {
        setFetchFail(true);
    
        // Route component is required for matching (getting :id part of the URL in the EditObject component)
        let { container } = renderWithWrappers(<Route exact path="/objects/:id"><EditObject /></Route>, {
            route: "/objects/1"
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
        // Route component is required for matching (getting :id part of the URL in the EditObject component)
        let { container } = renderWithWrappers(<Route exact path="/objects/:id"><EditObject /></Route>, {
            route: "/objects/9999"
        });
    
        // Check if error message if displayed
        await waitFor(() => getByText(container, "not found", { exact: false }));
    });


    test("Load objects with invalid IDs", async () => {
        for (let objectID of ["0", "str"]) {
            // Route component is required for matching (getting :id part of the URL in the EditObject component)
            let { container } = renderWithWrappers(<Route exact path="/objects/:id"><EditObject /></Route>, {
                route: `/objects/${objectID}`
            });
        
            // Check if error message if displayed
            await waitFor(() => getByText(container, "not found", { exact: false }));

            ReactDOM.unmountComponentAtNode(container);
        }
    });


    test("Check 'Add a New Object' button", async () => {
        // Route component is required for matching (getting :id part of the URL in the EditObject component)
        let { container, history } = renderWithWrappers(
            <Route exact path="/objects/:id" render={ props => props.match.params.id === "add" ? <AddObject /> : <EditObject /> } />, 
            { route: "/objects/1" }
        );
    
        // Check if object information is displayed on the page
        await waitFor(() => getByText(container, "Object Information"));
        let addObjectButton = getSideMenuItem(container, "Add a New Object");
        fireEvent.click(addObjectButton);
        expect(history.entries[history.length - 1].pathname).toBe("/objects/add");
    });


    test("Load composite object's subobjects with fetch error", async () => {
        let store = getStoreWithCompositeObject();
        setFetchFail(true);
        
        let { container, history } = renderWithWrappers(
            <Route exact path="/objects/:id" render={ props => props.match.params.id === "add" ? <AddObject /> : <EditObject /> } />, 
            { 
                store,
                route: "/objects/1" 
            }
        );
        
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


    test("Toggle `is published` setting", async () => {
        // Route component is required for matching (getting :id part of the URL in the EditObject component)
        let { container, store } = renderWithWrappers(
            <Route exact path="/objects/:id" render={ props => props.match.params.id === "add" ? <AddObject /> : <EditObject /> } />, 
            { route: "/objects/1" }
        );
        
        // Load page
        await waitFor(() => getByText(container, "Object Information"));
        expect(store.getState().editedObjects[1].is_published).toBeFalsy();
        clickDisplayTabButton(container);
        expect(queryByText(container, "Publish subobjects")).toBeFalsy();   // not render for a non-composite object

        // Publish object
        clickPublishObjectCheckbox(container);
        expect(store.getState().editedObjects[1].is_published).toBeTruthy();

        // Unpublish object
        clickPublishObjectCheckbox(container);
        expect(store.getState().editedObjects[1].is_published).toBeFalsy();
    });
});


describe("Load object from state", () => {
    test("Load a link object from state", async () => {
        let store = createTestStore({ enableDebugLogging: false });
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
        let store = createTestStore({ enableDebugLogging: false });
        let object = { object_id: 1, object_type: "markdown", object_name: "object name", object_description: "object description", 
                        created_at: (new Date(Date.now() - 24*60*60*1000)).toUTCString(), modified_at: (new Date()).toUTCString(), current_tag_ids: [1, 2, 3, 4, 5] };
        let objectData = { object_id: 1, object_type: "markdown", object_data: {"raw_text": "**Test text**"} };
        store.dispatch(addObjects([object]));
        store.dispatch(setObjectsTags([object]));
        store.dispatch(addObjectData([objectData]));
        // Route component is required for matching (getting :id part of the URL in the EditObject component)
        let { container } = renderWithWrappers(<Route exact path="/objects/:id"><EditObject /></Route>, {
            route: "/objects/1",
            store: store
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
        const markdownContainer = document.querySelector(".markdown-container");
        expect(markdownContainer).toBeTruthy();
        let bothModeButton = getByTitle(markdownContainer, "Display edit window and parsed markdown");
        fireEvent.click(bothModeButton);
        let inputForm = getByPlaceholderText(markdownContainer, "Enter text here...");
        expect(inputForm.textContent).toEqual("**Test text**");
        await waitFor(() => {   // viewContainer is rendered when there is parsed text
            let viewContainer = markdownContainer.querySelector(".markdown-parsed-container");
            getByText(viewContainer, "Test text");
        });
    
        // Check if parsed markdown is displayed in "view" mode
        let viewModeButton = getByTitle(markdownContainer, "Display parsed markdown");
        fireEvent.click(viewModeButton);
        let viewContainer = markdownContainer.querySelector(".markdown-parsed-container");
        getByText(viewContainer, "Test text");
    });


    test("Load a to-do list object from state", async () => {
        let store = createTestStore();
        let object = { object_id: 1, object_type: "to_do_list", object_name: "object name", object_description: "object description", 
                        created_at: (new Date(Date.now() - 24*60*60*1000)).toUTCString(), modified_at: (new Date()).toUTCString(), current_tag_ids: [1, 2, 3, 4, 5] };
        let objectData = { object_id: 1, object_type: "to_do_list", object_data: getTDLByObjectID(2001) };
        store.dispatch(addObjects([object]));
        store.dispatch(setObjectsTags([object]));
        store.dispatch(addObjectData([objectData]));
        // Route component is required for matching (getting :id part of the URL in the EditObject component)
        let { container } = renderWithWrappers(<Route exact path="/objects/:id"><EditObject /></Route>, {
            route: "/objects/1",
            store: store
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

        let { container } = renderWithWrappers(<Route exact path="/objects/:id"><EditObject /></Route>, {
            route: "/objects/1",
            store: store
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
        expect(linkInput.value).toEqual(state.editedObjects[2].link);

        // Check second subobject
        expect(getSubobjectCardAttributeElements(cards[0][1]).subobjectNameInput.value).toEqual(state.editedObjects[3].object_name);
        expect(getSubobjectCardAttributeElements(cards[0][1]).subobjectDescriptionInput.value).toEqual(state.editedObjects[3].object_description);
        clickSubobjectCardDataTabButton(cards[0][1]);

        const markdownContainer = cards[0][1].querySelector(".markdown-container");
        expect(markdownContainer).toBeTruthy();
        const markdownInput = markdownContainer.querySelector(".edit-page-textarea");
        expect(markdownInput).toBeTruthy();
        expect(markdownInput.value).toEqual(state.editedObjects[3].markdown.raw_text);
    });
});


describe("Load object from backend", () => {
    test("Load a link object attributes from state and data from backend", async () => {
        let store = createTestStore({ enableDebugLogging: false });
        let object = { object_id: 1, object_type: "link", object_name: "object name", object_description: "object description", 
                        created_at: (new Date(Date.now() - 24*60*60*1000)).toUTCString(), modified_at: (new Date()).toUTCString(), current_tag_ids: [1, 2, 3, 4, 5] };
        store.dispatch(addObjects([object]));
        store.dispatch(setObjectsTags([object]));
        // Route component is required for matching (getting :id part of the URL in the EditObject component)
        let { container } = renderWithWrappers(<Route exact path="/objects/:id"><EditObject /></Route>, {
            route: "/objects/1",
            store: store
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
        // Route component is required for matching (getting :id part of the URL in the EditObject component)
        let { container, store } = renderWithWrappers(<Route exact path="/objects/:id"><EditObject /></Route>, {
            route: "/objects/1"
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
        let store = createTestStore({ enableDebugLogging: false });
        let object = { object_id: 1001, object_type: "markdown", object_name: "object name", object_description: "object description", 
                        created_at: (new Date(Date.now() - 24*60*60*1000)).toUTCString(), modified_at: (new Date()).toUTCString(), current_tag_ids: [1, 2, 3, 4, 5] };
        store.dispatch(addObjects([object]));
        store.dispatch(setObjectsTags([object]));
        // Route component is required for matching (getting :id part of the URL in the EditObject component)
        let { container } = renderWithWrappers(<Route exact path="/objects/:id"><EditObject /></Route>, {
            route: "/objects/1001",
            store: store
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
        const markdownContainer = document.querySelector(".markdown-container");
        expect(markdownContainer).toBeTruthy();
        await waitFor(() => {
            let viewContainer = markdownContainer.querySelector(".markdown-parsed-container");
            getByText(viewContainer, "Markdown Object #1001");
        });
    });


    test("Load a to-do list object attributes from state and data from backend", async () => {
        let store = createTestStore({ enableDebugLogging: false });
        let object = { object_id: 2001, object_type: "to_do_list", object_name: "object name", object_description: "object description", 
                        created_at: (new Date(Date.now() - 24*60*60*1000)).toUTCString(), modified_at: (new Date()).toUTCString(), current_tag_ids: [1, 2, 3, 4, 5] };
        store.dispatch(addObjects([object]));
        store.dispatch(setObjectsTags([object]));
        // Route component is required for matching (getting :id part of the URL in the EditObject component)
        let { container } = renderWithWrappers(<Route exact path="/objects/:id"><EditObject /></Route>, {
            route: "/objects/2001",
            store: store
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

        let { container } = renderWithWrappers(<Route exact path="/objects/:id"><EditObject /></Route>, {
            route: "/objects/1",
            store: store
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
        expect(linkInput.value).toEqual(state.editedObjects[2].link);

        // Check second subobject
        expect(getSubobjectCardAttributeElements(cards[0][1]).subobjectNameInput.value).toEqual(state.editedObjects[3].object_name);
        expect(getSubobjectCardAttributeElements(cards[0][1]).subobjectDescriptionInput.value).toEqual(state.editedObjects[3].object_description);
        clickSubobjectCardDataTabButton(cards[0][1]);
        linkInput = getByPlaceholderText(cards[0][1], "Link");
        expect(linkInput.value).toEqual(state.editedObjects[3].link);
    });


    test("Load a composite object and subobjects from backend", async () => {
        let { container, store } = renderWithWrappers(<Route exact path="/objects/:id"><EditObject /></Route>, {
            route: "/objects/3901"
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
        expect(linkInput.value).toEqual(state.editedObjects[firstID].link);

        // Check second subobject
        const secondID = cards[0][1].id;
        expect(getSubobjectCardAttributeElements(cards[0][1]).subobjectNameInput.value).toEqual(state.editedObjects[secondID].object_name);
        expect(getSubobjectCardAttributeElements(cards[0][1]).subobjectDescriptionInput.value).toEqual(state.editedObjects[secondID].object_description);
        clickSubobjectCardDataTabButton(cards[0][1]);

        const markdownContainer = cards[0][1].querySelector(".markdown-container");
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
        let { container } = renderWithWrappers(<Route exact path="/objects/:id"><EditObject /></Route>, {
            route: "/objects/3902"
        });

        // Check if data tab is correctly displayed after page load
        await waitFor(() => getByText(container, "Object Information"));
        clickDataTabButton(container);
        getSubobjectCards(container, { expectedNumbersOfCards: [1], countAddMenusAsCards: true }); 
    });
});


describe("Reset object", () => {
    test("Cancel reset + reset attributes and link", async () => {
        // Route component is required for matching (getting :id part of the URL in the EditObject component)
        let { container, store } = renderWithWrappers(<Route exact path="/objects/:id"><EditObject /></Route>, {
            route: "/objects/1"
        });
    
        // Check if object information is displayed on the page
        await waitFor(() => getByText(container, "Object Information"));
        const savedObjectAttributes = store.getState().objects[1];
        const savedObjectData = store.getState().links[1];

        // Modify link attributes and data
        let objectNameInput = getByPlaceholderText(container, "Object name");
        let objectDescriptionInput = getByPlaceholderText(container, "Object description");
        fireEvent.change(objectNameInput, { target: { value: "modified name" } });
        await waitFor(() => expect(getCurrentObject(store.getState()).object_name).toBe("modified name"));
        fireEvent.change(objectDescriptionInput, { target: { value: "modified description" } });
        await waitFor(() => expect(getCurrentObject(store.getState()).object_description).toBe("modified description"));
    
        clickDataTabButton(container);
        let linkInput = getByPlaceholderText(container, "Link");
        const linkValue = "https://modified.link"
        fireEvent.change(linkInput, { target: { value: linkValue } });
        await waitFor(() => expect(getCurrentObject(store.getState()).link).toBe(linkValue));

        // Cancel reset
        let resetButton = getSideMenuItem(container, "Reset");
        fireEvent.click(resetButton);
        fireEvent.click(getSideMenuDialogControls(container).buttons["No"]);
    
        linkInput = getByPlaceholderText(container, "Link");
        expect(linkInput.value).toEqual(linkValue);

        // Reset attributes and link
        resetObject(container);

        expect(linkInput.value).toEqual(savedObjectData.link);

        clickGeneralTabButton(container);
        objectNameInput = getByPlaceholderText(container, "Object name");
        expect(objectNameInput.value).toEqual(savedObjectAttributes.object_name);
        objectDescriptionInput = getByPlaceholderText(container, "Object description");
        expect(objectDescriptionInput.value).toEqual(savedObjectAttributes.object_description);
    });

    
    test("Reset markdown", async () => {
        // Route component is required for matching (getting :id part of the URL in the EditObject component)
        let { container, store } = renderWithWrappers(<Route exact path="/objects/:id"><EditObject /></Route>, {
            route: "/objects/1001"
        });
    
        // Check if object information is displayed on the page
        await waitFor(() => getByText(container, "Object Information"));
        const savedObjectData = store.getState().markdown[1001];
        
        clickDataTabButton(container);
        const editModeButton = getByTitle(container, "Display edit window")
        fireEvent.click(editModeButton);
        let inputForm = getByPlaceholderText(container, "Enter text here...");
        const rawText = "**Modified markdown**";
        fireEvent.change(inputForm, { target: { value: rawText } });
        await waitFor(() => expect(getCurrentObject(store.getState()).markdown.raw_text).toEqual(rawText));

        resetObject(container);
        inputForm = getByPlaceholderText(container, "Enter text here...");
        expect(inputForm.value).toEqual(savedObjectData.raw_text);
    });


    test("Reset to-do list", async () => {
        // Route component is required for matching (getting :id part of the URL in the EditObject component)
        let { container, store } = renderWithWrappers(<Route exact path="/objects/:id"><EditObject /></Route>, {
            route: "/objects/2001"
        });
    
        // Check if object information is displayed on the page
        await waitFor(() => getByText(container, "Object Information"));
        const firstItemText = store.getState().toDoLists[2001].items[0].item_text;
        
        clickDataTabButton(container);
        let firstItemInput = getByText(container.querySelector(".to-do-list-container"), firstItemText);
        const newItemText = "modified item";
        fireEvent.input(firstItemInput, { target: { innerHTML: newItemText } });
        await waitFor(() => expect(getCurrentObject(store.getState()).toDoList.items[0].item_text).toBe(newItemText));

        resetObject(container);
        await waitFor(() => getByText(container.querySelector(".to-do-list-container"), firstItemText));
    });


    test("Reset composite without subobjects", async () => {
        let { container, store } = renderWithWrappers(<Route exact path="/objects/:id"><EditObject /></Route>, {
            route: "/objects/3001"
        });
    
        // Load page and existing subobject
        await waitFor(() => getByText(container, "Object Information"));
        await waitFor(() => expect(store.getState().editedObjects).toHaveProperty(Object.keys(store.getState().editedObjects[3001].composite.subobjects)[0]));

        // Add 2 new subobjects
        clickDataTabButton(container);
        addANewSubobject(container);
        addANewSubobject(container);
        const cards = getSubobjectCards(container, { expectedNumbersOfCards: [3] });
        const [existingSubobjectID, firstNewSubobjectID, secondNewSubobjectID] = cards[0].map(card => card.id.toString());

        // Update existing subobject
        const existingSubobjectName = "updated name";
        fireEvent.change(getSubobjectCardAttributeElements(cards[0][0]).subobjectNameInput, { target: { value: existingSubobjectName } });
        await waitFor(() => expect(store.getState().editedObjects[cards[0][0].id].object_name).toEqual(existingSubobjectName));

        // Reset without subobjects
        resetObject(container);
        const state = store.getState();

        // Check if existing subobject is not reset and is present in composite object's subobjects
        expect(state.editedObjects[existingSubobjectID].object_name).toEqual(existingSubobjectName);
        expect(state.editedObjects[3001].composite.subobjects).toHaveProperty(existingSubobjectID);

        // Check if new subobjects are removed from editedObjects and composite object's subobjects
        expect(Object.keys(state.editedObjects[3001].composite.subobjects).length).toEqual(1);      // existing object is checked above
        expect(state.editedObjects).not.toHaveProperty(firstNewSubobjectID);
        expect(state.editedObjects).not.toHaveProperty(secondNewSubobjectID);
    });


    test("Reset composite with subobjects", async () => {
        let { container, store } = renderWithWrappers(<Route exact path="/objects/:id"><EditObject /></Route>, {
            route: "/objects/3001"
        });
    
        // Load page and existing subobject
        await waitFor(() => getByText(container, "Object Information"));
        await waitFor(() => expect(store.getState().editedObjects).toHaveProperty(Object.keys(store.getState().editedObjects[3001].composite.subobjects)[0]));


        // Add 2 new subobjects and 1 existing subobject
        clickDataTabButton(container);
        addANewSubobject(container);
        addANewSubobject(container);
        await addAnExistingSubobject(container, 0, "Some existing subobject", store, { waitForObjectLoad: true });
        const cards = getSubobjectCards(container, { expectedNumbersOfCards: [4] });
        const [existingSubobjectID, firstNewSubobjectID, secondNewSubobjectID, addedExistingSubobjectID] = cards[0].map(card => card.id.toString());

        // Update both existing subobjects
        const oldExistingSubobjectName = store.getState().objects[existingSubobjectID].object_name, updatedExistingSubobjectName = "updated name";
        fireEvent.change(getSubobjectCardAttributeElements(cards[0][0]).subobjectNameInput, { target: { value: updatedExistingSubobjectName } });
        await waitFor(() => expect(store.getState().editedObjects[existingSubobjectID].object_name).toEqual(updatedExistingSubobjectName));

        const updatedSecondExistingSubobjectName = "updated second name";
        fireEvent.change(getSubobjectCardAttributeElements(cards[0][3]).subobjectNameInput, { target: { value: updatedSecondExistingSubobjectName } });
        await waitFor(() => expect(store.getState().editedObjects[addedExistingSubobjectID].object_name).toEqual(updatedSecondExistingSubobjectName));

        // Reset object with subobjects
        resetObject(container, true);
        const state = store.getState();

        // Check if all added subobjects removed from composite object's data
        expect(Object.keys(state.editedObjects[3001].composite.subobjects).length).toEqual(1);
        expect(state.editedObjects[3001].composite.subobjects).toHaveProperty(existingSubobjectID);

        // Check if existing subobject is reset
        expect(state.editedObjects[existingSubobjectID].object_name).toEqual(oldExistingSubobjectName);

        // Check if new subobjects and added existing subobject are removed from state.editedObjects
        expect(state.editedObjects).not.toHaveProperty(firstNewSubobjectID);
        expect(state.editedObjects).not.toHaveProperty(secondNewSubobjectID);
        expect(state.editedObjects).not.toHaveProperty(addedExistingSubobjectID);
    });
});


describe("Persist edited object state", () => {
    test("Unchanged objects removal from edited objects storage", async () => {
        let store = createTestStore({ enableDebugLogging: false });
        const render = route => renderWithWrappers(<Route exact path="/objects/:id" render={ props => props.match.params.id === "add" ? <AddObject /> : <EditObject /> } />, {
            route, store
        });

        // Render page of an existing object
        var { container } = render("/objects/1");
        await waitFor(() => getByText(container, "Object Information"));
        expect(Object.keys(store.getState().editedObjects).includes("1")).toBeTruthy();

        // Trigger a redirect and check if the object was removed from editedObjects storage due to not being changed
        const cancelButton = getSideMenuItem(container, "Cancel");
        fireEvent.click(cancelButton);
        expect(Object.keys(store.getState().editedObjects).includes("1")).toBeFalsy();
    });


    test("Attributes and link", async () => {
        // Render page of the first object
        let { container, store, history } = renderWithWrappers(<Route exact path="/objects/:id" render={ props => props.match.params.id === "add" ? <AddObject /> : <EditObject /> } />, {
            route: "/objects/1", store
        });
        // await waitFor(() => getByText(container, "Object Information"));
        await waitForEditObjectPageLoad(container, store);

        // Modify attributes and link
        let objectNameInput = getByPlaceholderText(container, "Object name");
        let objectDescriptionInput = getByPlaceholderText(container, "Object description");
        const objectNameText = "modified name", objectDescriptionText = "modified description";
        fireEvent.change(objectNameInput, { target: { value: objectNameText } });
        await waitFor(() => expect(getCurrentObject(store.getState()).object_name).toBe(objectNameText));
        fireEvent.change(objectDescriptionInput, { target: { value: objectDescriptionText } });
        await waitFor(() => expect(getCurrentObject(store.getState()).object_description).toBe(objectDescriptionText));
    
        clickDataTabButton(container);
        let linkInput = getByPlaceholderText(container, "Link");
        const linkValue = "https://modified.link"
        fireEvent.change(linkInput, { target: { value: linkValue } });
        await waitFor(() => expect(getCurrentObject(store.getState()).link).toBe(linkValue));

        // Render another object page, then return to the original object
        history.push("/objects/2");
        await waitForEditObjectPageLoad(container, store);
        history.push("/objects/1");
        // await waitForEditObjectPageLoad(container, store);   // wait function can't catch fetch changing to true and false if data is present in the state
        
        // Check if modified values are displayed
        await waitFor(() => expect(getByPlaceholderText(container, "Link").value).toEqual(linkValue));

        clickGeneralTabButton(container);
        objectNameInput = getByPlaceholderText(container, "Object name");
        expect(objectNameInput.value).toEqual(objectNameText);
        objectDescriptionInput = getByPlaceholderText(container, "Object description");
        expect(objectDescriptionInput.value).toEqual(objectDescriptionText);
    });


    test("Markdown", async () => {
        // Render page of the first object
        let { container, store, history } = renderWithWrappers(<Route exact path="/objects/:id" render={ props => props.match.params.id === "add" ? <AddObject /> : <EditObject /> } />, {
            route: "/objects/1001", store
        });
        // await waitFor(() => getByText(container, "Object Information"));
        await waitForEditObjectPageLoad(container, store);

        // Modify markdown
        clickDataTabButton(container);
        const editModeButton = getByTitle(container, "Display edit window")
        fireEvent.click(editModeButton);
        let inputForm = getByPlaceholderText(container, "Enter text here...");
        const rawText = "**Modified Markdown text**";
        fireEvent.change(inputForm, { target: { value: rawText } });
        await waitFor(() => expect(getCurrentObject(store.getState()).markdown.raw_text).toEqual(rawText));

        // Render another object page, then return to the original object
        history.push("/objects/2");
        await waitForEditObjectPageLoad(container, store);
        history.push("/objects/1001");
        // await waitForEditObjectPageLoad(container, store);   // wait function can't catch fetch changing to true and false if data is present in the state
        
        // Check if modified Markdown is displayed
        await waitFor(() => expect(getByPlaceholderText(container, "Enter text here...").value).toEqual(rawText));
    });


    test("To-do list", async () => {
        // Render page of the first object
        let { container, store, history } = renderWithWrappers(<Route exact path="/objects/:id" render={ props => props.match.params.id === "add" ? <AddObject /> : <EditObject /> } />, {
            route: "/objects/2001", store
        });
        // await waitFor(() => getByText(container, "Object Information"));
        await waitForEditObjectPageLoad(container, store);
        const firstItemText = store.getState().toDoLists[2001].items[0].item_text;

        // Modify to-do list
        clickDataTabButton(container);
        let firstItemInput = getByText(container.querySelector(".to-do-list-container"), firstItemText);
        const newItemText = "modified item";
        fireEvent.input(firstItemInput, { target: { innerHTML: newItemText } });
        await waitFor(() => expect(getCurrentObject(store.getState()).toDoList.items[0].item_text).toBe(newItemText));

        // Render another object page, then return to the original object
        history.push("/objects/2");
        await waitForEditObjectPageLoad(container, store);
        history.push("/objects/2001");
        // await waitForEditObjectPageLoad(container, store);   // wait function can't catch fetch changing to true and false if data is present in the state
        
        // Check if modified Markdown is displayed
        await waitFor(() => getByText(container.querySelector(".to-do-list-container"), newItemText));
    });


    test("Composite data and subobjects", async () => {
        let { container, store, history } = renderWithWrappers(<Route exact path="/objects/:id" render={ props => props.match.params.id === "add" ? <AddObject /> : <EditObject /> } />, {
            route: "/objects/3001"
        });

        // Wait for the page to load
        await waitForEditObjectPageLoad(container, store);
        clickDataTabButton(container);

        // Wait for an existing subobject to load
        await waitFor(() => expect(store.getState().editedObjects).toHaveProperty(Object.keys(store.getState().editedObjects[3001].composite.subobjects)[0]));
        let card = getSubobjectCards(container, { expectedNumbersOfCards: [1] })[0][0];

        // Modify subobject name
        let newSubobjectName = "updated name";
        fireEvent.change(getSubobjectCardAttributeElements(card).subobjectNameInput, { target: { value: newSubobjectName } });
        await waitFor(() => expect(store.getState().editedObjects[card.id].object_name).toEqual(newSubobjectName));

        // Render subobject page and check if updated name is displayed
        history.push(`/objects/${card.id}`);
        clickGeneralTabButton(container);
        await waitFor(() => expect(getByPlaceholderText(container, "Object name").value).toEqual(newSubobjectName));
        
        // Modify subobject name again
        newSubobjectName = "updated twice name";
        fireEvent.change(getByPlaceholderText(container, "Object name"), { target: { value: newSubobjectName } });
        await waitFor(() => expect(store.getState().editedObjects[card.id].object_name).toEqual(newSubobjectName));

        // Return to main object page
        history.push(`/objects/3001`);
        await waitFor(() => getByText(container, "Object Information"));
        clickDataTabButton(container);
        
        card = getSubobjectCards(container, { expectedNumbersOfCards: [1] })[0][0];
        expect(getSubobjectCardAttributeElements(card).subobjectNameInput.value).toEqual(newSubobjectName);
    });


    test("Unchanged composite object's and subobject removal", async () => {
        let { container, store, history } = renderWithWrappers(<Route exact path="/objects/:id" render={ props => props.match.params.id === "add" ? <AddObject /> : <EditObject /> } />, {
            route: "/objects/3001", store
        });

        // Wait for the page to load and subobject to load
        await waitForEditObjectPageLoad(container, store);
        const subobjectID = Object.keys(store.getState().editedObjects[3001].composite.subobjects)[0];
        await waitFor(() => expect(store.getState().editedObjects).toHaveProperty(subobjectID));

        // Click cancel button
        fireEvent.click(getSideMenuItem(container, "Cancel"));

        // Check if object and subobject are removed from state.editedObjects
        await waitFor(() => expect(store.getState().editedObjects).not.toHaveProperty(subobjectID));
        expect(store.getState().editedObjects).not.toHaveProperty("3001");
    });


    test("Unchanged composite object and subobject removal", async () => {
        let { container, store, history } = renderWithWrappers(<Route exact path="/objects/:id" render={ props => props.match.params.id === "add" ? <AddObject /> : <EditObject /> } />, {
            route: "/objects/3001", store
        });

        // Wait for the page to load and subobject to load
        await waitForEditObjectPageLoad(container, store);
        const subobjectID = Object.keys(store.getState().editedObjects[3001].composite.subobjects)[0];
        await waitFor(() => expect(store.getState().editedObjects).toHaveProperty(subobjectID));

        // Click cancel button
        fireEvent.click(getSideMenuItem(container, "Cancel"));

        // Check if object and subobject are removed from state.editedObjects
        await waitFor(() => expect(store.getState().editedObjects).not.toHaveProperty(subobjectID));
        expect(store.getState().editedObjects).not.toHaveProperty("3001");
    });


    test("Unchanged composite object's with changed subobject removal", async () => {
        let { container, store, history } = renderWithWrappers(<Route exact path="/objects/:id" render={ props => props.match.params.id === "add" ? <AddObject /> : <EditObject /> } />, {
            route: "/objects/3001", store
        });

        // Wait for the page to load and subobject to load
        await waitForEditObjectPageLoad(container, store);
        const subobjectID = Object.keys(store.getState().editedObjects[3001].composite.subobjects)[0];
        await waitFor(() => expect(store.getState().editedObjects).toHaveProperty(subobjectID));
        clickDataTabButton(container);
        let card = getSubobjectCards(container, { expectedNumbersOfCards: [1] })[0][0];

        // Modify existing subobject's name
        let newSubobjectName = "updated name";
        fireEvent.change(getSubobjectCardAttributeElements(card).subobjectNameInput, { target: { value: newSubobjectName } });
        await waitFor(() => expect(store.getState().editedObjects[card.id].object_name).toEqual(newSubobjectName));

        // Click cancel button
        fireEvent.click(getSideMenuItem(container, "Cancel"));

        // Check if object is removed from state.editedObjects and subobject is not
        await waitFor(() => expect(store.getState().editedObjects).not.toHaveProperty("3001"));
        expect(store.getState().editedObjects).toHaveProperty(subobjectID);
    });


    test("Changed composite object's subobjects removal", async () => {
        let { container, store, history } = renderWithWrappers(<Route exact path="/objects/:id" render={ props => props.match.params.id === "add" ? <AddObject /> : <EditObject /> } />, {
            route: "/objects/3001", store
        });

        // Wait for the page to load
        await waitForEditObjectPageLoad(container, store);
        clickDataTabButton(container);

        // Wait for an existing subobject to load
        await waitFor(() => expect(store.getState().editedObjects).toHaveProperty(Object.keys(store.getState().editedObjects[3001].composite.subobjects)[0]));
        let card = getSubobjectCards(container, { expectedNumbersOfCards: [1] })[0][0];

        // Modify existing subobject's name
        let newSubobjectName = "updated name";
        fireEvent.change(getSubobjectCardAttributeElements(card).subobjectNameInput, { target: { value: newSubobjectName } });
        await waitFor(() => expect(store.getState().editedObjects[card.id].object_name).toEqual(newSubobjectName));

        // Add an existing subobject
        await addAnExistingSubobject(container, 0, "Some existing subobject", store, { waitForObjectLoad: true });
        const [firstSubobjectID, secondSubobjectID] = getSubobjectCards(container, { expectedNumbersOfCards: [2] })[0].map(card => card.id.toString());

        // Click cancel button
        fireEvent.click(getSideMenuItem(container, "Cancel"));

        // Check if unmodified subobject is removed from state.editedObjects, modified is not and object itself is not
        await waitFor(() => expect(store.getState().editedObjects).not.toHaveProperty(secondSubobjectID));
        expect(store.getState().editedObjects).toHaveProperty(firstSubobjectID);
        expect(store.getState().editedObjects).toHaveProperty("3001");
    });
});


describe("Delete object", () => {
    test("Delete a link object with fetch error", async () => {
        // Route component is required for matching (getting :id part of the URL in the EditObject component)
        let { container, store } = renderWithWrappers(<Route exact path="/objects/:id"><EditObject /></Route>, {
            route: "/objects/1"
        });
    
        // Wait for object information to be displayed on the page and try to delete the object
        await waitFor(() => getByText(container, "Object Information"));
        setFetchFail(true);
        let deleteButton = getSideMenuItem(container, "Delete");
        fireEvent.click(deleteButton);
        fireEvent.click(getSideMenuDialogControls(container).buttons["Yes"]);
    
        // Check if error message is displayed and object is not deleted from state
        await waitFor(() => getByText(container, "Failed to fetch data."));
        expect(store.getState().objects[1]).toBeTruthy();
        expect(store.getState().objectsTags[1]).toBeTruthy();
        expect(store.getState().links[1]).toBeTruthy();
    });


    test("Delete a link object", async () => {
        // Route component is required for matching (getting :id part of the URL in the EditObject component)
        let { container, store, history } = renderWithWrappers(<Route exact path="/objects/:id"><EditObject /></Route>, {
            route: "/objects/1"
        });
    
        // Wait for object information to be displayed on the page
        await waitFor(() => getByText(container, "Object Information"));
        let deleteButton = getSideMenuItem(container, "Delete");
        fireEvent.click(deleteButton);
    
        // Check if confirmation dialog has appeared
        expect(getSideMenuDialogControls(container).header.title).toEqual("Delete This Object?");
        fireEvent.click(getSideMenuDialogControls(container).buttons["No"]);
        expect(getSideMenuDialogControls(container)).toBeNull();
    
        // Check if delete removes the object and redirects
        deleteButton = getSideMenuItem(container, "Delete");
        fireEvent.click(deleteButton);
        fireEvent.click(getSideMenuDialogControls(container).buttons["Yes"]);
    
        await waitFor(() => expect(history.entries[history.length - 1].pathname).toBe("/objects"));
        expect(store.getState().objects[1]).toBeUndefined();
        expect(store.getState().objectsTags[1]).toBeUndefined();
        expect(store.getState().links[1]).toBeUndefined();
        expect(store.getState().editedObjects[1]).toBeUndefined();
    });


    test("Delete a markdown object", async () => {
        // Route component is required for matching (getting :id part of the URL in the EditObject component)
        let { container, store, history } = renderWithWrappers(<Route exact path="/objects/:id"><EditObject /></Route>, {
            route: "/objects/1001"
        });
    
        // Wait for object information to be displayed on the page
        await waitFor(() => getByText(container, "Object Information"));
    
        // Check if delete removes the object and redirects
        let deleteButton = getSideMenuItem(container, "Delete");
        fireEvent.click(deleteButton);
        fireEvent.click(getSideMenuDialogControls(container).buttons["Yes"]);
    
        await waitFor(() => expect(history.entries[history.length - 1].pathname).toBe("/objects"));
        expect(store.getState().objects[1001]).toBeUndefined();
        expect(store.getState().markdown[1001]).toBeUndefined();
        expect(store.getState().editedObjects[1001]).toBeUndefined();
    });


    test("Delete a to-do list object", async () => {
        // Route component is required for matching (getting :id part of the URL in the EditObject component)
        let { container, store, history } = renderWithWrappers(<Route exact path="/objects/:id"><EditObject /></Route>, {
            route: "/objects/2001"
        });
    
        // Wait for object information to be displayed on the page
        await waitFor(() => getByText(container, "Object Information"));
    
        // Check if delete removes the object and redirects
        let deleteButton = getSideMenuItem(container, "Delete");
        fireEvent.click(deleteButton);
        fireEvent.click(getSideMenuDialogControls(container).buttons["Yes"]);
    
        await waitFor(() => expect(history.entries[history.length - 1].pathname).toBe("/objects"));
        expect(store.getState().objects[2001]).toBeUndefined();
        expect(store.getState().toDoLists[2001]).toBeUndefined();
        expect(store.getState().editedObjects[2001]).toBeUndefined();
    });


    test("Delete a composite object without deleting subobjects", async () => {
        // Route component is required for matching (getting :id part of the URL in the EditObject component)
        let { container, store, history } = renderWithWrappers(<Route exact path="/objects/:id"><EditObject /></Route>, {
            route: "/objects/3001"
        });

        // Wait for object information to be displayed on the page
        await waitFor(() => getByText(container, "Object Information"));

        // Wait for an existing subobject to load
        await waitFor(() => expect(store.getState().editedObjects).toHaveProperty(Object.keys(store.getState().editedObjects[3001].composite.subobjects)[0]));
        clickDataTabButton(container);

        // Add a new subobject
        addANewSubobject(container);
        const cards = getSubobjectCards(container, { expectedNumbersOfCards: [2] });
        const [existingSubobjectID, newSubobjectID] = cards[0].map(card => card.id.toString());

        // Modify existing subobject
        let newSubobjectName = "updated name";
        fireEvent.change(getSubobjectCardAttributeElements(cards[0][0]).subobjectNameInput, { target: { value: newSubobjectName } });
        await waitFor(() => expect(store.getState().editedObjects[existingSubobjectID].object_name).toEqual(newSubobjectName));

        // Delete composite object without deleting subobjects
        let deleteButton = getSideMenuItem(container, "Delete");
        fireEvent.click(deleteButton);
        fireEvent.click(getSideMenuDialogControls(container).buttons["Yes"]);
    
        // Check if redirect occured
        await waitFor(() => expect(history.entries[history.length - 1].pathname).toBe("/objects"));
        const state = store.getState();

        // Check if composite object is removed from state
        expect(state.objects).not.toHaveProperty("3001");
        expect(state.composite).not.toHaveProperty("3001");
        expect(state.editedObjects).not.toHaveProperty("3001");
        
        // Check if new subobject is deleted
        expect(state.editedObjects).not.toHaveProperty(newSubobjectID);

        // Check if existing subobject is not deleted or reset
        expect(state.objects).toHaveProperty(existingSubobjectID);
        expect(state.links).toHaveProperty(existingSubobjectID);
        expect(state.objectsTags).toHaveProperty(existingSubobjectID);
        expect(state.editedObjects).toHaveProperty(existingSubobjectID);
        expect(state.editedObjects[existingSubobjectID].object_name).toEqual(newSubobjectName);
    });


    test("Delete a composite object and subobjects", async () => {
        // Route component is required for matching (getting :id part of the URL in the EditObject component)
        let { container, store, history } = renderWithWrappers(<Route exact path="/objects/:id"><EditObject /></Route>, {
            route: "/objects/3001"
        });

        // Wait for object information to be displayed on the page
        await waitFor(() => getByText(container, "Object Information"));

        // Wait for an existing subobject to load
        await waitFor(() => expect(store.getState().editedObjects).toHaveProperty(Object.keys(store.getState().editedObjects[3001].composite.subobjects)[0]));
        clickDataTabButton(container);

        // Add a new subobject
        addANewSubobject(container);
        const cards = getSubobjectCards(container, { expectedNumbersOfCards: [2] });
        const [existingSubobjectID, newSubobjectID] = cards[0].map(card => card.id.toString());

        // Modify existing subobject
        let newSubobjectName = "updated name";
        fireEvent.change(getSubobjectCardAttributeElements(cards[0][0]).subobjectNameInput, { target: { value: newSubobjectName } });
        await waitFor(() => expect(store.getState().editedObjects[existingSubobjectID].object_name).toEqual(newSubobjectName));

        // Delete composite object and subobjects
        let deleteButton = getSideMenuItem(container, "Delete");
        fireEvent.click(deleteButton);
        fireEvent.click(getSideMenuDialogControls(container).checkbox);
        fireEvent.click(getSideMenuDialogControls(container).buttons["Yes"]);
    
        // Check if redirect occured
        await waitFor(() => expect(history.entries[history.length - 1].pathname).toBe("/objects"));
        const state = store.getState();

        // Check if composite object is removed from state
        expect(state.objects).not.toHaveProperty("3001");
        expect(state.composite).not.toHaveProperty("3001");
        expect(state.editedObjects).not.toHaveProperty("3001");
        
        // Check if new subobject is deleted
        expect(state.editedObjects).not.toHaveProperty(newSubobjectID);

        // Check if existing subobject is deleted
        expect(state.objects).not.toHaveProperty(existingSubobjectID);
        expect(state.links).not.toHaveProperty(existingSubobjectID);
        expect(state.objectsTags).not.toHaveProperty(existingSubobjectID);
        expect(state.editedObjects).not.toHaveProperty(existingSubobjectID);
    });
});


describe("Update object errors", () => {
    test("Update a link object with fetch error", async () => {
        // Route component is required for matching (getting :id part of the URL in the EditObject component)
        let { container, store } = renderWithWrappers(<Route exact path="/objects/:id"><EditObject /></Route>, {
            route: "/objects/1"
        });
    
        // Wait for object information to be displayed on the page and try modifying the object
        await waitFor(() => getByText(container, "Object Information"));
        let oldObject = {...store.getState().objects[1]};
        let oldLink = {...store.getState().links[1]};
        let saveButton = getSideMenuItem(container, "Save");
        let objectNameInput = getByPlaceholderText(container, "Object name");
        let objectDescriptionInput = getByPlaceholderText(container, "Object description");
    
        // Modify attributes
        fireEvent.change(objectNameInput, { target: { value: "error" } });
        await waitFor(() => expect(getCurrentObject(store.getState()).object_name).toBe("error"));
        fireEvent.change(objectDescriptionInput, { target: { value: "modified object description" } });
        await waitFor(() => expect(getCurrentObject(store.getState()).object_description).toBe("modified object description"));
    
        // Modify data
        clickDataTabButton(container);
        let linkInput = getByPlaceholderText(container, "Link");
        fireEvent.change(linkInput, { target: { value: "https://test.link.modified" } });
        await waitFor(() => expect(getCurrentObject(store.getState()).link).toBe("https://test.link.modified"));
    
        // Check error message is displayed and object is not modified in the state
        setFetchFail(true);
        fireEvent.click(saveButton);
        await waitFor(() => getByText(container, "Failed to fetch data."));
        for (let attr of ["object_name", "object_description", "created_at", "modified_at"]) {
            expect(store.getState().objects[1][attr]).toEqual(oldObject[attr]);
        }
        expect(store.getState().links[1].link).toEqual(oldLink.link);
    });
    

    test("Save an empty link object", async () => {
        // Route component is required for matching (getting :id part of the URL in the EditObject component)
        let { container, store } = renderWithWrappers(<Route exact path="/objects/:id"><EditObject /></Route>, {
            route: "/objects/1"
        });
    
        // Wait for object information to be displayed on the page
        await waitFor(() => getByText(container, "Object Information"));
        let saveButton = getSideMenuItem(container, "Save");
        let oldObjectData = {...store.getState().links[1]};
    
        // Check if an empty link is not saved
        clickDataTabButton(container);
        let linkInput = getByPlaceholderText(container, "Link");
        fireEvent.change(linkInput, { target: { value: "" } });
        await waitFor(() => expect(getCurrentObject(store.getState()).link).toBe(""));
        fireEvent.click(saveButton);
        await waitFor(() => getByText(container, "Link value is required.", { exact: false }));
        expect(store.getState().links[1].link).toEqual(oldObjectData.link);
    });


    test("Save an empty markdown object", async () => {
        // Route component is required for matching (getting :id part of the URL in the EditObject component)
        let { container, store } = renderWithWrappers(<Route exact path="/objects/:id"><EditObject /></Route>, {
            route: "/objects/1001"
        });
    
        // Wait for object information to be displayed on the page
        await waitFor(() => getByText(container, "Object Information"));
        let saveButton = getSideMenuItem(container, "Save");
        let oldObjectData = {...store.getState().markdown[1001]};
    
        // Clear raw text
        clickDataTabButton(container);
        const markdownContainer = document.querySelector(".markdown-container");
        expect(markdownContainer).toBeTruthy();
        let bothModeButton = getByTitle(markdownContainer, "Display edit window and parsed markdown");
        fireEvent.click(bothModeButton);
        let markdownInput = getByPlaceholderText(container, "Enter text here...");
        fireEvent.change(markdownInput, { target: { value: "" } });
        await waitFor(() => expect(getCurrentObject(store.getState()).markdown.raw_text).toBe(""));
    
        // Check if an empty markdown is not saved
        fireEvent.click(saveButton);
        await waitFor(() => getByText(container, "Markdown text is required.", { exact: false }));
        expect(store.getState().markdown[1001].raw_text).toEqual(oldObjectData.raw_text);
    });


    test("Save an empty to-do list object", async () => {
        // Route component is required for matching (getting :id part of the URL in the EditObject component)
        let { container, store } = renderWithWrappers(<Route exact path="/objects/:id"><EditObject /></Route>, {
            route: "/objects/2001"
        });
    
        // Wait for object information to be displayed on the page
        await waitFor(() => getByText(container, "Object Information"));
        let saveButton = getSideMenuItem(container, "Save");
        let oldObjectData = {...store.getState().toDoLists[2001]};
        clickDataTabButton(container);
        const TDLContainer = container.querySelector(".to-do-list-container");
        expect(TDLContainer).toBeTruthy();
        
        // Delete all items
        TDLContainer.querySelectorAll(".to-do-list-item").forEach(item => {
            if (!queryByPlaceholderText(item, "New item")) {    // skip new item input
                fireEvent.mouseEnter(item);
                const deleteButton = getByTitle(item, "Delete item");
                fireEvent.click(deleteButton);
            }
        });
        expect(Object.keys(getCurrentObject(store.getState()).toDoList.items).length).toEqual(0);
    
        // Check if an empty to-do list is not saved
        fireEvent.click(saveButton);
        await waitFor(() => getByText(container, "At least one item is required in the to-do list.", { exact: false }));
        expect(compareArrays(Object.keys(store.getState().toDoLists[2001].items).sort(), Object.keys(oldObjectData.items).sort())).toBeTruthy();
    });


    test("Composite object without non-deleted subobjects", async () => {
        let { container, store } = renderWithWrappers(<Route exact path="/objects/:id"><EditObject /></Route>, {
            route: "/objects/3001"
        });

        // Wait for object and its subobject to load
        await waitFor(() => getByText(container, "Object Information"));
        await waitFor(() => expect(store.getState().editedObjects).toHaveProperty(Object.keys(store.getState().editedObjects[3001].composite.subobjects)[0]));

        // Add a new subobject, then delete both subobjects
        clickDataTabButton(container);
        addANewSubobject(container);
        let cards = getSubobjectCards(container, { expectedNumbersOfCards: [2] });
        fireEvent.click(getSubobjectCardMenuButtons(cards[0][0]).fullDeleteButton);
        fireEvent.click(getSubobjectCardMenuButtons(cards[0][1]).deleteButton);

        // Click save button and check if error message is displayed and save did not occur
        fireEvent.click(getSideMenuItem(container, "Save"));
        await waitFor(() => getByText(container, "Composite object must have at least one non-deleted subobject.", { exact: false }));
        expect(Object.keys(store.getState().composite[3001].subobjects).length).toEqual(1);
    });


    test("Composite object a with a new subobject with incorrect attributes", async () => {
        let { container, store } = renderWithWrappers(<Route exact path="/objects/:id"><EditObject /></Route>, {
            route: "/objects/3001"
        });

        // Wait for object and its subobject to load
        await waitFor(() => getByText(container, "Object Information"));
        await waitFor(() => expect(store.getState().editedObjects).toHaveProperty(Object.keys(store.getState().editedObjects[3001].composite.subobjects)[0]));

        // Add a new subobject and edit its data
        clickDataTabButton(container);
        addANewSubobject(container);
        const card = getSubobjectCards(container, { expectedNumbersOfCards: [2] })[0][1];
        clickSubobjectCardDataTabButton(card);
        fireEvent.change(getByPlaceholderText(card, "Link"), { target: { value: "new link value" }});
        await waitFor(() => expect(store.getState().editedObjects[card.id].link).toBe("new link value"));

        // Click save button and check if error message is displayed and save did not occur
        fireEvent.click(getSideMenuItem(container, "Save"));
        await waitFor(() => getByText(container, "Object name is required.", { exact: false }));
    });


    test("Composite object a with an existing subobject with incorrect data", async () => {
        let { container, store } = renderWithWrappers(<Route exact path="/objects/:id"><EditObject /></Route>, {
            route: "/objects/3001"
        });

        // Wait for object and its subobject to load
        await waitFor(() => getByText(container, "Object Information"));
        await waitFor(() => expect(store.getState().editedObjects).toHaveProperty(Object.keys(store.getState().editedObjects[3001].composite.subobjects)[0]));

        // Modify existing subobject's data to become invalid
        clickDataTabButton(container);
        const card = getSubobjectCards(container, { expectedNumbersOfCards: [1] })[0][0];
        clickSubobjectCardDataTabButton(card);
        fireEvent.change(getByPlaceholderText(card, "Link"), { target: { value: "" }});
        await waitFor(() => expect(store.getState().editedObjects[card.id].link).toBe(""));

        // Click save button and check if error message is displayed and save did not occur
        fireEvent.click(getSideMenuItem(container, "Save"));
        await waitFor(() => getByText(container, "Link value is required.", { exact: false }));
        expect(store.getState().links[card.id].link).not.toEqual("");
    });
});


describe("Update object", () => {
    test("Update a link object + check all attributes update", async () => {
        // Route component is required for matching (getting :id part of the URL in the EditObject component)
        let { container, store } = renderWithWrappers(<Route exact path="/objects/:id"><EditObject /></Route>, {
            route: "/objects/1"
        });
    
        // Wait for object information to be displayed on the page
        await waitFor(() => getByText(container, "Object Information"));
        let saveButton = getSideMenuItem(container, "Save");
        let objectNameInput = getByPlaceholderText(container, "Object name");
        let objectDescriptionInput = getByPlaceholderText(container, "Object description");
    
        // Modify attributes
        fireEvent.change(objectNameInput, { target: { value: "modified object name" } });
        await waitFor(() => expect(getCurrentObject(store.getState()).object_name).toBe("modified object name"));
        fireEvent.change(objectDescriptionInput, { target: { value: "modified object description" } });
        await waitFor(() => expect(getCurrentObject(store.getState()).object_description).toBe("modified object description"));
    
        // Modify data
        clickDataTabButton(container);
        let linkInput = getByPlaceholderText(container, "Link");
        fireEvent.change(linkInput, { target: { value: "https://test.link.modified" } });
        await waitFor(() => expect(getCurrentObject(store.getState()).link).toBe("https://test.link.modified"));

        // Publish object
        expect(store.getState().editedObjects[1].is_published).toBeFalsy();
        clickDisplayTabButton(container);
        clickPublishObjectCheckbox(container);
        expect(store.getState().editedObjects[1].is_published).toBeTruthy();
    
        //  Save object
        fireEvent.click(saveButton);
        await waitFor(() => expect(store.getState().objects[1].object_name).toEqual("modified object name"));
        expect(store.getState().objects[1].object_description).toEqual("modified object description");
        expect(store.getState().objects[1].is_published).toBeTruthy();
        expect(store.getState().links[1].link).toEqual("https://test.link.modified");
    });
    

    test("Update a markdown object", async () => {
        // Route component is required for matching (getting :id part of the URL in the EditObject component)
        let { container, store } = renderWithWrappers(<Route exact path="/objects/:id"><EditObject /></Route>, {
            route: "/objects/1001"
        });
    
        // Wait for object information to be displayed on the page
        await waitFor(() => getByText(container, "Object Information"));
        let saveButton = getSideMenuItem(container, "Save");
    
        // Modify attributes
        let objectNameInput = getByPlaceholderText(container, "Object name");
        let objectDescriptionInput = getByPlaceholderText(container, "Object description");
        fireEvent.change(objectNameInput, { target: { value: "modified object name" } });
        await waitFor(() => expect(getCurrentObject(store.getState()).object_name).toBe("modified object name"));
        fireEvent.change(objectDescriptionInput, { target: { value: "modified object description" } });
        await waitFor(() => expect(getCurrentObject(store.getState()).object_description).toBe("modified object description"));
        
        // Modify data
        clickDataTabButton(container);
        const markdownContainer = document.querySelector(".markdown-container");
        expect(markdownContainer).toBeTruthy();
        let bothModeButton = getByTitle(markdownContainer, "Display edit window and parsed markdown");
        fireEvent.click(bothModeButton);
        let inputForm = getByPlaceholderText(markdownContainer, "Enter text here...");
        fireEvent.change(inputForm, { target: { value: "# Modified Markdown" } });
        await waitFor(() => expect(getCurrentObject(store.getState()).markdown.raw_text).toBe("# Modified Markdown"));
    
        // Save object    
        fireEvent.click(saveButton);
        await waitFor(() => expect(store.getState().objects[1001].object_name).toEqual("modified object name"));
        expect(store.getState().objects[1001].object_description).toEqual("modified object description");
        expect(store.getState().markdown[1001].raw_text).toEqual("# Modified Markdown");
    });
    

    test("Update a to-do list object", async () => {
        // Route component is required for matching (getting :id part of the URL in the EditObject component)
        let { container, store } = renderWithWrappers(<Route exact path="/objects/:id"><EditObject /></Route>, {
            route: "/objects/2001"
        });
    
        // Wait for object information to be displayed on the page
        await waitFor(() => getByText(container, "Object Information"));
        let saveButton = getSideMenuItem(container, "Save");
    
        // Modify attributes
        let objectNameInput = getByPlaceholderText(container, "Object name");
        let objectDescriptionInput = getByPlaceholderText(container, "Object description");
        fireEvent.change(objectNameInput, { target: { value: "modified object name" } });
        await waitFor(() => expect(getCurrentObject(store.getState()).object_name).toBe("modified object name"));
        fireEvent.change(objectDescriptionInput, { target: { value: "modified object description" } });
        await waitFor(() => expect(getCurrentObject(store.getState()).object_description).toBe("modified object description"));
    
        // Modify data
        clickDataTabButton(container);
        const TDLContainer = container.querySelector(".to-do-list-container");
        expect(TDLContainer).toBeTruthy();
        let newItemInput = getByPlaceholderText(TDLContainer, "New item");
        const newItemIndex = Math.max(...getCurrentObject(store.getState()).toDoList.itemOrder) + 1;
        fireEvent.input(newItemInput, { target: { innerHTML: "new to-do list item" }});
        await waitFor(() => expect(getCurrentObject(store.getState()).toDoList.items[newItemIndex].item_text).toBe("new to-do list item"));
    
        // Save object
        fireEvent.click(saveButton);
        await waitFor(() => expect(store.getState().objects[2001].object_name).toEqual("modified object name"));
        expect(store.getState().objects[2001].object_description).toEqual("modified object description");
        expect(store.getState().toDoLists[2001].items[newItemIndex].item_text).toEqual("new to-do list item");
    });


    test("Update a composite object", async () => {
        let { container, store } = renderWithWrappers(<Route exact path="/objects/:id"><EditObject /></Route>, {
            route: "/objects/3001"
        });

        // Wait for object and its subobject to load
        await waitFor(() => getByText(container, "Object Information"));
        await waitFor(() => expect(store.getState().editedObjects).toHaveProperty(Object.keys(store.getState().editedObjects[3001].composite.subobjects)[0]));

        // Modify object name
        const updatedObjectName = "Updated object name";
        fireEvent.change(getByPlaceholderText(container, "Object name"), { target: { value: updatedObjectName } });
        await waitFor(() => expect(getCurrentObject(store.getState()).object_name).toBe(updatedObjectName));

        // Add 3 new & 3 existing subobjects
        clickDataTabButton(container);
        addANewSubobject(container);
        addANewSubobject(container);
        addANewSubobject(container);
        await addAnExistingSubobject(container, 0, "fully deleted existing", store, { waitForObjectLoad: true });
        await addAnExistingSubobject(container, 0, "unmodified existing", store, { waitForObjectLoad: true });
        await addAnExistingSubobject(container, 0, "existing to be modified", store, { waitForObjectLoad: true });
        let cards = getSubobjectCards(container, { expectedNumbersOfCards: [7] });
        const [deletedExistingID, deletedNewID, firstNewID, secondNewID, fullyDeletedExistingID, unmodifiedExistingID, modifiedExistingID] = cards[0].map(card => card.id);

        // Delete 2 subobjects (existing + new), fully delete 1 existing subobject
        fireEvent.click(getSubobjectCardMenuButtons(cards[0][0]).deleteButton);
        fireEvent.click(getSubobjectCardMenuButtons(cards[0][1]).deleteButton);
        fireEvent.click(getSubobjectCardMenuButtons(cards[0][4]).fullDeleteButton);

        // Modify new subobjects
        const firstNewName = "first new subobject", firstLink = "http://first.link";
        fireEvent.change(getSubobjectCardAttributeElements(cards[0][2]).subobjectNameInput, { target: { value: firstNewName } });
        await waitFor(() => expect(store.getState().editedObjects[firstNewID].object_name).toEqual(firstNewName));
        clickSubobjectCardDataTabButton(cards[0][2]);
        fireEvent.change(getByPlaceholderText(cards[0][2], "Link"), { target: { value: firstLink }});
        await waitFor(() => expect(store.getState().editedObjects[firstNewID].link).toEqual(firstLink));
        clickSubobjectCardDisplayTabButton(cards[0][2]);
        clickPublishObjectCheckbox(cards[0][2]);
        expect(store.getState().editedObjects[firstNewID].is_published).toBeTruthy();

        const secondNewName = "second new subobject", secondLink = "http://second.link";
        fireEvent.change(getSubobjectCardAttributeElements(cards[0][3]).subobjectNameInput, { target: { value: secondNewName } });
        await waitFor(() => expect(store.getState().editedObjects[secondNewID].object_name).toEqual(secondNewName));
        clickSubobjectCardDataTabButton(cards[0][3]);
        fireEvent.change(getByPlaceholderText(cards[0][3], "Link"), { target: { value: secondLink }});
        await waitFor(() => expect(store.getState().editedObjects[secondNewID].link).toEqual(secondLink));

        // Modify existing subobject and collapse its card
        const unModifiedExistingTimestamp = store.getState().objects[unmodifiedExistingID].modified_at;
        const modifiedExistingName = "modified existing", modifiedExistingLink = "http://modifed.link";
        fireEvent.change(getSubobjectCardAttributeElements(cards[0][6]).subobjectNameInput, { target: { value: modifiedExistingName } });
        await waitFor(() => expect(store.getState().editedObjects[modifiedExistingID].object_name).toEqual(modifiedExistingName));
        clickSubobjectCardDataTabButton(cards[0][6]);
        fireEvent.change(getByPlaceholderText(cards[0][6], "Link"), { target: { value: modifiedExistingLink }});
        await waitFor(() => expect(store.getState().editedObjects[modifiedExistingID].link).toEqual(modifiedExistingLink));
        fireEvent.click(getSubobjectExpandToggleButton(cards[0][6]));
        await waitFor(() => expect(store.getState().editedObjects[3001].composite.subobjects[modifiedExistingID].is_expanded).toBeFalsy());

        // Click save button and wait for the object to be updated
        fireEvent.click(getSideMenuItem(container, "Save"));
        await waitFor(() => expect(store.getState().objects[3001].object_name).toEqual(updatedObjectName));
        const object_id = 3001;
        const state = store.getState();
        
        // Check updated composite object (has 4 subobjects in both editedObjects & composite storages)
        const strObjectID = object_id.toString();
        expect(state.composite).toHaveProperty(strObjectID);
        expect(Object.keys(state.composite[object_id].subobjects).length).toEqual(4);
        expect(Object.keys(state.editedObjects[object_id].composite.subobjects).length).toEqual(4);

        // Deleted new subobject, deleted and fully deleted existing subobjects
        for (let subobjectID of [deletedNewID, deletedExistingID, fullyDeletedExistingID]) {
            const strSubobjectID = subobjectID.toString();
            expect(state.editedObjects).not.toHaveProperty(strSubobjectID);
            expect(state.editedObjects[object_id].composite.subobjects).not.toHaveProperty(strSubobjectID);
            expect(state.composite[object_id].subobjects).not.toHaveProperty(strSubobjectID);
        }

        // First and second new subobjects (are present in editedObjects under mapped ids)
        for (let [subobjectID, subobjectName] of [[firstNewID, firstNewName], [secondNewID, secondNewName]]) {
            const strSubobjectID = subobjectID.toString();
            expect(state.editedObjects).not.toHaveProperty(strSubobjectID);
            
            const mappedID = getMappedSubobjectID(subobjectID, "link").toString();
            expect(state.editedObjects).toHaveProperty(mappedID);
            expect(state.editedObjects[mappedID].object_name).toEqual(subobjectName);

            expect(state.composite[object_id].subobjects).toHaveProperty(mappedID);
            expect(state.editedObjects[object_id].composite.subobjects).toHaveProperty(mappedID);

            expect(state.editedObjects[object_id].is_published).toEqual(subobjectID === firstNewName);  // first new subobject is published
        }

        // Unmodified and modified existing subobjects (are present in state.editedObjects and in subobjects of saved object)
        for (let subobjectID of [unmodifiedExistingID, modifiedExistingID]) {
            const strSubobjectID = subobjectID.toString();
            expect(state.editedObjects).toHaveProperty(strSubobjectID);
            expect(state.composite[object_id].subobjects).toHaveProperty(strSubobjectID);
            expect(state.editedObjects[object_id].composite.subobjects).toHaveProperty(strSubobjectID);
        }

        // Unmodified existing subobject (modified_at timestamp is not changed)
        expect(state.editedObjects[unmodifiedExistingID].modified_at).toEqual(unModifiedExistingTimestamp);
        expect(state.objects[unmodifiedExistingID].modified_at).toEqual(unModifiedExistingTimestamp);

        // Modified existing subobject (has updated modified_at & object_name, as well as is_expanded value)
        expect(state.objects[modifiedExistingID].object_name).toEqual(modifiedExistingName);
        expect(state.links[modifiedExistingID].link).toEqual(modifiedExistingLink);
        expect(state.editedObjects[modifiedExistingID].modified_at).toEqual(state.objects[object_id].modified_at);
        expect(state.objects[modifiedExistingID].modified_at).toEqual(state.objects[object_id].modified_at);
        expect(state.composite[object_id].subobjects[modifiedExistingID].is_expanded).toBeFalsy();

        // Rows of non-deleted subobjects are updated
        for (let subobjectsStorage of [state.composite[object_id].subobjects, state.editedObjects[object_id].composite.subobjects]) {
            expect(subobjectsStorage[getMappedSubobjectID(firstNewID, "link")].row).toEqual(0);
            expect(subobjectsStorage[getMappedSubobjectID(secondNewID, "link")].row).toEqual(1);
            expect(subobjectsStorage[unmodifiedExistingID].row).toEqual(2);
            expect(subobjectsStorage[modifiedExistingID].row).toEqual(3);
        }

        // Subobject cards are rendered
        clickDataTabButton(container);
        cards = getSubobjectCards(container, { expectedNumbersOfCards: [4] });
        const expectedCardIDs = [getMappedSubobjectID(firstNewID, "link"), getMappedSubobjectID(secondNewID, "link"), unmodifiedExistingID, modifiedExistingID];
        for (let i = 0; i < 4; i++) expect(cards[0][i].id).toEqual(expectedCardIDs[i].toString());
    });
});
