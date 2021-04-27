import React from "react";
import { Route } from "react-router-dom";

import { fireEvent } from "@testing-library/react";
import { getByText, getByPlaceholderText, waitFor, getByTitle } from "@testing-library/dom";

import { renderWithWrappers, renderWithWrappersAndDnDProvider } from "./test-utils/render";
import { getCurrentObject, getObjectTypeSelectingElements, clickGeneralTabButton, clickDataTabButton, resetObject } from "./test-utils/ui-object";

import createStore from "../src/store/create-store";
import { AddObject, EditObject } from "../src/components/object";
import { addObjects } from "../src/actions/data-objects";


/*
    /objects/add page tests.
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



describe("UI checks", () => {
    test("Render page and click cancel button", async () => {
        let { container, history } = renderWithWrappers(<Route exact path="/objects/:id"><AddObject /></Route>, {
            route: "/objects/add"
        });
        
        // Check if add object page was loaded with empty input fields
        let addObjectHeader = getByText(container, "Add a New Object");
        let objectNameInput = getByPlaceholderText(container, "Object name");
        let objectDescriptionInput = getByPlaceholderText(container, "Object description");
        expect(objectNameInput.value).toBe("");
        expect(objectDescriptionInput.value).toBe("");
    
        // Check if an empty name can't be submitted
        let saveButton = getByText(container, "Save");
        let cancelButton = getByText(container, "Cancel");
        expect(saveButton.className.startsWith("disabled")).toBeTruthy(); // Semantic UI always adds onClick event to div elements, even if they are disabled (which does nothing in this case)
        // expect(saveButton.onclick).toBeNull(); 
    
        // Check if cancel button redirects to /objects page
        fireEvent.click(cancelButton);
        expect(history.entries[history.length - 1].pathname).toBe("/objects");
    });


    test("Select different object types", async () => {
        let { store, container } = renderWithWrappersAndDnDProvider(<Route exact path="/objects/:id"><AddObject /></Route>, {
            route: "/objects/add"
        });
    
        // Select markdown object type and check if markdown inputs are rendered
        let { markdownButton } = getObjectTypeSelectingElements(container);
        fireEvent.click(markdownButton);
        clickDataTabButton(container);
        const markdownContainer = document.querySelector(".markdown-container");
        expect(markdownContainer).toBeTruthy();
        // expect(mainContentContainer.childNodes[mainContentContainer.childNodes.length - 4]).toEqual(objectNameDescriptionInput);    // fourth to last node is NameDescr input (before object data div, tag block, tag block header)
        // expect(mainContentContainer.lastChild).toEqual(markdownContainer);  // last node is Markdown input mock
        expect(getCurrentObject(store.getState()).object_type).toEqual("markdown");
        getByText(container, "Markdown", { exact: false });
    
        // Select to-do object type and check if to-do inputs are rendered
        clickGeneralTabButton(container);
        let { TDLButton } = getObjectTypeSelectingElements(container);
        fireEvent.click(TDLButton);
        clickDataTabButton(container);
        const TDLContainer = container.querySelector(".to-do-list-container");
        expect(TDLContainer).toBeTruthy();
        // expect(mainContentContainer.childNodes[mainContentContainer.childNodes.length - 4]).toEqual(objectNameDescriptionInput);    // fourth to last node is NameDescr input
        // expect(mainContentContainer.lastChild).toEqual(TDLContainer);  // last node is To-Do list input mock
        expect(getCurrentObject(store.getState()).object_type).toEqual("to_do_list");
        getByText(container, "To-Do List", { exact: false });
        
        // Select link object type and check if link inputs are rendered    
        clickGeneralTabButton(container);
        let { linkButton } = getObjectTypeSelectingElements(container);
        fireEvent.click(linkButton);
        clickDataTabButton(container);
        // expect(mainContentContainer.childNodes[mainContentContainer.childNodes.length - 4]).toEqual(objectNameDescriptionInput);    // fourth to last node is NameDescr input
        // const linkInput = getByPlaceholderText(mainContentContainer, "Link");
        // expect(mainContentContainer.lastChild).toEqual(linkInput.parentNode.parentNode.parentNode);   // last node is link input form
        expect(getCurrentObject(store.getState()).object_type).toEqual("link");
        getByPlaceholderText(container, "Link", { exact: false });
    });


    test("Change markdown display modes & render markdown", async () => {
        let { container, store } = renderWithWrappers(<Route exact path="/objects/:id"><AddObject /></Route>, {
            route: "/objects/add"
        });
        // Change object type
        let { markdownButton } = getObjectTypeSelectingElements(container);
        fireEvent.click(markdownButton);
    
        // Select data tab
        clickDataTabButton(container);
        const markdownContainer = document.querySelector(".markdown-container");
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
        let viewContainer = markdownContainer.querySelector(".markdown-parsed-container");
        getByText(viewContainer, "Test text");
    
        // Click on both mode
        let bothModeButton = getByTitle(markdownContainer, "Display edit window and parsed markdown");
        fireEvent.click(bothModeButton);
        inputForm = getByPlaceholderText(markdownContainer, "Enter text here...");
        viewContainer = markdownContainer.querySelector(".markdown-parsed-container");
        
        // Update markdown & wait for it to appear
        fireEvent.change(inputForm, { target: { value: "**Test text 2**" } });
        await waitFor(() => getByText(viewContainer, "Test text 2"));
    });
});


describe("Reset new object state", () => {
    test("Cancel reset, reset attributes and link", async () => {
        let { container, store } = renderWithWrappers(<Route exact path="/objects/:id"><AddObject /></Route>, {
            route: "/objects/add"
        });
    
        // Edit attributes & link
        let objectNameInput = getByPlaceholderText(container, "Object name");
        let objectDescriptionInput = getByPlaceholderText(container, "Object description");
    
        fireEvent.change(objectNameInput, { target: { value: "new name" } });
        await waitFor(() => expect(getCurrentObject(store.getState()).object_name).toBe("new name"));
        fireEvent.change(objectDescriptionInput, { target: { value: "new description" } });
        await waitFor(() => expect(getCurrentObject(store.getState()).object_description).toBe("new description"));
    
        clickDataTabButton(container);
        let linkInput = getByPlaceholderText(container, "Link");
        const linkValue = "https://test.link"
        fireEvent.change(linkInput, { target: { value: linkValue } });
        await waitFor(() => expect(getCurrentObject(store.getState()).link).toBe(linkValue));
    
        // Cancel reset
        let resetButton = getByText(container, "Reset");
        fireEvent.click(resetButton);
        const confimationDialogButtonNo = getByText(container, "No");
        fireEvent.click(confimationDialogButtonNo);
    
        linkInput = getByPlaceholderText(container, "Link");
        expect(linkInput.value).toEqual(linkValue);
    
        // Reset attributes & link
        resetObject(container);
    
        objectNameInput = getByPlaceholderText(container, "Object name");
        expect(objectNameInput.value).toEqual("");
        objectDescriptionInput = getByPlaceholderText(container, "Object description");
        expect(objectDescriptionInput.value).toEqual("");
        expect(getCurrentObject(store.getState()).link).toEqual("");
    });


    test("Reset markdown", async () => {
        let { container, store } = renderWithWrappers(<Route exact path="/objects/:id"><AddObject /></Route>, {
            route: "/objects/add"
        });

        const { markdownButton } = getObjectTypeSelectingElements(container);
        fireEvent.click(markdownButton);
        clickDataTabButton(container);
        const editModeButton = getByTitle(container, "Display edit window")
        fireEvent.click(editModeButton);
        const inputForm = getByPlaceholderText(container, "Enter text here...");
        const rawText = "**Test text**";
        fireEvent.change(inputForm, { target: { value: rawText } });
        await waitFor(() => expect(getCurrentObject(store.getState()).markdown.raw_text).toEqual(rawText));

        resetObject(container);

        expect(getCurrentObject(store.getState()).object_type).toEqual("link");
        expect(getCurrentObject(store.getState()).markdown.raw_text).toEqual("");
    });


    test("Reset to-do list", async () => {
        let { container, store } = renderWithWrappersAndDnDProvider(<Route exact path="/objects/:id"><AddObject /></Route>, {
            route: "/objects/add"
        });

        const { TDLButton } = getObjectTypeSelectingElements(container);
        fireEvent.click(TDLButton);
        clickDataTabButton(container);
        let newItemInput = getByPlaceholderText(container.querySelector(".to-do-list-item-container"), "New item");
        fireEvent.input(newItemInput, { target: { innerHTML: "new value" } });
        await waitFor(() => expect(getCurrentObject(store.getState()).toDoList.items[0].item_text).toBe("new value"));

        resetObject(container);

        expect(getCurrentObject(store.getState()).object_type).toEqual("link");
        expect(Object.keys(getCurrentObject(store.getState()).toDoList.items).length).toEqual(0);
    });
});


describe("Persist new object state", () => {
    test("Attributes and link data", async () => {
        let store = createStore({ enableDebugLogging: false });
        const render = route => renderWithWrappers(<Route exact path="/objects/:id" render={ props => props.match.params.id === "add" ? <AddObject /> : <EditObject /> } />, {
            route, store
        });

        // Render /objects/add and update object name + link
        var { container } = render("/objects/add");
        let objectNameInput = getByPlaceholderText(container, "Object name");
        const objectNameValue = "new object";
        fireEvent.change(objectNameInput, { target: { value: objectNameValue } });
        await waitFor(() => expect(getCurrentObject(store.getState()).object_name).toBe(objectNameValue));
        
        clickDataTabButton(container);
        let linkInput = getByPlaceholderText(container, "Link");
        const linkValue = "https://test.link"
        fireEvent.change(linkInput, { target: { value: linkValue } });
        await waitFor(() => expect(getCurrentObject(store.getState()).link).toBe(linkValue));

        // Render /objects/1, then render /objects/add and check if the state was saved
        var { container } = render("/objects/1");
        await waitFor(() => getByText(container, "Object Information"));
        var { container } = render("/objects/add");
        objectNameInput = getByPlaceholderText(container, "Object name");
        expect(objectNameInput.value).toEqual(objectNameValue);

        clickDataTabButton(container);
        linkInput = getByPlaceholderText(container, "Link");
        expect(linkInput.value).toEqual(linkValue);
    });


    test("Markdown data", async () => {
        let store = createStore({ enableDebugLogging: false });
        const render = route => renderWithWrappers(<Route exact path="/objects/:id" render={ props => props.match.params.id === "add" ? <AddObject /> : <EditObject /> } />, {
            route, store
        });

        // Render /objects/add and update markdown text
        var { container } = render("/objects/add");
        const { markdownButton } = getObjectTypeSelectingElements(container);
        fireEvent.click(markdownButton);
        clickDataTabButton(container);
        const editModeButton = getByTitle(container, "Display edit window")
        fireEvent.click(editModeButton);
        let inputForm = getByPlaceholderText(container, "Enter text here...");
        const rawText = "**Test text**";
        fireEvent.change(inputForm, { target: { value: rawText } });
        await waitFor(() => expect(getCurrentObject(store.getState()).markdown.raw_text).toEqual(rawText));

        // Render /objects/1, then render /objects/add and check if the state was saved
        var { container } = render("/objects/1");
        await waitFor(() => getByText(container, "Object Information"));
        var { container } = render("/objects/add");

        clickDataTabButton(container);
        inputForm = getByPlaceholderText(container, "Enter text here...");
        expect(inputForm.value).toEqual(rawText);
    });


    test("To-do list data", async () => {
        let store = createStore({ enableDebugLogging: false });
        const render = route => renderWithWrappersAndDnDProvider(<Route exact path="/objects/:id" render={ props => props.match.params.id === "add" ? <AddObject /> : <EditObject /> } />, {
            route, store
        });

        // Render /objects/add and update markdown text
        var { container } = render("/objects/add");
        const { TDLButton } = getObjectTypeSelectingElements(container);
        fireEvent.click(TDLButton);
        clickDataTabButton(container);
        const newItemText = "new value";
        let newItemInput = getByPlaceholderText(container.querySelector(".to-do-list-item-container"), "New item");
        fireEvent.input(newItemInput, { target: { innerHTML: "new value" } });
        await waitFor(() => expect(getCurrentObject(store.getState()).toDoList.items[0].item_text).toBe(newItemText));

        // Render /objects/1, then render /objects/add and check if the state was saved
        var { container } = render("/objects/1");
        await waitFor(() => getByText(container, "Object Information"));
        var { container } = render("/objects/add");

        clickDataTabButton(container);
        getByText(container.querySelector(".to-do-list-container"), newItemText);
    });
});


describe("Save new object errors", () => {
    test("Handle save fetch error", async () => {
        let { container, history, store } = renderWithWrappers(<Route exact path="/objects/:id"><AddObject /></Route>, {
            route: "/objects/add"
        });
    
        // Check if an error message is displayed and object is not added to the state
        let objectNameInput = getByPlaceholderText(container, "Object name");
        let saveButton = getByText(container, "Save");
        fireEvent.change(objectNameInput, { target: { value: "error" } });
        await waitFor(() => expect(getCurrentObject(store.getState()).object_name).toBe("error"));  // wait for object_name to be updated in state
    
        clickDataTabButton(container);
        let linkInput = getByPlaceholderText(container, "Link");
        const linkValue = "https://google.com"
        fireEvent.change(linkInput, { target: { value: linkValue } });
        await waitFor(() => expect(getCurrentObject(store.getState()).link).toBe(linkValue));
        setFetchFail(true);
        fireEvent.click(saveButton);
        await waitFor(() => getByText(container, "Failed to fetch data."));
        expect(history.entries[history.length - 1].pathname).toBe("/objects/add");
        expect(store.getState().objects[1000]).toBeUndefined(); // mock object returned has this id
        setFetchFail();   // reset fetch fail
    });


    test("Link with incorrect data", async () => {
        let { container, store } = renderWithWrappers(<Route exact path="/objects/:id"><AddObject /></Route>, {
            route: "/objects/add"
        });
    
        // Get object name input, link object type button & save button
        const objectNameInput = getByPlaceholderText(container, "Object name");
        const linkButton = getByText(container.querySelector(".object-type-menu"), "Link");
        const saveButton = getByText(container, "Save");
    
        // Set a valid object name
        fireEvent.change(objectNameInput, { target: { value: "New object" } });
    
        // Save an empty link
        fireEvent.click(linkButton);
        fireEvent.click(saveButton);
        await waitFor(() => getByText(container, "Link value is required.", { exact: false }));
        expect(store.getState().objects[1]).toBeUndefined();
        expect(store.getState().links[1]).toBeUndefined();
    });


    test("Markdown with incorrect data", async () => {
        let { container, store } = renderWithWrappers(<Route exact path="/objects/:id"><AddObject /></Route>, {
            route: "/objects/add"
        });
    
        // Get object name input, link object type button & save button
        const objectNameInput = getByPlaceholderText(container, "Object name");
        const { markdownButton } = getObjectTypeSelectingElements(container);
        const saveButton = getByText(container, "Save");
    
        // Set a valid object name
        fireEvent.change(objectNameInput, { target: { value: "New object" } });
    
        // Save an empty markdown object
        fireEvent.click(markdownButton);
        fireEvent.click(saveButton);
        await waitFor(() => getByText(container, "Markdown text is required.", { exact: false }));
        expect(store.getState().objects[1]).toBeUndefined();
        expect(store.getState().markdown[1]).toBeUndefined();
    });


    test("To-do list with incorrect data", async () => {
        let { container, store } = renderWithWrappersAndDnDProvider(<Route exact path="/objects/:id"><AddObject /></Route>, {
            route: "/objects/add"
        });
    
        // Get object name input, link object type button & save button
        const objectNameInput = getByPlaceholderText(container, "Object name");
        const TDLButton = getByText(container.querySelector(".object-type-menu"), "To-Do List");
        const saveButton = getByText(container, "Save");
    
        // Set a valid object name
        fireEvent.change(objectNameInput, { target: { value: "New object" } });
    
        // Save an empty to-do list object
        fireEvent.click(TDLButton);
        fireEvent.click(saveButton);
        await waitFor(() => getByText(container, "At least one item is required in the to-do list.", { exact: false }));
        expect(store.getState().objects[1]).toBeUndefined();
        expect(store.getState().toDoLists[1]).toBeUndefined();
    });
});


describe("Save new object", () => {
    test("Save link + check new object state reset", async () => {
        let { container, history, store } = renderWithWrappers(
            <Route exact path="/objects/:id" render={ props => props.match.params.id === "add" ? <AddObject /> : <EditObject /> } />, 
            { route: "/objects/add" }
        );
    
        let objectNameInput = getByPlaceholderText(container, "Object name");
        let objectDescriptionInput = getByPlaceholderText(container, "Object description");
        let saveButton = getByText(container, "Save");
    
        // Check if object is redirected after adding a correct object
        fireEvent.change(objectNameInput, { target: { value: "new object" } });
        await waitFor(() => expect(getCurrentObject(store.getState()).object_name).toBe("new object"));
        fireEvent.change(objectDescriptionInput, { target: { value: "new object description" } });
        await waitFor(() => expect(getCurrentObject(store.getState()).object_description).toBe("new object description"));
    
        clickDataTabButton(container);
        let linkInput = getByPlaceholderText(container, "Link");
        const linkValue = "https://google.com"
        fireEvent.change(linkInput, { target: { value: linkValue } });
        await waitFor(() => expect(getCurrentObject(store.getState()).link).toBe(linkValue));    
        fireEvent.click(saveButton);
        const object_id = 1000; // mock object returned has this id
        await waitFor(() => expect(history.entries[history.length - 1].pathname).toBe(`/objects/${object_id}`));
        expect(getByPlaceholderText(container, "Link").value).toEqual(linkValue);
            
        clickGeneralTabButton(container);
        expect(getByPlaceholderText(container, "Object name").value).toEqual("new object");
        expect(getByPlaceholderText(container, "Object description").value).toEqual("new object description");
        getByText(container, "Created at:");
        getByText(container, "Modified at:");
    
        expect(store.getState().links[object_id].link).toEqual(linkValue);
    
        // Check if new object state was reset
        expect(Object.keys(store.getState().editedObjects).includes("0")).toBeFalsy();  // numeric keys are converted to strings
    });


    test("Save markdown", async () => {
        let { container, history, store } = renderWithWrappers(
            <Route exact path="/objects/:id" render={ props => props.match.params.id === "add" ? <AddObject /> : <EditObject /> } />, 
            { route: "/objects/add" }
        );
    
        // Change object type
        const { markdownButton } = getObjectTypeSelectingElements(container);
        fireEvent.click(markdownButton);
    
        let objectNameInput = getByPlaceholderText(container, "Object name");
        let objectDescriptionInput = getByPlaceholderText(container, "Object description");
        let saveButton = getByText(container, "Save");
        
        // Enter attributes
        fireEvent.change(objectNameInput, { target: { value: "new object" } });
        await waitFor(() => expect(getCurrentObject(store.getState()).object_name).toBe("new object"));
        fireEvent.change(objectDescriptionInput, { target: { value: "new object description" } });
        await waitFor(() => expect(getCurrentObject(store.getState()).object_description).toBe("new object description"));
    
        // Change display mode and enter MD text
        clickDataTabButton(container);
        let editModeButton = getByTitle(container, "Display edit window")
        fireEvent.click(editModeButton);
        let inputForm = getByPlaceholderText(container, "Enter text here...");
        const rawText = "**Test text**";
        fireEvent.change(inputForm, { target: { value: rawText } });
        await waitFor(() => expect(getCurrentObject(store.getState()).markdown.raw_text).toEqual(rawText));
    
        // Check if object is redirected after adding a correct object
        fireEvent.click(saveButton);
        const object_id = 1000; // mock object returned has this id
        await waitFor(() => expect(history.entries[history.length - 1].pathname).toBe(`/objects/${object_id}`));
        expect(getByPlaceholderText(container, "Enter text here...").value).toEqual(rawText);
        
        clickGeneralTabButton(container);
        expect(getByPlaceholderText(container, "Object name").value).toEqual("new object");
        expect(getByPlaceholderText(container, "Object description").value).toEqual("new object description");
        getByText(container, "Created at:");
        getByText(container, "Modified at:");
    
        expect(store.getState().markdown[object_id].raw_text).toEqual(rawText);
    });


    test("Save To-do list", async () => {
        let { container, history, store } = renderWithWrappersAndDnDProvider(
            <Route exact path="/objects/:id" render={ props => props.match.params.id === "add" ? <AddObject /> : <EditObject /> } />, 
            { route: "/objects/add" }
        );
    
        // Change object type
        const { TDLButton } = getObjectTypeSelectingElements(container);
        fireEvent.click(TDLButton);
    
        let objectNameInput = getByPlaceholderText(container, "Object name");
        let objectDescriptionInput = getByPlaceholderText(container, "Object description");
        let saveButton = getByText(container, "Save");
    
        // Enter attributes
        fireEvent.change(objectNameInput, { target: { value: "new object" } });
        await waitFor(() => expect(getCurrentObject(store.getState()).object_name).toBe("new object"));
        fireEvent.change(objectDescriptionInput, { target: { value: "new object description" } });
        await waitFor(() => expect(getCurrentObject(store.getState()).object_description).toBe("new object description"));
    
        // Add a to-do list item
        clickDataTabButton(container);
        let newItemInput = getByPlaceholderText(container.querySelector(".to-do-list-item-container"), "New item");
        fireEvent.input(newItemInput, { target: { innerHTML: "new value" } });
        await waitFor(() => expect(getCurrentObject(store.getState()).toDoList.items[0].item_text).toBe("new value"));
    
        // Check if object is redirected after adding a correct object
        fireEvent.click(saveButton);
        const object_id = 1000; // mock object returned has this id
        await waitFor(() => expect(history.entries[history.length - 1].pathname).toBe(`/objects/${object_id}`));
        
        let TDLContainer = container.querySelector(".to-do-list-container");
        getByText(TDLContainer, "new value");
    
        clickGeneralTabButton(container);
        expect(getByPlaceholderText(container, "Object name").value).toEqual("new object");
        expect(getByPlaceholderText(container, "Object description").value).toEqual("new object description");
        getByText(container, "Created at:");
        getByText(container, "Modified at:");
        expect(store.getState().toDoLists[object_id].items[0].item_text).toEqual("new value");
    });
});


















