import React from "react";

import { fireEvent } from "@testing-library/react";
import { getByText, getByPlaceholderText, waitFor, getByTitle } from "@testing-library/dom";

import { resetTestConfig } from "../../../../_mocks/config";
import { renderWithWrappers } from "../../../../_util/render";
import { getSideMenuItem, getSideMenuDialogControls } from "../../../../_util/ui-common";
import { getCurrentObject, waitForEditObjectPageLoad, getObjectTypeSwitchElements, clickGeneralTabButton, 
    clickDataTabButton, resetObject } from "../../../../_util/ui-objects-edit";
import { addANewSubobject, addAnExistingSubobject, getSubobjectCardAttributeElements, getSubobjectCards } from "../../../../_util/ui-composite";

import { App } from "../../../../../src/components/app";


/*
    /objects/edit/new page tests for data reset and persistence.
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


describe("Reset new object state", () => {
    test("Cancel reset, reset attributes and link", async () => {
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/edit/new"
        });

        // Wait for the page to load
        await waitFor(() => getByText(container, "Add a New Object"));
    
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
        await waitFor(() => expect(getCurrentObject(store.getState()).link.link).toBe(linkValue));
    
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
        expect(getCurrentObject(store.getState()).link.link).toEqual("");
    });


    test("Reset markdown", async () => {
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/edit/new"
        });

        // Wait for the page to load
        await waitFor(() => getByText(container, "Add a New Object"));

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
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/edit/new"
        });

        // Wait for the page to load
        await waitFor(() => getByText(container, "Add a New Object"));

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
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/edit/new"
        });

        // Wait for the page to load
        await waitFor(() => getByText(container, "Add a New Object"));

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
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/edit/new"
        });

        // Wait for the page to load
        await waitFor(() => getByText(container, "Add a New Object"));

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
        // Render /objects/edit/new and update object name + link
        let { container, store, historyManager } = renderWithWrappers(<App />, {
            route: "/objects/edit/new"
        });

        // Wait for the page to load
        await waitFor(() => getByText(container, "Add a New Object"));

        let objectNameInput = getByPlaceholderText(container, "Object name");
        const objectNameValue = "new object";
        fireEvent.change(objectNameInput, { target: { value: objectNameValue } });
        await waitFor(() => expect(getCurrentObject(store.getState()).object_name).toBe(objectNameValue));
        
        clickDataTabButton(container);
        let linkInput = getByPlaceholderText(container, "Link");
        const linkValue = "https://test.link"
        fireEvent.change(linkInput, { target: { value: linkValue } });
        await waitFor(() => expect(getCurrentObject(store.getState()).link.link).toBe(linkValue));

        // Render /objects/edit/1, then render /objects/edit/new and check if the state was saved
        historyManager.push("/objects/edit/1");
        await waitForEditObjectPageLoad(container, store);

        historyManager.push("/objects/edit/new");
        await waitFor(() => expect(store.getState().objectUI.currentObjectID).toEqual(0));
        clickGeneralTabButton(container);
        objectNameInput = getByPlaceholderText(container, "Object name");
        await waitFor(() => expect(objectNameInput.value).toEqual(objectNameValue));

        clickDataTabButton(container);
        linkInput = getByPlaceholderText(container, "Link");
        expect(linkInput.value).toEqual(linkValue);
    });


    test("Markdown data", async () => {
        // Render /objects/edit/new and update markdown text
        let { container, store, historyManager } = renderWithWrappers(<App />, {
            route: "/objects/edit/new"
        });

        // Wait for the page to load
        await waitFor(() => getByText(container, "Add a New Object"));

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

        // Render /objects/edit/1, then render /objects/edit/new and check if the state was saved
        historyManager.push("/objects/edit/1");
        await waitForEditObjectPageLoad(container, store);

        historyManager.push("/objects/edit/new");
        await waitFor(() => expect(store.getState().objectUI.currentObjectID).toEqual(0));
        clickDataTabButton(container);
        await waitFor(() => expect(getByPlaceholderText(container, "Enter text here...").value).toEqual(rawText));
    });


    test("To-do list data", async () => {
        // Render /objects/edit/new and update to-do list items
        let { container, store, historyManager } = renderWithWrappers(<App />, {
            route: "/objects/edit/new"
        });

        // Wait for the page to load
        await waitFor(() => getByText(container, "Add a New Object"));

        const { switchContainer, toDoListOption } = getObjectTypeSwitchElements(container);
        fireEvent.click(switchContainer);
        fireEvent.click(toDoListOption);
        clickDataTabButton(container);
        const newItemText = "new value";
        let newItemInput = getByPlaceholderText(container.querySelector(".to-do-list-item-container"), "New item");
        fireEvent.input(newItemInput, { target: { innerHTML: "new value" } });
        await waitFor(() => expect(getCurrentObject(store.getState()).toDoList.items[0].item_text).toBe(newItemText));

        // Render /objects/edit/1, then render /objects/edit/new and check if the state was saved
        historyManager.push("/objects/edit/1");
        await waitForEditObjectPageLoad(container, store);

        historyManager.push("/objects/edit/new");
        await waitFor(() => expect(store.getState().objectUI.currentObjectID).toEqual(0));

        clickDataTabButton(container);
        getByText(container.querySelector(".to-do-list-container"), newItemText);
    });


    test("Composite data and subobjects", async () => {
        // Render /objects/edit/new and add a new & an existing subobject
        let { container, store, historyManager } = renderWithWrappers(<App />, {
            route: "/objects/edit/new"
        });

        // Wait for the page to load
        await waitFor(() => getByText(container, "Add a New Object"));

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

        // Render /objects/edit/1, then render /objects/edit/new and check if the state was saved
        historyManager.push("/objects/edit/1");
        await waitForEditObjectPageLoad(container, store);

        historyManager.push("/objects/edit/new");
        await waitFor(() => expect(store.getState().objectUI.currentObjectID).toEqual(0));
        clickDataTabButton(container);

        expect(store.getState().editedObjects).toHaveProperty(firstSubobjectID);
        expect(store.getState().editedObjects).toHaveProperty(secondSubobjectID);
        cards = getSubobjectCards(container, { expectedNumbersOfCards: [2] });
        expect(getSubobjectCardAttributeElements(cards[0][0]).subobjectNameInput.value).toEqual(newSubobjectName);
        expect(getSubobjectCardAttributeElements(cards[0][1]).subobjectNameInput.value).toEqual(store.getState().editedObjects[secondSubobjectID].object_name);
    });


    test("Composite unchanged existing subobject removal", async () => {
        // Render /objects/edit/new and add a new & an existing subobject
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/edit/new"
        });

        // Wait for the page to load
        await waitFor(() => getByText(container, "Add a New Object"));

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


    test("Unchanged new object removal from edited objects storage", async () => {
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/edit/new"
        });

        // Wait for the page to load
        await waitFor(() => getByText(container, "Add a New Object"));

        expect(Object.keys(store.getState().editedObjects).includes("0")).toBeTruthy();

        // Update object name
        let objectNameInput = getByPlaceholderText(container, "Object name");
        const objectNameValue = "new object";
        fireEvent.change(objectNameInput, { target: { value: objectNameValue } });
        await waitFor(() => expect(getCurrentObject(store.getState()).object_name).toBe(objectNameValue));

        // Reset object
        resetObject(container);

        // Trigger a redirect and check if the object was removed from editedObjects storage due to not being changed
        const cancelButton = getSideMenuItem(container, "Cancel");
        fireEvent.click(cancelButton);
        expect(Object.keys(store.getState().editedObjects).includes("0")).toBeFalsy();
    });
});
