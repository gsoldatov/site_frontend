import React from "react";
import { Route } from "react-router-dom";

import { fireEvent } from "@testing-library/react";
import { getByText, getByPlaceholderText, waitFor, getByTitle } from "@testing-library/dom";

import { renderWithWrappers } from "./test-utils/render";
import { getSideMenuItem, getSideMenuDialogControls } from "./test-utils/ui-common";
import { getCurrentObject, waitForEditObjectPageLoad, getObjectTypeSwitchElements, clickGeneralTabButton, clickDataTabButton, resetObject } from "./test-utils/ui-object";
import { addANewSubobject, addAnExistingSubobject, clickSubobjectCardDataTabButton, getSubobjectCardAttributeElements, getSubobjectCardMenuButtons, getSubobjectCards, getSubobjectExpandToggleButton } from "./test-utils/ui-composite";

import { AddObject, EditObject } from "../src/components/object";
import { getMappedSubobjectID } from "./mocks/data-composite";


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
        let saveButton = getSideMenuItem(container, "Save");
        let cancelButton = getSideMenuItem(container, "Cancel");
        expect(saveButton.classList.contains("disabled")).toBeTruthy(); // Semantic UI always adds onClick event to div elements, even if they are disabled (which does nothing in this case)
        // expect(saveButton.onclick).toBeNull(); 
    
        // Check if cancel button redirects to /objects page
        fireEvent.click(cancelButton);
        expect(history.entries[history.length - 1].pathname).toBe("/objects");
    });


    test("Select different object types", async () => {
        let { store, container } = renderWithWrappers(<Route exact path="/objects/:id"><AddObject /></Route>, {
            route: "/objects/add"
        });

        // Select markdown object type and check if markdown inputs are rendered
        let { switchContainer, markdownOption } = getObjectTypeSwitchElements(container);
        fireEvent.click(switchContainer);
        fireEvent.click(markdownOption);
        clickDataTabButton(container);
        const markdownContainer = document.querySelector(".markdown-container");
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
        getByText(container, "To-Do List", { exact: false });

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


    test("Change markdown display modes & render markdown", async () => {
        let { container, store } = renderWithWrappers(<Route exact path="/objects/:id"><AddObject /></Route>, {
            route: "/objects/add"
        });
        // Change object type
        let { switchContainer, markdownOption } = getObjectTypeSwitchElements(container);
        fireEvent.click(switchContainer);
        fireEvent.click(markdownOption);
    
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
        let resetButton = getSideMenuItem(container, "Reset");
        fireEvent.click(resetButton);
        fireEvent.click(getSideMenuDialogControls(container).buttons["No"]);
    
        linkInput = getByPlaceholderText(container, "Link");
        expect(linkInput.value).toEqual(linkValue);
    
        // Reset attributes & link
        resetObject(container);
        clickGeneralTabButton(container);
    
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

        const { switchContainer, markdownOption } = getObjectTypeSwitchElements(container);
        fireEvent.click(switchContainer);
        fireEvent.click(markdownOption);
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
        let { container, store } = renderWithWrappers(<Route exact path="/objects/:id"><AddObject /></Route>, {
            route: "/objects/add"
        });

        const { switchContainer, toDoListOption } = getObjectTypeSwitchElements(container);
        fireEvent.click(switchContainer);
        fireEvent.click(toDoListOption);
        clickDataTabButton(container);
        let newItemInput = getByPlaceholderText(container.querySelector(".to-do-list-item-container"), "New item");
        fireEvent.input(newItemInput, { target: { innerHTML: "new value" } });
        await waitFor(() => expect(getCurrentObject(store.getState()).toDoList.items[0].item_text).toBe("new value"));

        resetObject(container);

        expect(getCurrentObject(store.getState()).object_type).toEqual("link");
        expect(Object.keys(getCurrentObject(store.getState()).toDoList.items).length).toEqual(0);
    });


    test("Reset composite (without subobjects)", async () => {
        let { container, store } = renderWithWrappers(<Route exact path="/objects/:id"><AddObject /></Route>, {
            route: "/objects/add"
        });

        const { switchContainer, compositeOption } = getObjectTypeSwitchElements(container);
        fireEvent.click(switchContainer);
        fireEvent.click(compositeOption);
        clickDataTabButton(container);

        // Add 2 new and one existing subobjects
        addANewSubobject(container);
        addANewSubobject(container);
        await addAnExistingSubobject(container, 0, "some name", store, { waitForObjectLoad: true });
        let cards = getSubobjectCards(container, { expectedNumbersOfCards: [3] });
        const [firstSubobjectID, secondSubobjectID, thirdSubobjectID] = cards[0].map(card => card.id);

        // Update existing subobject
        const updatedSubobjectName = "updated name";
        fireEvent.change(getSubobjectCardAttributeElements(cards[0][2]).subobjectNameInput, { target: { value: updatedSubobjectName } });
        await waitFor(() => expect(store.getState().editedObjects[thirdSubobjectID].object_name).toEqual(updatedSubobjectName));

        // Reset without resetting subobjects
        resetObject(container);

        // Check if new subobjects are removed, but existing subobject is not reset/deleted
        expect(Object.keys(store.getState().editedObjects[0].composite.subobjects).length).toEqual(0);
        expect(store.getState().editedObjects).not.toHaveProperty(firstSubobjectID);
        expect(store.getState().editedObjects).not.toHaveProperty(secondSubobjectID);
        
        expect(store.getState().editedObjects).toHaveProperty(thirdSubobjectID);
        expect(store.getState().editedObjects[thirdSubobjectID].object_name).toEqual(updatedSubobjectName);
    });


    test("Reset composite (with subobjects)", async () => {
        let { container, store } = renderWithWrappers(<Route exact path="/objects/:id"><AddObject /></Route>, {
            route: "/objects/add"
        });

        const { switchContainer, compositeOption } = getObjectTypeSwitchElements(container);
        fireEvent.click(switchContainer);
        fireEvent.click(compositeOption);
        clickDataTabButton(container);

        // Add 2 new and one existing subobjects
        addANewSubobject(container);
        addANewSubobject(container);
        const existingSubobjectName = "some name";
        await addAnExistingSubobject(container, 0, existingSubobjectName, store, { waitForObjectLoad: true });
        let cards = getSubobjectCards(container, { expectedNumbersOfCards: [3] });
        const [firstSubobjectID, secondSubobjectID, thirdSubobjectID] = cards[0].map(card => card.id);

        // Update existing subobject
        const updatedSubobjectName = "updated name";
        fireEvent.change(getSubobjectCardAttributeElements(cards[0][2]).subobjectNameInput, { target: { value: updatedSubobjectName } });
        await waitFor(() => expect(store.getState().editedObjects[thirdSubobjectID].object_name).toEqual(updatedSubobjectName));

        // Reset without resetting subobjects
        resetObject(container, true);

        // Check if all added subobjects are removed from editedObjects
        expect(Object.keys(store.getState().editedObjects[0].composite.subobjects).length).toEqual(0);
        expect(store.getState().editedObjects).not.toHaveProperty(firstSubobjectID);
        expect(store.getState().editedObjects).not.toHaveProperty(secondSubobjectID);
        expect(store.getState().editedObjects).not.toHaveProperty(thirdSubobjectID);
    });
});


describe("Persist new object state", () => {
    test("Attributes and link data", async () => {
        // Render /objects/add and update object name + link
        let { container, store, history } = renderWithWrappers(<Route exact path="/objects/:id" render={ props => props.match.params.id === "add" ? <AddObject /> : <EditObject /> } />, {
            route: "/objects/add", store
        });

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
        history.push("/objects/1");
        await waitForEditObjectPageLoad(container, store);

        history.push("/objects/add");
        await waitFor(() => expect(store.getState().objectUI.currentObjectID).toEqual(0));
        clickGeneralTabButton(container);
        objectNameInput = getByPlaceholderText(container, "Object name");
        await waitFor(() => expect(objectNameInput.value).toEqual(objectNameValue));

        clickDataTabButton(container);
        linkInput = getByPlaceholderText(container, "Link");
        expect(linkInput.value).toEqual(linkValue);
    });


    test("Markdown data", async () => {
        // Render /objects/add and update markdown text
        let { container, store, history } = renderWithWrappers(<Route exact path="/objects/:id" render={ props => props.match.params.id === "add" ? <AddObject /> : <EditObject /> } />, {
            route: "/objects/add", store
        });

        const { switchContainer, markdownOption } = getObjectTypeSwitchElements(container);
        fireEvent.click(switchContainer);
        fireEvent.click(markdownOption);
        clickDataTabButton(container);
        const editModeButton = getByTitle(container, "Display edit window")
        fireEvent.click(editModeButton);
        let inputForm = getByPlaceholderText(container, "Enter text here...");
        const rawText = "**Test text**";
        fireEvent.change(inputForm, { target: { value: rawText } });
        await waitFor(() => expect(getCurrentObject(store.getState()).markdown.raw_text).toEqual(rawText));

        // Render /objects/1, then render /objects/add and check if the state was saved
        history.push("/objects/1");
        await waitForEditObjectPageLoad(container, store);

        history.push("/objects/add");
        await waitFor(() => expect(store.getState().objectUI.currentObjectID).toEqual(0));
        clickDataTabButton(container);
        await waitFor(() => expect(getByPlaceholderText(container, "Enter text here...").value).toEqual(rawText));
    });


    test("To-do list data", async () => {
        // Render /objects/add and update to-do list items
        let { container, store, history } = renderWithWrappers(<Route exact path="/objects/:id" render={ props => props.match.params.id === "add" ? <AddObject /> : <EditObject /> } />, {
            route: "/objects/add", store
        });

        const { switchContainer, toDoListOption } = getObjectTypeSwitchElements(container);
        fireEvent.click(switchContainer);
        fireEvent.click(toDoListOption);
        clickDataTabButton(container);
        const newItemText = "new value";
        let newItemInput = getByPlaceholderText(container.querySelector(".to-do-list-item-container"), "New item");
        fireEvent.input(newItemInput, { target: { innerHTML: "new value" } });
        await waitFor(() => expect(getCurrentObject(store.getState()).toDoList.items[0].item_text).toBe(newItemText));

        // Render /objects/1, then render /objects/add and check if the state was saved
        history.push("/objects/1");
        await waitForEditObjectPageLoad(container, store);

        history.push("/objects/add");
        await waitFor(() => expect(store.getState().objectUI.currentObjectID).toEqual(0));

        clickDataTabButton(container);
        getByText(container.querySelector(".to-do-list-container"), newItemText);
    });


    test("Composite data and subobjects", async () => {
        // Render /objects/add and add a new & an existing subobject
        let { container, store, history } = renderWithWrappers(<Route exact path="/objects/:id" render={ props => props.match.params.id === "add" ? <AddObject /> : <EditObject /> } />, {
            route: "/objects/add", store
        });

        const { switchContainer, compositeOption } = getObjectTypeSwitchElements(container);
        fireEvent.click(switchContainer);
        fireEvent.click(compositeOption);
        clickDataTabButton(container);

        addANewSubobject(container);
        await addAnExistingSubobject(container, 0, "some name", store, { waitForObjectLoad: true });
        let cards = getSubobjectCards(container, { expectedNumbersOfCards: [2] });
        const firstSubobjectID = cards[0][0].id, secondSubobjectID = cards[0][1].id;

        // Modify new subobject name
        const newSubobjectName = "updated name";
        fireEvent.change(getSubobjectCardAttributeElements(cards[0][0]).subobjectNameInput, { target: { value: newSubobjectName } });
        await waitFor(() => expect(store.getState().editedObjects[firstSubobjectID].object_name).toEqual(newSubobjectName));

        // Render /objects/1, then render /objects/add and check if the state was saved
        history.push("/objects/1");
        await waitForEditObjectPageLoad(container, store);

        history.push("/objects/add");
        await waitFor(() => expect(store.getState().objectUI.currentObjectID).toEqual(0));
        clickDataTabButton(container);

        expect(store.getState().editedObjects).toHaveProperty(firstSubobjectID);
        expect(store.getState().editedObjects).toHaveProperty(secondSubobjectID);
        cards = getSubobjectCards(container, { expectedNumbersOfCards: [2] });
        expect(getSubobjectCardAttributeElements(cards[0][0]).subobjectNameInput.value).toEqual(newSubobjectName);
        expect(getSubobjectCardAttributeElements(cards[0][1]).subobjectNameInput.value).toEqual(store.getState().editedObjects[secondSubobjectID].object_name);
    });


    test("Composite unchanged existing subobject removal", async () => {
        // Render /objects/add and add a new & an existing subobject
        let { container, store } = renderWithWrappers(<Route exact path="/objects/:id" render={ props => props.match.params.id === "add" ? <AddObject /> : <EditObject /> } />, {
            route: "/objects/add", store
        });

        const { switchContainer, compositeOption } = getObjectTypeSwitchElements(container);
        fireEvent.click(switchContainer);
        fireEvent.click(compositeOption);
        clickDataTabButton(container);

        // Add 2 existing subobjects
        await addAnExistingSubobject(container, 0, "first name", store, { waitForObjectLoad: true });
        await addAnExistingSubobject(container, 0, "second name", store, { waitForObjectLoad: true });
        const cards = getSubobjectCards(container, { expectedNumbersOfCards: [2] });
        const [firstSubobjectID, secondSubobjectID] = cards[0].map(card => card.id.toString());

        // Modify first subobject
        const newSubobjectName = "updated name";
        fireEvent.change(getSubobjectCardAttributeElements(cards[0][0]).subobjectNameInput, { target: { value: newSubobjectName } });
        await waitFor(() => expect(store.getState().editedObjects[firstSubobjectID].object_name).toEqual(newSubobjectName));

        // Click cancel button
        fireEvent.click(getSideMenuItem(container, "Cancel"));

        // Check if second subobject is removed from state.editedObjects and first isn't
        await waitFor(() => expect(store.getState().editedObjects).not.toHaveProperty(secondSubobjectID));
        expect(store.getState().editedObjects).toHaveProperty(firstSubobjectID); 
    });
});


describe("Save new object errors", () => {
    test("Handle save fetch error", async () => {
        let { container, history, store } = renderWithWrappers(<Route exact path="/objects/:id"><AddObject /></Route>, {
            route: "/objects/add"
        });
    
        // Check if an error message is displayed and object is not added to the state
        let objectNameInput = getByPlaceholderText(container, "Object name");
        let saveButton = getSideMenuItem(container, "Save");
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

        const objectNameInput = getByPlaceholderText(container, "Object name");
        const saveButton = getSideMenuItem(container, "Save");
    
        // Set a valid object name
        fireEvent.change(objectNameInput, { target: { value: "New object" } });
    
        // Save an empty link
        const { switchContainer, linkOption } = getObjectTypeSwitchElements(container);
        fireEvent.click(switchContainer);
        fireEvent.click(linkOption);
        fireEvent.click(saveButton);
        await waitFor(() => getByText(container, "Link value is required.", { exact: false }));
        expect(store.getState().objects[1]).toBeUndefined();
        expect(store.getState().links[1]).toBeUndefined();
    });


    test("Markdown with incorrect data", async () => {
        let { container, store } = renderWithWrappers(<Route exact path="/objects/:id"><AddObject /></Route>, {
            route: "/objects/add"
        });
    
        const objectNameInput = getByPlaceholderText(container, "Object name");
        const saveButton = getSideMenuItem(container, "Save");
    
        // Set a valid object name
        fireEvent.change(objectNameInput, { target: { value: "New object" } });
    
        // Save an empty markdown object
        const { switchContainer, markdownOption } = getObjectTypeSwitchElements(container);
        fireEvent.click(switchContainer);
        fireEvent.click(markdownOption);
        fireEvent.click(saveButton);
        await waitFor(() => getByText(container, "Markdown text is required.", { exact: false }));
        expect(store.getState().objects[1]).toBeUndefined();
        expect(store.getState().markdown[1]).toBeUndefined();
    });


    test("To-do list with incorrect data", async () => {
        let { container, store } = renderWithWrappers(<Route exact path="/objects/:id"><AddObject /></Route>, {
            route: "/objects/add"
        });

        const objectNameInput = getByPlaceholderText(container, "Object name");
        const saveButton = getSideMenuItem(container, "Save");
    
        // Set a valid object name
        fireEvent.change(objectNameInput, { target: { value: "New object" } });
    
        // Save an empty to-do list object
        const { switchContainer, toDoListOption } = getObjectTypeSwitchElements(container);
        fireEvent.click(switchContainer);
        fireEvent.click(toDoListOption);
        fireEvent.click(saveButton);
        await waitFor(() => getByText(container, "At least one item is required in the to-do list.", { exact: false }));
        expect(store.getState().objects[1]).toBeUndefined();
        expect(store.getState().toDoLists[1]).toBeUndefined();
    });


    test("Composite object without subobjects", async () => {
        let { container, store, history } = renderWithWrappers(<Route exact path="/objects/:id"><AddObject /></Route>, {
            route: "/objects/add"
        });

        // Modify object name and type, then click save button
        const { switchContainer, compositeOption } = getObjectTypeSwitchElements(container);
        fireEvent.click(switchContainer);
        fireEvent.click(compositeOption);
        fireEvent.change(getByPlaceholderText(container, "Object name"), { target: { value: "New object" } });
        await waitFor(() => expect(getCurrentObject(store.getState()).object_name).toBe("New object"));
        fireEvent.click(getSideMenuItem(container, "Save"));

        // Check if error message is displayed and save did not occur
        await waitFor(() => getByText(container, "Composite object must have at least one non-deleted subobject.", { exact: false }));
        expect(history.entries[history.length - 1].pathname).toEqual("/objects/add");
        expect(store.getState().objects[1]).toBeUndefined();
        expect(store.getState().composite[1]).toBeUndefined();
    });


    test("Composite object without non-deleted subobjects", async () => {
        let { container, store, history } = renderWithWrappers(<Route exact path="/objects/:id"><AddObject /></Route>, {
            route: "/objects/add"
        });

        // Modify object type and name
        const { switchContainer, compositeOption } = getObjectTypeSwitchElements(container);
        fireEvent.click(switchContainer);
        fireEvent.click(compositeOption);
        fireEvent.change(getByPlaceholderText(container, "Object name"), { target: { value: "New object" } });
        await waitFor(() => expect(getCurrentObject(store.getState()).object_name).toBe("New object"));

        // Add 2 subobjects, then delete them
        clickDataTabButton(container);
        addANewSubobject(container);
        await addAnExistingSubobject(container, 0, "some name", store, { waitForObjectLoad: true });
        let cards = getSubobjectCards(container, { expectedNumbersOfCards: [2] });
        fireEvent.click(getSubobjectCardMenuButtons(cards[0][0]).deleteButton);
        fireEvent.click(getSubobjectCardMenuButtons(cards[0][1]).fullDeleteButton);

        // Click save button and check if error message is displayed and save did not occur
        fireEvent.click(getSideMenuItem(container, "Save"));
        await waitFor(() => getByText(container, "Composite object must have at least one non-deleted subobject.", { exact: false }));
        expect(history.entries[history.length - 1].pathname).toEqual("/objects/add");
        expect(store.getState().objects[1]).toBeUndefined();
        expect(store.getState().composite[1]).toBeUndefined();
    });


    test("Composite object a with a new subobject with incorrect attributes", async () => {
        let { container, store, history } = renderWithWrappers(<Route exact path="/objects/:id"><AddObject /></Route>, {
            route: "/objects/add"
        });

        // Modify object type and name
        const { switchContainer, compositeOption } = getObjectTypeSwitchElements(container);
        fireEvent.click(switchContainer);
        fireEvent.click(compositeOption);
        fireEvent.change(getByPlaceholderText(container, "Object name"), { target: { value: "New object" } });
        await waitFor(() => expect(getCurrentObject(store.getState()).object_name).toBe("New object"));

        // Add a new subobject and edit its data
        clickDataTabButton(container);
        addANewSubobject(container);
        const card = getSubobjectCards(container, { expectedNumbersOfCards: [1] })[0][0];
        clickSubobjectCardDataTabButton(card);
        fireEvent.change(getByPlaceholderText(card, "Link"), { target: { value: "new link value" }});
        await waitFor(() => expect(store.getState().editedObjects[card.id].link).toBe("new link value"));

        // Click save button and check if error message is displayed and save did not occur
        fireEvent.click(getSideMenuItem(container, "Save"));
        await waitFor(() => getByText(container, "Object name is required.", { exact: false }));
        expect(history.entries[history.length - 1].pathname).toEqual("/objects/add");
        expect(store.getState().objects[1]).toBeUndefined();
        expect(store.getState().composite[1]).toBeUndefined();
        expect(store.getState().editedObjects).toHaveProperty(card.id);
    });


    test("Composite object a with an existing subobject with incorrect data", async () => {
        let { container, store, history } = renderWithWrappers(<Route exact path="/objects/:id"><AddObject /></Route>, {
            route: "/objects/add"
        });

        // Modify object type and name
        const { switchContainer, compositeOption } = getObjectTypeSwitchElements(container);
        fireEvent.click(switchContainer);
        fireEvent.click(compositeOption);
        fireEvent.change(getByPlaceholderText(container, "Object name"), { target: { value: "New object" } });
        await waitFor(() => expect(getCurrentObject(store.getState()).object_name).toBe("New object"));

        // Add an existing subobject and modify its data to be invalid
        clickDataTabButton(container);
        await addAnExistingSubobject(container, 0, "some name", store, { waitForObjectLoad: true });
        const card = getSubobjectCards(container, { expectedNumbersOfCards: [1] })[0][0];
        clickSubobjectCardDataTabButton(card);
        fireEvent.change(getByPlaceholderText(card, "Link"), { target: { value: "" }});
        await waitFor(() => expect(store.getState().editedObjects[card.id].link).toBe(""));

        // Click save button and check if error message is displayed and save did not occur
        fireEvent.click(getSideMenuItem(container, "Save"));
        await waitFor(() => getByText(container, "Link value is required.", { exact: false }));
        expect(history.entries[history.length - 1].pathname).toEqual("/objects/add");
        expect(store.getState().objects[1]).toBeUndefined();
        expect(store.getState().composite[1]).toBeUndefined();
        expect(store.getState().editedObjects).toHaveProperty(card.id);
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
        let saveButton = getSideMenuItem(container, "Save");
    
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
        const { switchContainer, markdownOption } = getObjectTypeSwitchElements(container);
        fireEvent.click(switchContainer);
        fireEvent.click(markdownOption);
    
        let objectNameInput = getByPlaceholderText(container, "Object name");
        let objectDescriptionInput = getByPlaceholderText(container, "Object description");
        let saveButton = getSideMenuItem(container, "Save");
        
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


    test("Save to-do list", async () => {
        let { container, history, store } = renderWithWrappers(
            <Route exact path="/objects/:id" render={ props => props.match.params.id === "add" ? <AddObject /> : <EditObject /> } />, 
            { route: "/objects/add" }
        );
    
        // Change object type
        const { switchContainer, toDoListOption } = getObjectTypeSwitchElements(container);
        fireEvent.click(switchContainer);
        fireEvent.click(toDoListOption);
    
        let objectNameInput = getByPlaceholderText(container, "Object name");
        let objectDescriptionInput = getByPlaceholderText(container, "Object description");
        let saveButton = getSideMenuItem(container, "Save");
    
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

    
    test("Save composite", async () => {
        let { container, history, store } = renderWithWrappers(
            <Route exact path="/objects/:id" render={ props => props.match.params.id === "add" ? <AddObject /> : <EditObject /> } />, 
            { route: "/objects/add" }
        );

        // Modify object type and name
        const { switchContainer, compositeOption } = getObjectTypeSwitchElements(container);
        fireEvent.click(switchContainer);
        fireEvent.click(compositeOption);
        fireEvent.change(getByPlaceholderText(container, "Object name"), { target: { value: "New object" } });
        await waitFor(() => expect(getCurrentObject(store.getState()).object_name).toBe("New object"));

        // Add 3 new & 4 existing subobjects
        clickDataTabButton(container);
        addANewSubobject(container);
        addANewSubobject(container);
        addANewSubobject(container);
        await addAnExistingSubobject(container, 0, "deleted existing", store, { waitForObjectLoad: true });
        await addAnExistingSubobject(container, 0, "fully deleted existing", store, { waitForObjectLoad: true });
        await addAnExistingSubobject(container, 0, "unmodified existing", store, { waitForObjectLoad: true });
        await addAnExistingSubobject(container, 0, "existing to be modified", store, { waitForObjectLoad: true });
        let cards = getSubobjectCards(container, { expectedNumbersOfCards: [7] });
        const [deletedNewID, firstNewID, secondNewID, deletedExistingID, fullyDeletedExistingID, unmodifiedExistingID, modifiedExistingID] = cards[0].map(card => card.id);

        // Delete 2 subobjects (new + existing), fully delete 1 existing subobject
        fireEvent.click(getSubobjectCardMenuButtons(cards[0][0]).deleteButton);
        fireEvent.click(getSubobjectCardMenuButtons(cards[0][3]).deleteButton);
        fireEvent.click(getSubobjectCardMenuButtons(cards[0][4]).fullDeleteButton);

        // Modify new subobjects
        const firstNewName = "first new subobject", firstLink = "http://first.link";
        fireEvent.change(getSubobjectCardAttributeElements(cards[0][1]).subobjectNameInput, { target: { value: firstNewName } });
        await waitFor(() => expect(store.getState().editedObjects[firstNewID].object_name).toEqual(firstNewName));
        clickSubobjectCardDataTabButton(cards[0][1]);
        fireEvent.change(getByPlaceholderText(cards[0][1], "Link"), { target: { value: firstLink }});
        await waitFor(() => expect(store.getState().editedObjects[firstNewID].link).toEqual(firstLink));

        const secondNewName = "second new subobject", secondLink = "http://second.link";
        fireEvent.change(getSubobjectCardAttributeElements(cards[0][2]).subobjectNameInput, { target: { value: secondNewName } });
        await waitFor(() => expect(store.getState().editedObjects[secondNewID].object_name).toEqual(secondNewName));
        clickSubobjectCardDataTabButton(cards[0][2]);
        fireEvent.change(getByPlaceholderText(cards[0][2], "Link"), { target: { value: secondLink }});
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
        await waitFor(() => expect(store.getState().editedObjects[0].composite.subobjects[modifiedExistingID].is_expanded).toBeFalsy());

        // Check if object is redirected after adding a correct object
        fireEvent.click(getSideMenuItem(container, "Save"));
        const object_id = 1000; // mock object returned has this id
        await waitFor(() => expect(history.entries[history.length - 1].pathname).toBe(`/objects/${object_id}`));
        
        // Check added object (is added to state.editedObjects & state.composite and has 4 subobjects in both states)
        const strObjectID = object_id.toString();
        await waitFor(() => expect(store.getState().editedObjects).toHaveProperty(strObjectID));
        const state = store.getState();
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
