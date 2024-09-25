import React from "react";

import { fireEvent } from "@testing-library/react";
import { getByText, waitFor, getByTitle } from "@testing-library/dom";

import { resetTestConfig } from "../../../../../../_mocks/config";
import { renderWithWrappers } from "../../../../../../_util/render";
import { clickDataTabButton, getObjectTypeSwitchElements } from "../../../../../../_util/ui-objects-edit";
import { addANewSubobject, addAnExistingSubobject, getSubobjectCardAttributeElements, getSubobjectCards,
    getSubobjectExpandToggleButton } from "../../../../../../_util/ui-composite";

import { App } from "../../../../../../../src/components/top-level/app";


/*
    /objects/edit/new composite object data editing tests, subobject card heading.
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


test("Object name display", async () => {
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

    // Add a new subobject
    addANewSubobject(container);
    const card = getSubobjectCards(container, { expectedNumbersOfCards: [1] })[0][0];
    const heading = card.querySelector(".composite-subobjct-card-heading");
    expect(heading).toBeTruthy();

    // Check if "<Unnamed>" is displayed be default
    getByText(heading, "<Unnamed>");

    // Change object name and check if it's displayed in the heading
    const objectName = "updated name";
    fireEvent.change(getSubobjectCardAttributeElements(card).subobjectNameInput, { target: { value: objectName } });
    getByText(heading, objectName);
});


test("Object type icon", async () => {
    let { container, store } = renderWithWrappers(<App />, {
        route: "/objects/edit/new"
    });

    // Wait for the page to load
    await waitFor(() => getByText(container, "Add a New Object"));

    // Select composite object type and go to data tab
    const switchElements = getObjectTypeSwitchElements(container);
    fireEvent.click(switchElements.switchContainer);
    fireEvent.click(switchElements.compositeOption);
    clickDataTabButton(container);

    // Add a new subobject
    addANewSubobject(container);
    let card = getSubobjectCards(container, { expectedNumbersOfCards: [1] })[0][0];
    let heading = card.querySelector(".composite-subobjct-card-heading");
    expect(heading).toBeTruthy();

    // Select each object type and check object type icon's title text
    const { switchContainer, linkOption, markdownOption, toDoListOption, compositeOption } = getSubobjectCardAttributeElements(card);
    
    fireEvent.click(switchContainer);
    fireEvent.click(markdownOption);
    getByTitle(heading, "Markdown");

    fireEvent.click(switchContainer);
    fireEvent.click(toDoListOption);
    getByTitle(heading, "To-do list");

    fireEvent.click(switchContainer);
    fireEvent.click(linkOption);
    getByTitle(heading, "Link");

    expect(compositeOption).toBeUndefined();

    // Add an existing composite subobject
    const objectName = "Test composite";
    await addAnExistingSubobject(container, 0, objectName, store, { waitForObjectLoad: true });

    // Check icon title
    card = getSubobjectCards(container, { expectedNumbersOfCards: [2] })[0][1];
    heading = card.querySelector(".composite-subobjct-card-heading");
    getByTitle(heading, "Composite object");
});


test("Expand/collapse toggle", async () => {
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

    // Add a new subobject
    addANewSubobject(container);
    let card = getSubobjectCards(container, { expectedNumbersOfCards: [1] })[0][0];

    // Check if expand button is rendered and has a correct CSS classname
    let expandToggle = getSubobjectExpandToggleButton(card);
    expect(expandToggle).toBeTruthy();
    expect(expandToggle.classList.contains("expanded")).toBeTruthy();

    // Check if heading, menu and attribute tag are rendered
    expect(card.querySelector(".composite-subobjct-card-heading")).toBeTruthy();
    expect(card.querySelector(".composite-subobject-card-menu")).toBeTruthy();
    expect(card.querySelector(".composite-subobject-card-tab")).toBeTruthy();

    // Collapse card
    fireEvent.click(expandToggle);

    // Check if expand button is rendered and has a correct CSS classname
    expandToggle = getSubobjectExpandToggleButton(card);
    expect(expandToggle).toBeTruthy();
    expect(expandToggle.classList.contains("expanded")).toBeFalsy();

    // Check if only heading is rendered
    expect(card.querySelector(".composite-subobjct-card-heading")).toBeTruthy();
    expect(card.querySelector(".composite-subobject-card-menu")).toBeFalsy();
    expect(card.querySelector(".composite-subobject-card-tab")).toBeFalsy();

    // Expand card
    fireEvent.click(expandToggle);

    // Check if expand button is rendered and has a correct CSS classname
    expandToggle = getSubobjectExpandToggleButton(card);
    expect(expandToggle).toBeTruthy();
    expect(expandToggle.classList.contains("expanded")).toBeTruthy();

    // Check if heading, menu and attribute tag are rendered
    expect(card.querySelector(".composite-subobjct-card-heading")).toBeTruthy();
    expect(card.querySelector(".composite-subobject-card-menu")).toBeTruthy();
    expect(card.querySelector(".composite-subobject-card-tab")).toBeTruthy();
});
