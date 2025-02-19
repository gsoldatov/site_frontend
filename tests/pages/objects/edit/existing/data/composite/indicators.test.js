import React from "react";

import { fireEvent } from "@testing-library/react";
import { getByText, getByPlaceholderText, waitFor, getByTitle } from "@testing-library/dom";

import { resetTestConfig } from "../../../../../../_mocks/config";
import { renderWithWrappers } from "../../../../../../_util/render";
import { getCurrentObject, clickDataTabButton, clickGeneralTabButton } from "../../../../../../_util/ui-objects-edit";
import { addANewSubobject, addAnExistingSubobject, getSubobjectCardAttributeElements, getSubobjectCards, 
    clickSubobjectCardAttributeTabButton, clickSubobjectCardDataTabButton, getSubobjectCardMenuButtons, 
    getSubobjectCardIndicators, getSubobjectExpandToggleButton } from "../../../../../../_util/ui-composite";
import { getDropdownOptionsContainer, getInlineInputField } from "../../../../../../_util/ui-objects-tags";
import { getInlineItem } from "../../../../../../_util/ui-inline";

import { App } from "../../../../../../../src/components/app";


/*
    /objects/edit/:id composite object data editing tests, subobject card indicators.
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


test("New subobject", async () => {
    let { container, store } = renderWithWrappers(<App />, {
        route: "/objects/edit/3001"
    });

    // Wait for object and its subobject(-s) to load
    await waitFor(() => getByText(container, "Object Information"));
    await waitFor(() => expect(store.getState().editedObjects).toHaveProperty(Object.keys(store.getState().editedObjects[3001].composite.subobjects)[0]));

    // Add a new subobject
    clickDataTabButton(container);
    addANewSubobject(container);
    const cards = getSubobjectCards(container, { expectedNumbersOfCards: [2] });

    // Check if indicator is displayed for the new subobject
    expect(getSubobjectCardIndicators(cards[0][0]).isNewSubobject).toBeFalsy();
    expect(getSubobjectCardIndicators(cards[0][1]).isNewSubobject).toBeTruthy();
});


test("Validation error", async () => {
    let { container, store } = renderWithWrappers(<App />, {
        route: "/objects/edit/3001"
    });

    // Wait for object and its subobject(-s) to load
    await waitFor(() => getByText(container, "Object Information"));
    await waitFor(() => expect(store.getState().editedObjects).toHaveProperty(Object.keys(store.getState().editedObjects[3001].composite.subobjects)[0]));
    clickDataTabButton(container);
    let card = getSubobjectCards(container, { expectedNumbersOfCards: [1] })[0][0];
    const { object_name, link } = store.getState().editedObjects[card.id];

    // Check if indicator is not displayed
    expect(getSubobjectCardIndicators(card).validationError).toBeFalsy();

    // Modify name, check if indicator is displayed, then change the name back and check if indicator is not displayed
    fireEvent.change(getSubobjectCardAttributeElements(card).subobjectNameInput, { target: { value: "" } });
    await waitFor(() => expect(store.getState().editedObjects[card.id].object_name).toEqual(""));
    expect(getSubobjectCardIndicators(card).validationError).toBeTruthy();

    fireEvent.change(getSubobjectCardAttributeElements(card).subobjectNameInput, { target: { value: object_name } });
    await waitFor(() => expect(store.getState().editedObjects[card.id].object_name).toEqual(object_name));
    expect(getSubobjectCardIndicators(card).validationError).toBeFalsy();

    // Modify data, check if indicator is displayed, then change data back and check if indicator is not displayed
    clickSubobjectCardDataTabButton(card);
    const linkInput = getByPlaceholderText(card, "Link");
    fireEvent.change(linkInput, { target: { value: "" } });
    await waitFor(() => expect(store.getState().editedObjects[card.id].link.link).toEqual(""));
    expect(getSubobjectCardIndicators(card).validationError).toBeTruthy();

    fireEvent.change(linkInput, { target: { value: link.link } });
    await waitFor(() => expect(store.getState().editedObjects[card.id].link.link).toEqual(link.link));
    expect(getSubobjectCardIndicators(card).validationError).toBeFalsy();
});


test("Is composite subobject", async () => {
    let { container, store } = renderWithWrappers(<App />, {
        route: "/objects/edit/3001"
    });

    // Wait for object and its subobject(-s) to load
    await waitFor(() => getByText(container, "Object Information"));
    await waitFor(() => expect(store.getState().editedObjects).toHaveProperty(Object.keys(store.getState().editedObjects[3001].composite.subobjects)[0]));
    clickDataTabButton(container);

    // Add an existing composite subobject
    await addAnExistingSubobject(container, 0, "composite subobject", store, { waitForObjectLoad: true });
    const cards = getSubobjectCards(container, { expectedNumbersOfCards: [2] });

    // Check if indicator is displayed for the composite subobject
    expect(getSubobjectCardIndicators(cards[0][0]).isComposite).toBeFalsy();
    expect(getSubobjectCardIndicators(cards[0][1]).isComposite).toBeTruthy();
});


test("Is existing subobject with modified attributes", async () => {
    let { container, store } = renderWithWrappers(<App />, {
        route: "/objects/edit/3001"
    });

    // Wait for object and its subobject(-s) to load
    await waitFor(() => getByText(container, "Object Information"));
    await waitFor(() => expect(store.getState().editedObjects).toHaveProperty(Object.keys(store.getState().editedObjects[3001].composite.subobjects)[0]));
    clickDataTabButton(container);

    // Add an existing subobject
    await addAnExistingSubobject(container, 0, "some subobject", store, { waitForObjectLoad: true });
    const cards = getSubobjectCards(container, { expectedNumbersOfCards: [2] });

    // Modify name of first subobject and check if indicator appeared
    expect(getSubobjectCardIndicators(cards[0][0]).isExistingSubobjectWithModifiedAttributes).toBeFalsy();
    fireEvent.change(getSubobjectCardAttributeElements(cards[0][0]).subobjectNameInput, { target: { value: "updated name" } });
    await waitFor(() => expect(store.getState().editedObjects[cards[0][0].id].object_name).toEqual("updated name"));
    expect(getSubobjectCardIndicators(cards[0][0]).isExistingSubobjectWithModifiedAttributes).toBeTruthy();
    
    // Modify description of second subobject and check if indicator appeared
    expect(getSubobjectCardIndicators(cards[0][1]).isExistingSubobjectWithModifiedAttributes).toBeFalsy();
    fireEvent.change(getSubobjectCardAttributeElements(cards[0][1]).subobjectDescriptionInput, { target: { value: "updated description" } });
    await waitFor(() => expect(store.getState().editedObjects[cards[0][1].id].object_description).toEqual("updated description"));
    expect(getSubobjectCardIndicators(cards[0][1]).isExistingSubobjectWithModifiedAttributes).toBeTruthy();
});


test("Is existing subobject with modified tags", async () => {
    let { container, store, historyManager } = renderWithWrappers(<App />, {
        route: "/objects/edit/3001"
    });

    // Wait for object and its subobject(-s) to load
    await waitFor(() => getByText(container, "Object Information"));
    await waitFor(() => expect(store.getState().editedObjects).toHaveProperty(Object.keys(store.getState().editedObjects[3001].composite.subobjects)[0]));
    clickDataTabButton(container);
    
    // Add an existing subobject
    await addAnExistingSubobject(container, 0, "some subobject", store, { waitForObjectLoad: true });
    let cards = getSubobjectCards(container, { expectedNumbersOfCards: [2] });

    expect(getSubobjectCardIndicators(cards[0][0]).isExistingSubobjectWithModifiedTags).toBeFalsy();
    expect(getSubobjectCardIndicators(cards[0][1]).isExistingSubobjectWithModifiedTags).toBeFalsy();

    // Go to first subobject page and add a tag
    historyManager.push(`/objects/edit/${cards[0][0].id}`);
    await waitFor(() => getByText(container, "Object Information"));
    clickGeneralTabButton(container);

    let inputToggle = getByTitle(container, "Click to add tags");
    expect(inputToggle).toBeTruthy();
    fireEvent.click(inputToggle);
    let input = getInlineInputField({ container });

    fireEvent.change(input, { target: { value: "new tag" } });
    await waitFor(() => expect(store.getState().objectsEditUI.tagsInput.matchingIDs.length).toEqual(10));
    let dropdown = getDropdownOptionsContainer({ container, currentQueryText: "new tag" });
    expect(dropdown).toBeTruthy();
    fireEvent.click(dropdown.childNodes[0]);    // click on "Add new tag" option

    // Go to second subobject page and remove a tag
    historyManager.push(`/objects/edit/${cards[0][1].id}`);
    await waitFor(() => getByText(container, "Object Information"));
    clickGeneralTabButton(container);

    const tagItemElements = getInlineItem({ container });
    expect(tagItemElements.linkTagID).toEqual(1);
    fireEvent.click(tagItemElements.icons[0]);
    expect(getCurrentObject(store.getState()).removedTagIDs.includes(1)).toBeTruthy();

    // Go to composite object page and check if indicators appeared on both subobjects
    historyManager.push(`/objects/edit/3001`);
    await waitFor(() => getByText(container, "Object Information"));
    clickDataTabButton(container);

    cards = getSubobjectCards(container, { expectedNumbersOfCards: [2] });
    expect(getSubobjectCardIndicators(cards[0][0]).isExistingSubobjectWithModifiedTags).toBeTruthy();
    expect(getSubobjectCardIndicators(cards[0][1]).isExistingSubobjectWithModifiedTags).toBeTruthy();
});


test("Is existing subobject with modified data", async () => {
    let { container, store } = renderWithWrappers(<App />, {
        route: "/objects/edit/3001"
    });

    // Wait for object and its subobject(-s) to load
    await waitFor(() => getByText(container, "Object Information"));
    await waitFor(() => expect(store.getState().editedObjects).toHaveProperty(Object.keys(store.getState().editedObjects[3001].composite.subobjects)[0]));
    clickDataTabButton(container);
    
    // Check if indicator appeared after data is modified
    const card = getSubobjectCards(container, { expectedNumbersOfCards: [1] })[0][0];
    expect(getSubobjectCardIndicators(card).isExistingSubobjectWithModifiedData).toBeFalsy();
    
    clickSubobjectCardDataTabButton(card);
    const linkInput = getByPlaceholderText(card, "Link");
    fireEvent.change(linkInput, { target: { value: "updated value" } });
    await waitFor(() => expect(store.getState().editedObjects[card.id].link.link).toEqual("updated value"));
    expect(getSubobjectCardIndicators(card).isExistingSubobjectWithModifiedData).toBeTruthy();
});


test("Is existing subobject with modified parameters", async () => {
    let { container, store } = renderWithWrappers(<App />, {
        route: "/objects/edit/3001"
    });

    // Wait for object and its subobject(-s) to load
    await waitFor(() => getByText(container, "Object Information"));
    await waitFor(() => expect(store.getState().editedObjects).toHaveProperty(Object.keys(store.getState().editedObjects[3001].composite.subobjects)[0]));
    clickDataTabButton(container);

    // Check if indicator is not displayed by default
    const card = getSubobjectCards(container, { expectedNumbersOfCards: [1] })[0][0];
    expect(getSubobjectCardIndicators(card).isExistingSubobjectWithModifiedParameters).toBeFalsy();

    // Check if indicator is not displayed after card tab is changed
    clickSubobjectCardDataTabButton(card);
    expect(getSubobjectCardIndicators(card).isExistingSubobjectWithModifiedParameters).toBeFalsy();

    // Check if indicator is not displayed after card tab is changed back
    clickSubobjectCardAttributeTabButton(card);
    expect(getSubobjectCardIndicators(card).isExistingSubobjectWithModifiedParameters).toBeFalsy();

    // Check if indicator is displayed after card expand is toggled
    fireEvent.click(getSubobjectExpandToggleButton(card));
    expect(getSubobjectCardIndicators(card).isExistingSubobjectWithModifiedParameters).toBeFalsy();

    // Check if indicator is not displayed after card expand is toggled twice
    fireEvent.click(getSubobjectExpandToggleButton(card));
    expect(getSubobjectCardIndicators(card).isExistingSubobjectWithModifiedParameters).toBeFalsy();
});


test("Is subobject deleted", async () => {
    let { container, store } = renderWithWrappers(<App />, {
        route: "/objects/edit/3001"
    });

    // Wait for object and its subobject(-s) to load
    await waitFor(() => getByText(container, "Object Information"));
    await waitFor(() => expect(store.getState().editedObjects).toHaveProperty(Object.keys(store.getState().editedObjects[3001].composite.subobjects)[0]));
    clickDataTabButton(container);

    // Check if indicator appears after subobject is deleted
    const card = getSubobjectCards(container, { expectedNumbersOfCards: [1] })[0][0];
    expect(getSubobjectCardIndicators(card).isDeleted).toBeFalsy();
    fireEvent.click(getSubobjectCardMenuButtons(card).deleteButton);
    expect(getSubobjectCardIndicators(card).isDeleted).toBeTruthy();

    // Check if indicator is not displayed after subobject is restored
    fireEvent.click(getSubobjectCardMenuButtons(card).restoreButton);
    expect(getSubobjectCardIndicators(card).isDeleted).toBeFalsy();
});


test("Is subobject fully deleted", async () => {
    let { container, store } = renderWithWrappers(<App />, {
        route: "/objects/edit/3001"
    });

    // Wait for object and its subobject(-s) to load
    await waitFor(() => getByText(container, "Object Information"));
    await waitFor(() => expect(store.getState().editedObjects).toHaveProperty(Object.keys(store.getState().editedObjects[3001].composite.subobjects)[0]));
    clickDataTabButton(container);

    // Check if indicator appears after subobject is fully deleted
    const card = getSubobjectCards(container, { expectedNumbersOfCards: [1] })[0][0];
    expect(getSubobjectCardIndicators(card).isFullyDeleted).toBeFalsy();
    fireEvent.click(getSubobjectCardMenuButtons(card).fullDeleteButton);
    expect(getSubobjectCardIndicators(card).isFullyDeleted).toBeTruthy();

    // Check if indicator is not displayed after subobject is restored
    fireEvent.click(getSubobjectCardMenuButtons(card).restoreButton);
    expect(getSubobjectCardIndicators(card).isFullyDeleted).toBeFalsy();
});
