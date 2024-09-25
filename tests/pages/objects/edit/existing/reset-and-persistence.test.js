import React from "react";

import { fireEvent } from "@testing-library/react";
import { getByText, getByPlaceholderText, waitFor, getByTitle } from "@testing-library/dom";

import { resetTestConfig } from "../../../../_mocks/config";
import { renderWithWrappers } from "../../../../_util/render";
import { getSideMenuDialogControls, getSideMenuItem } from "../../../../_util/ui-common";
import { getCurrentObject, waitForEditObjectPageLoad, clickDataTabButton, clickGeneralTabButton, resetObject } from "../../../../_util/ui-objects-edit";
import { addANewSubobject, addAnExistingSubobject, getSubobjectCardAttributeElements, getSubobjectCards } from "../../../../_util/ui-composite";

import { App } from "../../../../../src/components/top-level/app";


/*
    /objects/edit/:id page tests for data reset and persistence.
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


describe("Reset object", () => {
    test("Cancel reset + reset attributes and link", async () => {
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/edit/1"
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
        await waitFor(() => expect(getCurrentObject(store.getState()).link.link).toBe(linkValue));

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
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/edit/1001"
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
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/edit/2001"
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
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/edit/3001"
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
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/edit/3001"
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
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/edit/1"
        });
        await waitFor(() => getByText(container, "Object Information"));
        expect(Object.keys(store.getState().editedObjects).includes("1")).toBeTruthy();

        // Trigger a redirect and check if the object was removed from editedObjects storage due to not being changed
        const cancelButton = getSideMenuItem(container, "Cancel");
        fireEvent.click(cancelButton);
        expect(Object.keys(store.getState().editedObjects).includes("1")).toBeFalsy();
    });


    test("Attributes and link", async () => {
        // Render page of the first object
        let { container, store, historyManager } = renderWithWrappers(<App />, {
            route: "/objects/edit/1"
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
        await waitFor(() => expect(getCurrentObject(store.getState()).link.link).toBe(linkValue));

        // Render another object page, then return to the original object
        historyManager.push("/objects/edit/2");
        await waitForEditObjectPageLoad(container, store);
        historyManager.push("/objects/edit/1");
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
        let { container, store, historyManager } = renderWithWrappers(<App />, {
            route: "/objects/edit/1001"
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
        historyManager.push("/objects/edit/2");
        await waitForEditObjectPageLoad(container, store);
        historyManager.push("/objects/edit/1001");
        // await waitForEditObjectPageLoad(container, store);   // wait function can't catch fetch changing to true and false if data is present in the state
        
        // Check if modified Markdown is displayed
        await waitFor(() => expect(getByPlaceholderText(container, "Enter text here...").value).toEqual(rawText));
    });


    test("To-do list", async () => {
        // Render page of the first object
        let { container, store, historyManager } = renderWithWrappers(<App />, {
            route: "/objects/edit/2001"
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
        historyManager.push("/objects/edit/2");
        await waitForEditObjectPageLoad(container, store);
        historyManager.push("/objects/edit/2001");
        // await waitForEditObjectPageLoad(container, store);   // wait function can't catch fetch changing to true and false if data is present in the state
        
        // Check if modified Markdown is displayed
        await waitFor(() => getByText(container.querySelector(".to-do-list-container"), newItemText));
    });


    test("Composite data and subobjects", async () => {
        let { container, store, historyManager } = renderWithWrappers(<App />, {
            route: "/objects/edit/3001"
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
        historyManager.push(`/objects/edit/${card.id}`);
        clickGeneralTabButton(container);
        await waitFor(() => expect(getByPlaceholderText(container, "Object name").value).toEqual(newSubobjectName));
        
        // Modify subobject name again
        newSubobjectName = "updated twice name";
        fireEvent.change(getByPlaceholderText(container, "Object name"), { target: { value: newSubobjectName } });
        await waitFor(() => expect(store.getState().editedObjects[card.id].object_name).toEqual(newSubobjectName));

        // Return to main object page
        historyManager.push(`/objects/edit/3001`);
        await waitFor(() => getByText(container, "Object Information"));
        clickDataTabButton(container);
        
        card = getSubobjectCards(container, { expectedNumbersOfCards: [1] })[0][0];
        expect(getSubobjectCardAttributeElements(card).subobjectNameInput.value).toEqual(newSubobjectName);
    });


    test("Unchanged composite object's and subobject removal", async () => {
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/edit/3001"
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
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/edit/3001"
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
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/edit/3001"
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
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/edit/3001"
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
