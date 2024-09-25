import React from "react";

import { fireEvent } from "@testing-library/react";
import { getByText, getByPlaceholderText, waitFor } from "@testing-library/dom";

import { resetTestConfig } from "../../../../../../_mocks/config";
import { checkRenderedItemsOrder } from "../../../../../../_util/to-do-lists";
import { renderWithWrappers } from "../../../../../../_util/render";
import { clickDataTabButton, clickGeneralTabButton, getObjectTypeSwitchElements } from "../../../../../../_util/ui-objects-edit";
import { addANewSubobject, addAnExistingSubobject, getSubobjectCardAttributeElements, getSubobjectCards, 
    clickSubobjectCardAttributeTabButton, clickSubobjectCardDataTabButton } from "../../../../../../_util/ui-composite";
import { getMarkdownEditorElements, waitForMarkdownHeaderRender } from "../../../../../../_util/ui-markdown-editor";

import { App } from "../../../../../../../src/components/top-level/app";


/*
    /objects/edit/new composite object data editing tests, subobject attributes and data tabs.
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


test("New subobject's attributes tab", async () => {
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

    // Add two new subobjects
    addANewSubobject(container);
    addANewSubobject(container);
    let cards = getSubobjectCards(container, { expectedNumbersOfCards: [2] });

    // Check if subobject IDs are stored in the cards
    const subobjectIDsFromState = Object.keys(store.getState().editedObjects[0].composite.subobjects).sort();
    const subobjectIDsFromCards = [cards[0][0].id, cards[0][1].id].sort();
    expect(subobjectIDsFromState[0]).toEqual(subobjectIDsFromCards[0]);
    expect(subobjectIDsFromState[1]).toEqual(subobjectIDsFromCards[1]);

    // Check if object type can't be set to composite and timstamps are not rendered
    const { compositeButton, timeStampsContainer, subobjectNameInput, subobjectDescriptionInput } = getSubobjectCardAttributeElements(cards[0][0]);
    expect(compositeButton).toBeFalsy();
    expect(timeStampsContainer).toBeFalsy();

    // Edit name & description and check if they're updated
    const subobjectID = cards[0][0].id;
    const objectName = "some name", objectDescription = "# some description";
    fireEvent.change(subobjectNameInput, { target: { value: objectName } });
    await waitFor(() => expect(store.getState().editedObjects[subobjectID].object_name).toEqual(objectName));
    fireEvent.change(subobjectDescriptionInput, { target: { value: objectDescription } });
    await waitFor(() => expect(store.getState().editedObjects[subobjectID].object_description).toEqual(objectDescription));
    
    // Check if markdown is rendered
    const { editorContainer } = getMarkdownEditorElements({ container: cards[0][0] });
    await waitForMarkdownHeaderRender({ editorContainer, text: "some description" });

});


test("Existing subobject's attributes tab", async () => {
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

    // Add two existing subobjects and check if subobject cards are rendered
    let firstName = "link subobject", secondName = "markdown subobject";
    await addAnExistingSubobject(container, 0, firstName, store, { waitForObjectLoad: true });
    await addAnExistingSubobject(container, 0, secondName, store, { waitForObjectLoad: true });
    let cards = getSubobjectCards(container, { expectedNumbersOfCards: [2] });

    // Check if subobject IDs are stored in the cards
    const subobjectIDsFromState = Object.keys(store.getState().editedObjects[0].composite.subobjects).sort();
    const subobjectIDsFromCards = [cards[0][0].id, cards[0][1].id].sort();
    expect(subobjectIDsFromState[0]).toEqual(subobjectIDsFromCards[0]);
    expect(subobjectIDsFromState[1]).toEqual(subobjectIDsFromCards[1]);

    // Check if data is correctly displayed
    const subobjectID = cards[0][0].id;
    const firstCardAttributeElements = getSubobjectCardAttributeElements(cards[0][0]);
    expect(firstCardAttributeElements.timeStampsContainer).toBeTruthy();
    getByText(firstCardAttributeElements.selectedObjectType, "Link");
    expect(firstCardAttributeElements.subobjectNameInput.value).toEqual(firstName);
    expect(firstCardAttributeElements.subobjectNameInput.value).toEqual(store.getState().editedObjects[subobjectID].object_name);
    expect(firstCardAttributeElements.subobjectDescriptionInput.value).toEqual(store.getState().editedObjects[subobjectID].object_description);

    // Check if object type can't be changed
    fireEvent.click(firstCardAttributeElements.switchContainer);
    expect(firstCardAttributeElements.dropdownOptionsContainer.classList.contains("visible")).toBeFalsy();  // classname is required to display dropdown options

    // Edit name & description and check if they're changed
    const objectName = "some name", objectDescription = "# some description";
    fireEvent.change(firstCardAttributeElements.subobjectNameInput, { target: { value: objectName } });
    await waitFor(() => expect(store.getState().editedObjects[subobjectID].object_name).toEqual(objectName));
    fireEvent.change(firstCardAttributeElements.subobjectDescriptionInput, { target: { value: objectDescription } });
    await waitFor(() => expect(store.getState().editedObjects[subobjectID].object_description).toEqual(objectDescription));

    // Check if markdown is rendered
    const { editorContainer } = getMarkdownEditorElements({ container: cards[0][0] });
    await waitForMarkdownHeaderRender({ editorContainer, text: "some description" });
});


test("New subobjects' data tab", async () => {
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

    // Add two new subobjects
    addANewSubobject(container);
    addANewSubobject(container);
    let cards = getSubobjectCards(container, { expectedNumbersOfCards: [2] });
    const card = cards[0][0];
    
    // Select markdown object type, check if data is correctly updated and markdown container is rendered on the data tab
    let switchElements = getSubobjectCardAttributeElements(card);
    fireEvent.click(switchElements.switchContainer);
    fireEvent.click(switchElements.markdownOption);
    expect(store.getState().editedObjects[cards[0][0].id].object_type).toEqual("markdown");
    expect(store.getState().editedObjects[cards[0][1].id].object_type).toEqual("link");
    clickSubobjectCardDataTabButton(card);
    expect(card.querySelector(".markdown-editor-container")).toBeTruthy();

    // Select to-do object type and check if to-do list container is rendered on the data tab
    clickSubobjectCardAttributeTabButton(card);
    switchElements = getSubobjectCardAttributeElements(card);
    fireEvent.click(switchElements.switchContainer);
    fireEvent.click(switchElements.toDoListOption);
    clickSubobjectCardDataTabButton(card);
    expect(card.querySelector(".to-do-list-container")).toBeTruthy();

    // Select link object type and check if link input is rendered on the data tab
    clickSubobjectCardAttributeTabButton(card);
    switchElements = getSubobjectCardAttributeElements(card);
    fireEvent.click(switchElements.switchContainer);
    fireEvent.click(switchElements.linkOption);
    clickSubobjectCardDataTabButton(card);
    const linkInput = getByPlaceholderText(card, "Link");

    // Edit link value and check if it was updated
    const linkText = "test text";
    fireEvent.change(linkInput, { target: { value: linkText } });
    await waitFor(() => expect(store.getState().editedObjects[cards[0][0].id].link.link).toEqual(linkText));
});


test("Existing subobjects' data tab", async () => {
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

    // Add an existing link object
    await addAnExistingSubobject(container, 0, "link subobject", store, { waitForObjectLoad: true });
    let card = getSubobjectCards(container, { expectedNumbersOfCards: [1] })[0][0];
    getByText(getSubobjectCardAttributeElements(card).selectedObjectType, "Link");

    // Check if link data is displayed
    clickSubobjectCardDataTabButton(card);
    const linkInput = getByPlaceholderText(card, "Link");
    expect(linkInput.value).toEqual(store.getState().editedObjects[card.id].link.link);
    
    // Edit link value and check if it was updated
    const linkText = "test text";
    fireEvent.change(linkInput, { target: { value: linkText } });
    await waitFor(() => expect(store.getState().editedObjects[card.id].link.link).toEqual(linkText));

    // Add an existing markdown object
    await addAnExistingSubobject(container, 0, "markdown subobject", store, { waitForObjectLoad: true });
    card = getSubobjectCards(container, { expectedNumbersOfCards: [2] })[0][1];
    getByText(getSubobjectCardAttributeElements(card).selectedObjectType, "Markdown");

    // Check if markdown data is displayed
    clickSubobjectCardDataTabButton(card);
    const markdownContainer = card.querySelector(".markdown-editor-container");
    expect(markdownContainer).toBeTruthy();
    const markdownInput = markdownContainer.querySelector(".edit-page-textarea");
    expect(markdownInput).toBeTruthy();
    expect(markdownInput.value).toEqual(store.getState().editedObjects[card.id].markdown.raw_text);

    // Add an existing to-do list object
    await addAnExistingSubobject(container, 0, "to_do_list subobject", store, { waitForObjectLoad: true });
    card = getSubobjectCards(container, { expectedNumbersOfCards: [3] })[0][2];
    getByText(getSubobjectCardAttributeElements(card).selectedObjectType, "To-do list");

    // Check if to-do list data is displayed
    clickSubobjectCardDataTabButton(card);
    const TDLContainer = card.querySelector(".to-do-list-container");
    expect(TDLContainer).toBeTruthy();
    checkRenderedItemsOrder(TDLContainer, [0, 1, 2, 3, 4, 5, 6, 7]);

    // Add an existing composite object
    await addAnExistingSubobject(container, 0, "composite subobject", store, { waitForObjectLoad: true });
    card = getSubobjectCards(container, { expectedNumbersOfCards: [4] })[0][3];
    getByText(getSubobjectCardAttributeElements(card).selectedObjectType, "Composite object");

    // Check if data tab placeholder is displayed
    clickSubobjectCardDataTabButton(card);
    getByText(card, "Object preview unavailable.");

    // Click placeholder link and check if redirect occured
    const subobjectID = card.id;
    const objectPageLink = card.querySelector(".default-object-data-page-link");
    fireEvent.click(objectPageLink);
    await waitFor(() => getByText(container, "Object Information"));
    clickGeneralTabButton(container);
    const objectNameInput = getByPlaceholderText(container, "Object name");
    expect(objectNameInput.value).toEqual("composite subobject");
});
