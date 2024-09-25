import React from "react";

import { fireEvent } from "@testing-library/react";
import { getByText, getByPlaceholderText, waitFor } from "@testing-library/dom";

import { resetTestConfig } from "../../../../../../_mocks/config";
import { renderWithWrappers } from "../../../../../../_util/render";
import { clickDataTabButton, clickGeneralTabButton, getObjectTypeSwitchElements } from "../../../../../../_util/ui-objects-edit";
import { addANewSubobject, addAnExistingSubobject, getSubobjectCardAttributeElements, getSubobjectCards, 
    getAddSubobjectMenu, getAddSubobjectMenuDropdown } from "../../../../../../_util/ui-composite";

import { App } from "../../../../../../../src/components/top-level/app";


/*
    /objects/edit/new composite object data editing tests, adding subobjects.
*/
beforeEach(() => {
    // isolate fetch mock to avoid tests state collision because of cached data in fetch
    jest.isolateModules(() => {
        const { mockFetch, setFetchFail } = require("../../../../../../_mocks/mock-fetch");
        
        // Set test app configuration
        resetTestConfig();

        // reset fetch mocks
        jest.resetAllMocks();
        global.fetch = jest.fn(mockFetch);
        global.setFetchFail = jest.fn(setFetchFail);
    });
});


test("Load a new object and add new subobjects", async () => {
    let { container, store } = renderWithWrappers(<App />, {
        route: "/objects/edit/new"
    });

    // Wait for the page to load
    await waitFor(() => getByText(container, "Add a New Object"));

    // Select composite object type and go to data tab
    const { switchContainer, compositeOption } = getObjectTypeSwitchElements(container);
    fireEvent.click(switchContainer);
    fireEvent.click(compositeOption);
    clickDataTabButton(container);

    // Add two new subobjects and check if subobject cards are rendered
    addANewSubobject(container);
    addANewSubobject(container);
    let cards = getSubobjectCards(container, { expectedNumbersOfCards: [2] });

    // Update names of both subobjects
    const firstName = "first subobject", secondName = "second subobject";
    fireEvent.change(getSubobjectCardAttributeElements(cards[0][0]).subobjectNameInput, { target: { value: firstName } });
    fireEvent.change(getSubobjectCardAttributeElements(cards[0][1]).subobjectNameInput, { target: { value: secondName } });

    // Check if both names are correctly updated in state.editedObjects and displayed
    cards = getSubobjectCards(container, { expectedNumbersOfCards: [2] });
    expect(getSubobjectCardAttributeElements(cards[0][0]).subobjectNameInput.value).toEqual(firstName);
    expect(getSubobjectCardAttributeElements(cards[0][1]).subobjectNameInput.value).toEqual(secondName);

    const editedObjects = store.getState().editedObjects;
    expect(editedObjects).toHaveProperty("-1");
    expect(editedObjects[-1].object_name).toEqual(firstName);

    expect(editedObjects).toHaveProperty("-2");
    expect(editedObjects[-2].object_name).toEqual(secondName);
});


test("Load a new object and add existing subobjects", async () => {
    let { container, store, historyManager } = renderWithWrappers(<App />, {
        route: "/objects/edit/new"
    });

    // Wait for the page to load
    await waitFor(() => getByText(container, "Add a New Object"));

    // Select composite object type and go to data tab
    const { switchContainer, compositeOption } = getObjectTypeSwitchElements(container);
    fireEvent.click(switchContainer);
    fireEvent.click(compositeOption);
    clickDataTabButton(container);

    // Add two existing subobjects and check if subobject cards are rendered
    let firstName = "first subobject", secondName = "second subobject";
    await addAnExistingSubobject(container, 0, firstName, store, { waitForObjectLoad: true });
    await addAnExistingSubobject(container, 0, secondName, store, { waitForObjectLoad: true });

    // Check if subobject cards are rendered
    let cards = getSubobjectCards(container, { expectedNumbersOfCards: [2] });
    expect(getSubobjectCardAttributeElements(cards[0][0]).subobjectNameInput.value).toEqual(firstName);
    expect(getSubobjectCardAttributeElements(cards[0][1]).subobjectNameInput.value).toEqual(secondName);

    // Check if dropdown is not displayed
    const { addSubobjectMenuContainer } = getAddSubobjectMenu(container);
    expect(addSubobjectMenuContainer).toBeTruthy();
    const { dropdownInput, dropdownOptionsContainer } = getAddSubobjectMenuDropdown(addSubobjectMenuContainer);
    expect(dropdownInput).toBeFalsy();
    expect(dropdownOptionsContainer).toBeFalsy();

    // Edit name of the first subobject
    firstName = "updated first subobject";
    fireEvent.change(getSubobjectCardAttributeElements(cards[0][0]).subobjectNameInput, { target: { value: firstName } });

    // View object page of the first subobject
    const subobjectIDs = Object.keys(store.getState().editedObjects[0].composite.subobjects);
    historyManager.push(`/objects/edit/${subobjectIDs[0]}`);
    await waitFor(() => getByText(container, "Object Information"));
    clickGeneralTabButton(container);

    // Check if object name is updated, then update it again
    let nameInput = getByPlaceholderText(container, "Object name");
    expect(nameInput.value).toEqual(firstName);

    firstName = "updated again first subobject";
    fireEvent.change(nameInput, { target: { value: firstName } });

    // Return to composite object page and check if subobject name is displayed correctly;
    historyManager.push(`/objects/edit/new`);
    await waitFor(() => getByText(container, "Add a New Object"));
    clickDataTabButton(container);
    cards = getSubobjectCards(container, { expectedNumbersOfCards: [2] });
    expect(getSubobjectCardAttributeElements(cards[0][0]).subobjectNameInput.value).toEqual(firstName);
});


test("Close add existing object menu dropdown", async () => {
    let { container } = renderWithWrappers(<App />, {
        route: "/objects/edit/new"
    });

    // Wait for the page to load
    await waitFor(() => getByText(container, "Add a New Object"));

    // Select composite object type and go to data tab
    const { switchContainer, compositeOption } = getObjectTypeSwitchElements(container);
    fireEvent.click(switchContainer);
    fireEvent.click(compositeOption);
    clickDataTabButton(container);

    // Click "Add Existing" button
    const { addSubobjectMenuContainer, addExistingButton } = getAddSubobjectMenu(container);
    fireEvent.click(addExistingButton);

    // Check if dropdown appeared
    let { dropdownInput } = getAddSubobjectMenuDropdown(addSubobjectMenuContainer);
    expect(dropdownInput).toBeTruthy();

    // Enter object name
    fireEvent.change(dropdownInput, { target: { value: "some object" } });

    // Press Esc
    fireEvent.keyDown(dropdownInput, { key: "Escape", code: "Escape" });

    // Check if menu dropdown is closed
    const dropdownInputAndOptions = getAddSubobjectMenuDropdown(addSubobjectMenuContainer);
    expect(dropdownInputAndOptions.dropdownInput).toBeFalsy();
    expect(dropdownInputAndOptions.dropdownOptionsContainer).toBeFalsy();

    // Check if buttons are displayed
    getByText(addSubobjectMenuContainer, "Add New");
    getByText(addSubobjectMenuContainer, "Add Existing");

    // Check if no subobjects were added
    getSubobjectCards(container, { expectedNumbersOfCards: [0] });
});
