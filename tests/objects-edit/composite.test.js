import React from "react";
import { Route } from "react-router-dom";

import { fireEvent } from "@testing-library/react";
import { getByText, getByPlaceholderText, waitFor, getByTitle } from "@testing-library/dom";

import { compareArrays } from "../_util/data-checks";
import { checkRenderedItemsOrder } from "../_util/to-do-lists";
import { renderWithWrappers } from "../_util/render";
import { getCurrentObject, clickDataTabButton, getObjectTypeSelectingElements, clickGeneralTabButton, clickDisplayTabButton, 
    clickPublishObjectCheckbox, getObjectTypeSwitchElements } from "../_util/ui-objects-edit";
import { addANewSubobject, addAnExistingSubobject, getSubobjectCardAttributeElements, getSubobjectCards, getAddSubobjectMenu, getAddSubobjectMenuDropdown,
    clickSubobjectCardAttributeTabButton, clickSubobjectCardDataTabButton, clickSubobjectCardDisplayTabButton, getSubobjectCardMenuButtons, getSubobjectCardTabSelectionButtons, 
    getSubobjectCardIndicators, getSubobjectExpandToggleButton, startSubobjectCardDrag, getSubobjectGridColumnContainers, getNewColumnDropzones } from "../_util/ui-composite";
import { getDropdownOptionsContainer, getInlineInputField } from "../_util/ui-objects-tags";

import { NewObject, EditObject } from "../../src/components/top-level/objects-edit";
import { enumDeleteModes } from "../../src/store/state-templates/composite-subobjects";


/*
    Composite object functionality tests.
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


describe("Basic load and UI checks", () => {
    test("Load a new object and add new subobjects", async () => {
        let { container, store } = renderWithWrappers(<Route exact path="/objects/edit/:id"><NewObject /></Route>, {
            route: "/objects/edit/new"
        });

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
        let { container, store, history } = renderWithWrappers(<Route exact path="/objects/edit/:id" render={ props => props.match.params.id === "new" ? <NewObject /> : <EditObject /> } />, {
            route: "/objects/edit/new", store
        });

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
        history.push(`/objects/edit/${subobjectIDs[0]}`);
        await waitFor(() => getByText(container, "Object Information"));
        clickGeneralTabButton(container);

        // Check if object name is updated, then update it again
        let nameInput = getByPlaceholderText(container, "Object name");
        expect(nameInput.value).toEqual(firstName);

        firstName = "updated again first subobject";
        fireEvent.change(nameInput, { target: { value: firstName } });

        // Return to composite object page and check if subobject name is displayed correctly;
        history.push(`/objects/edit/new`);
        await waitFor(() => getByText(container, "Add a New Object"));
        clickDataTabButton(container);
        cards = getSubobjectCards(container, { expectedNumbersOfCards: [2] });
        expect(getSubobjectCardAttributeElements(cards[0][0]).subobjectNameInput.value).toEqual(firstName);
    });


    test("Close add existing object menu dropdown", async () => {
        let { container } = renderWithWrappers(<Route exact path="/objects/edit/:id"><NewObject /></Route>, {
            route: "/objects/edit/new"
        });

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


    test("Load a new object and toggle published settings of object & subobjects", async () => {
        let { container, store } = renderWithWrappers(<Route exact path="/objects/edit/:id"><NewObject /></Route>, {
            route: "/objects/edit/new"
        });
        expect(store.getState().editedObjects[0].is_published).toBeFalsy();
    
        // Select composite object type
        const { switchContainer, compositeOption } = getObjectTypeSwitchElements(container);
        fireEvent.click(switchContainer);
        fireEvent.click(compositeOption);
    
        // Publish object
        clickDisplayTabButton(container);
        clickPublishObjectCheckbox(container);
        expect(store.getState().editedObjects[0].is_published).toBeTruthy();
    
        // Add a new subobject & check if it has the same `is_published` setting as parent
        clickDataTabButton(container);
        addANewSubobject(container);
        let firstSubobjectID = getSubobjectCards(container, { expectedNumbersOfCards: [1] })[0][0].id;
        expect(store.getState().editedObjects[firstSubobjectID].is_published).toBeTruthy();
    
        // Unpublish object
        clickDisplayTabButton(container);
        clickPublishObjectCheckbox(container);
        expect(store.getState().editedObjects[0].is_published).toBeFalsy();
    
        // Add a new subobject & check if it has the same `is_published` setting as parent
        clickDataTabButton(container);
        addANewSubobject(container);
        let secondSubobjectID = getSubobjectCards(container, { expectedNumbersOfCards: [2] })[0][1].id;
        expect(store.getState().editedObjects[secondSubobjectID].is_published).toBeFalsy();
    
        // Check if "Publish Subobjects" checkbox is indeterminate state
        clickDisplayTabButton(container);
        const publishSubobjectsContainer = getByText(container, "Publish Subobjects").parentNode;
        const publishSubobjectsInput = publishSubobjectsContainer.querySelector("input");
        expect(publishSubobjectsContainer.classList.contains("indeterminate")).toBeTruthy();
    
        // Publish all subobjects & check state
        fireEvent.click(publishSubobjectsInput);
        expect(store.getState().editedObjects[firstSubobjectID].is_published).toBeTruthy();
        expect(store.getState().editedObjects[secondSubobjectID].is_published).toBeTruthy();
    
        // Publish all subobjects & check state
        fireEvent.click(publishSubobjectsInput);
        expect(store.getState().editedObjects[firstSubobjectID].is_published).toBeFalsy();
        expect(store.getState().editedObjects[secondSubobjectID].is_published).toBeFalsy();
    
        // Publish first subobject & check state
        clickDataTabButton(container);
        let firstSubobjectCard = getSubobjectCards(container, { expectedNumbersOfCards: [2] })[0][0];
        clickSubobjectCardDisplayTabButton(firstSubobjectCard);
    
        const publishFirstSubobjectCheckboxContainer = getByText(firstSubobjectCard, "Publish Object").parentNode;
        expect(publishFirstSubobjectCheckboxContainer.classList.contains("checked")).toBeFalsy();
        clickPublishObjectCheckbox(firstSubobjectCard);
        expect(store.getState().editedObjects[firstSubobjectID].is_published).toBeTruthy();
    
        // Unpublish first subobject & check state
        expect(publishFirstSubobjectCheckboxContainer.classList.contains("checked")).toBeTruthy();
        clickPublishObjectCheckbox(firstSubobjectCard);
        expect(store.getState().editedObjects[firstSubobjectID].is_published).toBeFalsy();
    });
});


describe("Heading (without indicators)", () => {
    test("Object name display", async () => {
        let { container } = renderWithWrappers(<Route exact path="/objects/edit/:id"><NewObject /></Route>, {
            route: "/objects/edit/new"
        });

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
        let { container, store } = renderWithWrappers(<Route exact path="/objects/edit/:id"><NewObject /></Route>, {
            route: "/objects/edit/new"
        });

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
        let { container, store } = renderWithWrappers(<Route exact path="/objects/edit/:id"><NewObject /></Route>, {
            route: "/objects/edit/new"
        });

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
});


describe("Subobject card tabs", () => {
    test("New subobject's attributes tab", async () => {
        let { container, store } = renderWithWrappers(<Route exact path="/objects/edit/:id"><NewObject /></Route>, {
            route: "/objects/edit/new"
        });

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
        const objectName = "some name", objectDescription = "some description";
        fireEvent.change(subobjectNameInput, { target: { value: objectName } });
        await waitFor(() => expect(store.getState().editedObjects[subobjectID].object_name).toEqual(objectName));
        fireEvent.change(subobjectDescriptionInput, { target: { value: objectDescription } });
        await waitFor(() => expect(store.getState().editedObjects[subobjectID].object_description).toEqual(objectDescription));
    });


    test("Existing subobject's attributes tab", async () => {
        let { container, store } = renderWithWrappers(<Route exact path="/objects/edit/:id"><NewObject /></Route>, {
            route: "/objects/edit/new"
        });

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
        const objectName = "some name", objectDescription = "some description";
        fireEvent.change(firstCardAttributeElements.subobjectNameInput, { target: { value: objectName } });
        await waitFor(() => expect(store.getState().editedObjects[subobjectID].object_name).toEqual(objectName));
        fireEvent.change(firstCardAttributeElements.subobjectDescriptionInput, { target: { value: objectDescription } });
        await waitFor(() => expect(store.getState().editedObjects[subobjectID].object_description).toEqual(objectDescription));
    });


    test("New subobjects' data tab", async () => {
        let { container, store } = renderWithWrappers(<Route exact path="/objects/edit/:id"><NewObject /></Route>, {
            route: "/objects/edit/new"
        });

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
        expect(card.querySelector(".markdown-container")).toBeTruthy();

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
        let { container, store } = renderWithWrappers(<Route exact path="/objects/edit/:id" render={ props => props.match.params.id === "new" ? <NewObject /> : <EditObject /> } />, {
            route: "/objects/edit/new"
        });

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
        const markdownContainer = card.querySelector(".markdown-container");
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
});


describe("Subobject card menu buttons", () => {
    describe("New subobject", () => {
        test("Reset button", async () => {
            let { container, store } = renderWithWrappers(<Route exact path="/objects/edit/:id"><NewObject /></Route>, {
                route: "/objects/edit/new"
            });
    
            // Select composite object type and go to data tab
        const { switchContainer, compositeOption } = getObjectTypeSwitchElements(container);
        fireEvent.click(switchContainer);
        fireEvent.click(compositeOption);
            clickDataTabButton(container);
    
            // Add two new subobjects
            addANewSubobject(container);
            addANewSubobject(container);
            let cards = getSubobjectCards(container, { expectedNumbersOfCards: [2] });

            // Modify first subobject
            const firstCard = cards[0][0], firstName = "first subobject name";
            fireEvent.change(getSubobjectCardAttributeElements(firstCard).subobjectNameInput, { target: { value: firstName } });
            await waitFor(() => expect(store.getState().editedObjects[firstCard.id].object_name).toEqual(firstName));

            // Modify second subobject
            const secondCard = cards[0][1], secondName = "second subobject name";
            fireEvent.change(getSubobjectCardAttributeElements(secondCard).subobjectNameInput, { target: { value: secondName } });
            await waitFor(() => expect(store.getState().editedObjects[secondCard.id].object_name).toEqual(secondName));

            const secondDescription = "second subobject description";
            fireEvent.change(getSubobjectCardAttributeElements(secondCard).subobjectDescriptionInput, { target: { value: secondDescription } });
            await waitFor(() => expect(store.getState().editedObjects[secondCard.id].object_description).toEqual(secondDescription));

            fireEvent.click(getSubobjectCardAttributeElements(secondCard).switchContainer);
            fireEvent.click(getSubobjectCardAttributeElements(secondCard).markdownOption);
            clickSubobjectCardDataTabButton(secondCard);

            const secondMarkdown = "some markdown text";
            const markdownContainer = secondCard.querySelector(".markdown-container");
            expect(markdownContainer).toBeTruthy();
            const markdownInput = markdownContainer.querySelector(".edit-page-textarea");
            expect(markdownInput).toBeTruthy();
            fireEvent.change(markdownInput, { target: { value: secondMarkdown } });

            // Click reset button in second card, then close the dialog
            const { resetButton } = getSubobjectCardMenuButtons(secondCard);
            fireEvent.click(resetButton);
            let resetDialogContainer = secondCard.querySelector(".subobject-card-dialog-container");
            expect(resetDialogContainer).toBeTruthy();
            fireEvent.click(getByText(resetDialogContainer, "No"));
            expect(secondCard.querySelector(".markdown-container")).toBeTruthy();
            expect(secondCard.querySelector(".markdown-container").querySelector(".edit-page-textarea").value).toEqual(secondMarkdown);

            // Reset second subobject
            fireEvent.click(resetButton);
            fireEvent.click(getByText(secondCard.querySelector(".subobject-card-dialog-container"), "Yes"));

            // Check if second object's state was reset
            const secondEditedObject = store.getState().editedObjects[secondCard.id];
            expect(secondEditedObject.object_type).toEqual("link");
            expect(secondEditedObject.object_name).toEqual("");
            expect(secondEditedObject.object_description).toEqual("");
            expect(secondEditedObject.markdown.raw_text).toEqual("");

            // Check if first subobject is not reset
            expect(getSubobjectCardAttributeElements(firstCard).subobjectNameInput.value).toEqual(firstName);
            expect(store.getState().editedObjects[firstCard.id].object_name).toEqual(firstName);
        });


        test("Delete button", async () => {
            let { container, store } = renderWithWrappers(<Route exact path="/objects/edit/:id"><NewObject /></Route>, {
                route: "/objects/edit/new"
            });
    
            // Select composite object type and go to data tab
        const { switchContainer, compositeOption } = getObjectTypeSwitchElements(container);
        fireEvent.click(switchContainer);
        fireEvent.click(compositeOption);
            clickDataTabButton(container);
    
            // Add two new subobjects
            addANewSubobject(container);
            addANewSubobject(container);
            const [firstCard, secondCard] = getSubobjectCards(container, { expectedNumbersOfCards: [2] })[0];

            // Check if restore button is not displayed
            expect(getSubobjectCardMenuButtons(firstCard).restoreButton).toBeFalsy();

            // Delete first subobject
            fireEvent.click(getSubobjectCardMenuButtons(firstCard).deleteButton);

            // Check if first subobject is deleted
            getByText(firstCard, "Subobject is marked for deletion.");
            expect(store.getState().editedObjects[0].composite.subobjects[firstCard.id].deleteMode).toEqual(enumDeleteModes.subobjectOnly);
            
            // Check if tab selection is disabled
            const { subobjectGeneralTabButton, subobjectDataTabButton } = getSubobjectCardTabSelectionButtons(firstCard);
            expect(subobjectGeneralTabButton.classList.contains("disabled")).toBeTruthy();
            expect(subobjectDataTabButton.classList.contains("disabled")).toBeTruthy();

            // Check if second subobject is not deleted
            expect(store.getState().editedObjects[0].composite.subobjects[secondCard.id].deleteMode).toEqual(enumDeleteModes.none);

            // Restore first subobject
            const { restoreButton } = getSubobjectCardMenuButtons(firstCard);
            expect(restoreButton).toBeTruthy();
            fireEvent.click(restoreButton);

            // Check if first subobject is restored
            expect(getSubobjectCardAttributeElements(firstCard).subobjectDescriptionInput).toBeTruthy();
            expect(store.getState().editedObjects[0].composite.subobjects[firstCard.id].deleteMode).toEqual(enumDeleteModes.none);

            // Check if restore button is not displayed
            expect(getSubobjectCardMenuButtons(firstCard).restoreButton).toBeFalsy();
        });
    });


    describe("Exising subobject", () => {
        test("View subobject page", async () => {
            let { container, store } = renderWithWrappers(<Route exact path="/objects/edit/:id" render={ props => props.match.params.id === "new" ? <NewObject /> : <EditObject /> } />, {
                route: "/objects/edit/new"
            });
    
            // Select composite object type and go to data tab
            const { switchContainer, compositeOption } = getObjectTypeSwitchElements(container);
            fireEvent.click(switchContainer);
            fireEvent.click(compositeOption);
            clickDataTabButton(container);
    
            // Add an existing subobject
            await addAnExistingSubobject(container, 0, "some name", store, { waitForObjectLoad: true });
            const card = getSubobjectCards(container, { expectedNumbersOfCards: [1] })[0][0];

            // Modify subobject name
            const objectName = "updated name";
            fireEvent.change(getSubobjectCardAttributeElements(card).subobjectNameInput, { target: { value: objectName } });
            await waitFor(() => expect(store.getState().editedObjects[card.id].object_name).toEqual(objectName));

            // Click view subobject page button
            fireEvent.click(getSubobjectCardMenuButtons(card).viewObjectPageButton);

            // Check if modified name is displayed
            await waitFor(() => getByText(container, "Object Information"));
            clickGeneralTabButton(container);
            const nameInput = getByPlaceholderText(container, "Object name");
            expect(nameInput.value).toEqual(objectName);
        });


        test("Reset button (general behaviour)", async () => {
            let { container, store } = renderWithWrappers(<Route exact path="/objects/edit/:id"><NewObject /></Route>, {
                route: "/objects/edit/new"
            });
    
            // Select composite object type and go to data tab
            const { switchContainer, compositeOption } = getObjectTypeSwitchElements(container);
            fireEvent.click(switchContainer);
            fireEvent.click(compositeOption);
            clickDataTabButton(container);
    
            // Add an existing subobject
            await addAnExistingSubobject(container, 0, "some name", store, { waitForObjectLoad: true });
            const card = getSubobjectCards(container, { expectedNumbersOfCards: [1] })[0][0];
            const unchangedEditedObject = store.getState().editedObjects[card.id];

            // Modify subobject
            const objectName = "updated name";
            fireEvent.change(getSubobjectCardAttributeElements(card).subobjectNameInput, { target: { value: objectName } });
            await waitFor(() => expect(store.getState().editedObjects[card.id].object_name).toEqual(objectName));

            const updatedDescription = "updated description";
            fireEvent.change(getSubobjectCardAttributeElements(card).subobjectDescriptionInput, { target: { value: updatedDescription } });
            await waitFor(() => expect(store.getState().editedObjects[card.id].object_description).toEqual(updatedDescription));

            clickSubobjectCardDataTabButton(card);
            const linkInput = getByPlaceholderText(card, "Link");
            const linkText = "test text";
            fireEvent.change(linkInput, { target: { value: linkText } });
            await waitFor(() => expect(store.getState().editedObjects[card.id].link.link).toEqual(linkText));

            // Click reset button & close dialog
            const { resetButton } = getSubobjectCardMenuButtons(card);
            fireEvent.click(resetButton);
            let resetDialogContainer = card.querySelector(".subobject-card-dialog-container");
            expect(resetDialogContainer).toBeTruthy();
            fireEvent.click(getByText(resetDialogContainer, "No"));
            expect(getByPlaceholderText(card, "Link").value).toEqual(linkText);

            // Reset second subobject
            fireEvent.click(resetButton);
            fireEvent.click(getByText(card.querySelector(".subobject-card-dialog-container"), "Yes"));

            // Check if second object's state was reset
            const secondEditedObject = store.getState().editedObjects[card.id];
            expect(secondEditedObject.object_name).toEqual(unchangedEditedObject.object_name);
            expect(secondEditedObject.object_description).toEqual(unchangedEditedObject.object_description);
            expect(secondEditedObject.link.link).toEqual(unchangedEditedObject.link.link);
        });


        test("Reset button (composite subobject)", async () => {
            let { container, store, history } = renderWithWrappers(<Route exact path="/objects/edit/:id" render={ props => props.match.params.id === "new" ? <NewObject /> : <EditObject /> } />, {
                route: "/objects/edit/new"
            });

            // Select composite object type and go to data tab
            const { switchContainer, compositeOption } = getObjectTypeSwitchElements(container);
            fireEvent.click(switchContainer);
            fireEvent.click(compositeOption);
            clickDataTabButton(container);
    
            // Add an existing subobject
            await addAnExistingSubobject(container, 0, "composite subobject", store, { waitForObjectLoad: true });
            let card = getSubobjectCards(container, { expectedNumbersOfCards: [1] })[0][0];
            const subobjectID = card.id;

            // Open subobject page and add a new subobject
            history.push(`/objects/edit/${subobjectID}`);
            await waitFor(() => getByText(container, "Object Information"));
            // fireEvent.click(getSubobjectCardMenuButtons(card).viewObjectPageButton);
            clickDataTabButton(container);
            const subobjectsBeforeUpdate = Object.keys(store.getState().editedObjects[subobjectID].composite.subobjects).length;
            addANewSubobject(container);
            const newSubSubobjectID = getSubobjectCards(container, { expectedNumbersOfCards: [subobjectsBeforeUpdate + 1] })[0][subobjectsBeforeUpdate].id;
            
            // Return to main object and reset its composite subobject
            history.push("/objects/edit/new");
            await waitFor(() => getByPlaceholderText(container, "Object name"));    // wait for the page to load
            clickDataTabButton(container);
            card = getSubobjectCards(container, { expectedNumbersOfCards: [1] })[0][0];
            fireEvent.click(getSubobjectCardMenuButtons(card).resetButton);
            fireEvent.click(getByText(card.querySelector(".subobject-card-dialog-container"), "Yes"));

            // Check if new subobject is deleted from editedObjects & subobject state
            expect(store.getState().editedObjects).not.toHaveProperty(newSubSubobjectID);
            expect(store.getState().editedObjects[subobjectID].composite.subobjects).not.toHaveProperty(newSubSubobjectID);
        });


        test("Delete button", async () => {
            let { container, store } = renderWithWrappers(<Route exact path="/objects/edit/:id"><NewObject /></Route>, {
                route: "/objects/edit/new"
            });
    
            // Select composite object type and go to data tab
        const { switchContainer, compositeOption } = getObjectTypeSwitchElements(container);
        fireEvent.click(switchContainer);
        fireEvent.click(compositeOption);
            clickDataTabButton(container);
    
            // Add an existing subobject
            await addAnExistingSubobject(container, 0, "some name", store, { waitForObjectLoad: true });
            const card = getSubobjectCards(container, { expectedNumbersOfCards: [1] })[0][0];

            // Click delete button and check if subobject is deleted
            fireEvent.click(getSubobjectCardMenuButtons(card).deleteButton);
            expect(store.getState().editedObjects[0].composite.subobjects[card.id].deleteMode).toEqual(enumDeleteModes.subobjectOnly);

            // Click restore button and check if subobject is restored
            fireEvent.click(getSubobjectCardMenuButtons(card).restoreButton);
            expect(store.getState().editedObjects[0].composite.subobjects[card.id].deleteMode).toEqual(enumDeleteModes.none);
        });


        test("Full delete button", async () => {
            let { container, store } = renderWithWrappers(<Route exact path="/objects/edit/:id"><NewObject /></Route>, {
                route: "/objects/edit/new"
            });
    
            // Select composite object type and go to data tab
        const { switchContainer, compositeOption } = getObjectTypeSwitchElements(container);
        fireEvent.click(switchContainer);
        fireEvent.click(compositeOption);
            clickDataTabButton(container);
    
            // Add an existing subobject
            await addAnExistingSubobject(container, 0, "some name", store, { waitForObjectLoad: true });
            const card = getSubobjectCards(container, { expectedNumbersOfCards: [1] })[0][0];

            // Click delete button and check if subobject is deleted
            fireEvent.click(getSubobjectCardMenuButtons(card).fullDeleteButton);
            expect(store.getState().editedObjects[0].composite.subobjects[card.id].deleteMode).toEqual(enumDeleteModes.full);

            // Click restore button and check if subobject is restored
            fireEvent.click(getSubobjectCardMenuButtons(card).restoreButton);
            expect(store.getState().editedObjects[0].composite.subobjects[card.id].deleteMode).toEqual(enumDeleteModes.none);
        });
    });
});


describe("Indicators", () => {
    test("New subobject", async () => {
        let { container, store } = renderWithWrappers(<Route exact path="/objects/edit/:id"><EditObject /></Route>, {
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
        let { container, store } = renderWithWrappers(<Route exact path="/objects/edit/:id"><EditObject /></Route>, {
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

        fireEvent.change(linkInput, { target: { value: link } });
        await waitFor(() => expect(store.getState().editedObjects[card.id].link.link).toEqual(link));
        expect(getSubobjectCardIndicators(card).validationError).toBeFalsy();
    });


    test("Is composite subobject", async () => {
        let { container, store } = renderWithWrappers(<Route exact path="/objects/edit/:id"><EditObject /></Route>, {
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
        let { container, store } = renderWithWrappers(<Route exact path="/objects/edit/:id"><EditObject /></Route>, {
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
        let { container, store, history } = renderWithWrappers(<Route exact path="/objects/edit/:id"><EditObject /></Route>, {
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
        history.push(`/objects/edit/${cards[0][0].id}`);
        await waitFor(() => getByText(container, "Object Information"));
        clickGeneralTabButton(container);

        let inputToggle = getByTitle(container, "Click to add tags");
        expect(inputToggle).toBeTruthy();
        fireEvent.click(inputToggle);
        let input = getInlineInputField({ container });

        fireEvent.change(input, { target: { value: "new tag" } });
        await waitFor(() => expect(store.getState().objectUI.tagsInput.matchingIDs.length).toEqual(10));
        let dropdown = getDropdownOptionsContainer({ container, currentQueryText: "new tag" });
        expect(dropdown).toBeTruthy();
        fireEvent.click(dropdown.childNodes[0]);    // click on "Add new tag" option

        // Go to second subobject page and remove a tag
        history.push(`/objects/edit/${cards[0][1].id}`);
        await waitFor(() => getByText(container, "Object Information"));
        clickGeneralTabButton(container);

        let tag = getByText(container, "tag #1");
        fireEvent.click(tag);
        expect(getCurrentObject(store.getState()).removedTagIDs.includes(1)).toBeTruthy();

        // Go to composite object page and check if indicators appeared on both subobjects
        history.push(`/objects/edit/3001`);
        await waitFor(() => getByText(container, "Object Information"));
        clickDataTabButton(container);

        cards = getSubobjectCards(container, { expectedNumbersOfCards: [2] });
        expect(getSubobjectCardIndicators(cards[0][0]).isExistingSubobjectWithModifiedTags).toBeTruthy();
        expect(getSubobjectCardIndicators(cards[0][1]).isExistingSubobjectWithModifiedTags).toBeTruthy();
    });


    test("Is existing subobject with modified data", async () => {
        let { container, store, } = renderWithWrappers(<Route exact path="/objects/edit/:id"><EditObject /></Route>, {
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
        let { container, store } = renderWithWrappers(<Route exact path="/objects/edit/:id"><EditObject /></Route>, {
            route: "/objects/edit/3001"
        });

        // Wait for object and its subobject(-s) to load
        await waitFor(() => getByText(container, "Object Information"));
        await waitFor(() => expect(store.getState().editedObjects).toHaveProperty(Object.keys(store.getState().editedObjects[3001].composite.subobjects)[0]));
        clickDataTabButton(container);

        // Check if indicator is not displayed by default
        const card = getSubobjectCards(container, { expectedNumbersOfCards: [1] })[0][0];
        expect(getSubobjectCardIndicators(card).isExistingSubobjectWithModifiedParameters).toBeFalsy();

        // Check if indicator is displayed after card tab is changed
        clickSubobjectCardDataTabButton(card);
        expect(getSubobjectCardIndicators(card).isExistingSubobjectWithModifiedParameters).toBeTruthy();

        // Check if indicator is not displayed after card tab is changed back
        clickSubobjectCardAttributeTabButton(card);
        expect(getSubobjectCardIndicators(card).isExistingSubobjectWithModifiedParameters).toBeFalsy();

        // Check if indicator is displayed after card expand is toggled
        fireEvent.click(getSubobjectExpandToggleButton(card));
        expect(getSubobjectCardIndicators(card).isExistingSubobjectWithModifiedParameters).toBeTruthy();

        // Check if indicator is not displayed after card expand is toggled twice
        fireEvent.click(getSubobjectExpandToggleButton(card));
        expect(getSubobjectCardIndicators(card).isExistingSubobjectWithModifiedParameters).toBeFalsy();
    });


    test("Is subobject deleted", async () => {
        let { container, store, } = renderWithWrappers(<Route exact path="/objects/edit/:id"><EditObject /></Route>, {
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
        let { container, store, } = renderWithWrappers(<Route exact path="/objects/edit/:id"><EditObject /></Route>, {
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
});


describe("Drag and drop", () => {
    describe("Card drag and drop enabling and disabling", () => {
        test("Try to drag a card without hovering over its heading", async () => {
            let { container, store } = renderWithWrappers(<Route exact path="/objects/edit/:id"><EditObject /></Route>, {
                route: "/objects/edit/3901"
            });

            // Wait for object and its subobject(-s) to load
            await waitFor(() => getByText(container, "Object Information"));
            await waitFor(() => expect(Object.keys(store.getState().editedObjects).length).toEqual(5));
            clickDataTabButton(container);

            // Try to start a card drag without hoveing over heading
            let cards = getSubobjectCards(container, { expectedNumbersOfCards: [4] });
            expect(compareArrays(cards[0].map(card => parseInt(card.id)), [101, 1101, 2101, 3101])).toBeTruthy();
            const draggedCard = cards[0][0];
            let dragStarted = true;
            fireEvent.dragStart(draggedCard);

            await waitFor(() => expect(draggedCard.classList.contains("is-dragged")).toBeTruthy(), {
                timeout: 500, onTimeout: () => { dragStarted = false; }
            });

            if (dragStarted) fail("Subobject card drag operation started without hovering over heading.");
        });


        test("Try to drag a card when hovering over expand/collapse toggle", async () => {
            let { container, store } = renderWithWrappers(<Route exact path="/objects/edit/:id"><EditObject /></Route>, {
                route: "/objects/edit/3901"
            });

            // Wait for object and its subobject(-s) to load
            await waitFor(() => getByText(container, "Object Information"));
            await waitFor(() => expect(Object.keys(store.getState().editedObjects).length).toEqual(5));
            clickDataTabButton(container);

            // Try to start a card drag when hoveing over expand/collapse toggle
            let cards = getSubobjectCards(container, { expectedNumbersOfCards: [4] });
            expect(compareArrays(cards[0].map(card => parseInt(card.id)), [101, 1101, 2101, 3101])).toBeTruthy();
            const draggedCard = cards[0][0];
            let dragStarted = true;
            
            const heading = draggedCard.querySelector(".composite-subobjct-card-heading");
            fireEvent.mouseEnter(heading);
            fireEvent.mouseEnter(getSubobjectExpandToggleButton(draggedCard));
            fireEvent.dragStart(draggedCard);

            await waitFor(() => expect(draggedCard.classList.contains("is-dragged")).toBeTruthy(), {
                timeout: 500, onTimeout: () => { dragStarted = false; }
            });

            if (dragStarted) fail("Subobject card drag operation started when hovering over expand/collapse toggle.");
        });


        test("Enter and leave expand/collapse toggle, then start card drag", async () => {
            let { container, store } = renderWithWrappers(<Route exact path="/objects/edit/:id"><EditObject /></Route>, {
                route: "/objects/edit/3901"
            });

            // Wait for object and its subobject(-s) to load
            await waitFor(() => getByText(container, "Object Information"));
            await waitFor(() => expect(Object.keys(store.getState().editedObjects).length).toEqual(5));
            clickDataTabButton(container);

            // Enter and leave expand/collapse toggle, then start a drag
            let cards = getSubobjectCards(container, { expectedNumbersOfCards: [4] });
            expect(compareArrays(cards[0].map(card => parseInt(card.id)), [101, 1101, 2101, 3101])).toBeTruthy();
            const draggedCard = cards[0][0];
            
            const heading = draggedCard.querySelector(".composite-subobjct-card-heading");
            fireEvent.mouseEnter(heading);
            const toggle = getSubobjectExpandToggleButton(draggedCard);
            fireEvent.mouseEnter(toggle);
            fireEvent.mouseLeave(toggle);        // mouseEnter + mouseLeave toggle event execution does not allow card dragging in test env, despite the events properly work in browser
            fireEvent.mouseEnter(heading);       // however, if heading mouseEnter is toggled again, drag starts as expected
            fireEvent.dragStart(draggedCard);

            await waitFor(() => expect(draggedCard.classList.contains("is-dragged")).toBeTruthy());
        });
    });


    describe("Single column", () => {
        describe("Drag expanded card", () => {
            test("Start and abort dragging a card", async () => {
                let { container, store } = renderWithWrappers(<Route exact path="/objects/edit/:id"><EditObject /></Route>, {
                    route: "/objects/edit/3901"
                });

                // Wait for object and its subobject(-s) to load
                await waitFor(() => getByText(container, "Object Information"));
                await waitFor(() => expect(Object.keys(store.getState().editedObjects).length).toEqual(5));
                clickDataTabButton(container);

                // Start a card drag and check if it's not displayed (inside `startSubobjectCardDrag`)
                let cards = getSubobjectCards(container, { expectedNumbersOfCards: [4] });
                expect(compareArrays(cards[0].map(card => parseInt(card.id)), [101, 1101, 2101, 3101])).toBeTruthy();
                const draggedCard = cards[0][0];
                const incorrectDropTarget = getByText(container, "Object Information");
                await startSubobjectCardDrag(draggedCard);

                // Drop card on an incorrect target
                fireEvent.drop(incorrectDropTarget);
                fireEvent.dragEnd(draggedCard);

                // Check if dragged card is displayed
                await waitFor(() => expect(draggedCard.classList.contains("is-dragged")).toBeFalsy());

                // Check if subobject order did not change
                cards = getSubobjectCards(container, { expectedNumbersOfCards: [4] });
                expect(compareArrays(cards[0].map(card => parseInt(card.id)), [101, 1101, 2101, 3101])).toBeTruthy();
            });


            test("Drop expanded card on another card", async () => {
                let { container, store } = renderWithWrappers(<Route exact path="/objects/edit/:id"><EditObject /></Route>, {
                    route: "/objects/edit/3901"
                });

                // Wait for object and its subobject(-s) to load
                await waitFor(() => getByText(container, "Object Information"));
                await waitFor(() => expect(Object.keys(store.getState().editedObjects).length).toEqual(5));
                clickDataTabButton(container);

                // Start a card drag and check if it's not displayed (inside `startSubobjectCardDrag`)
                let cards = getSubobjectCards(container, { expectedNumbersOfCards: [4] });
                expect(compareArrays(cards[0].map(card => parseInt(card.id)), [101, 1101, 2101, 3101])).toBeTruthy();
                const draggedCard = cards[0][0];
                const dropTarget = cards[0][3];
                await startSubobjectCardDrag(draggedCard);

                // Drop card on another card
                fireEvent.drop(dropTarget);
                fireEvent.dragEnd(draggedCard);

                // Check if dropped card is displayed
                await waitFor(() => expect(draggedCard.classList.contains("is-dragged")).toBeFalsy());

                // Check if subobject order is correctly updated
                cards = getSubobjectCards(container, { expectedNumbersOfCards: [4] });
                expect(compareArrays(cards[0].map(card => parseInt(card.id)), [1101, 2101, 101, 3101])).toBeTruthy();
            });


            test("Drop expanded card on add menu", async () => {
                let { container, store } = renderWithWrappers(<Route exact path="/objects/edit/:id"><EditObject /></Route>, {
                    route: "/objects/edit/3901"
                });

                // Wait for object and its subobject(-s) to load
                await waitFor(() => getByText(container, "Object Information"));
                await waitFor(() => expect(Object.keys(store.getState().editedObjects).length).toEqual(5));
                clickDataTabButton(container);

                // Start a card drag and check if it's not displayed (inside `startSubobjectCardDrag`)
                let cards = getSubobjectCards(container, { expectedNumbersOfCards: [5], countAddMenusAsCards: true });
                expect(compareArrays(cards[0].map(card => parseInt(card.id)), [101, 1101, 2101, 3101, NaN])).toBeTruthy();
                const draggedCard = cards[0][0];
                const dropTarget = cards[0][4];
                await startSubobjectCardDrag(draggedCard);

                // Drop card on add menu
                fireEvent.drop(dropTarget);
                fireEvent.dragEnd(draggedCard);

                // Check if dropped card is displayed
                await waitFor(() => expect(draggedCard.classList.contains("is-dragged")).toBeFalsy());

                // Check if subobject order is correctly updated
                cards = getSubobjectCards(container, { expectedNumbersOfCards: [4] });
                expect(compareArrays(cards[0].map(card => parseInt(card.id)), [1101, 2101, 3101, 101])).toBeTruthy();
            });
        });


        describe("Collapsed card", () => {
            test("Drag collapsed card on an expanded card", async () => {
                let { container, store } = renderWithWrappers(<Route exact path="/objects/edit/:id"><EditObject /></Route>, {
                    route: "/objects/edit/3903"
                });

                // Wait for object and its subobject(-s) to load
                await waitFor(() => getByText(container, "Object Information"));
                await waitFor(() => expect(Object.keys(store.getState().editedObjects).length).toEqual(5));
                clickDataTabButton(container);

                // Start a card drag and check if it's not displayed (inside `startSubobjectCardDrag`)
                let cards = getSubobjectCards(container, { expectedNumbersOfCards: [4] });
                expect(compareArrays(cards[0].map(card => parseInt(card.id)), [101, 1101, 2101, 3101])).toBeTruthy();
                const draggedCard = cards[0][0];
                const dropTarget = cards[0][3];
                expect(draggedCard.classList.contains("expanded")).toBeFalsy();
                expect(dropTarget.classList.contains("expanded")).toBeTruthy();
                await startSubobjectCardDrag(draggedCard);

                // Drop card on another card
                fireEvent.drop(dropTarget);
                fireEvent.dragEnd(draggedCard);

                // Check if dropped card is displayed
                await waitFor(() => expect(draggedCard.classList.contains("is-dragged")).toBeFalsy());

                // Check if subobject order is correctly updated
                cards = getSubobjectCards(container, { expectedNumbersOfCards: [4] });
                expect(compareArrays(cards[0].map(card => parseInt(card.id)), [1101, 2101, 101, 3101])).toBeTruthy();
                expect(cards[0][2].classList.contains("expanded")).toBeFalsy();
            });


            test("Drag expanded card on a collapsed card", async () => {
                let { container, store } = renderWithWrappers(<Route exact path="/objects/edit/:id"><EditObject /></Route>, {
                    route: "/objects/edit/3903"
                });

                // Wait for object and its subobject(-s) to load
                await waitFor(() => getByText(container, "Object Information"));
                await waitFor(() => expect(Object.keys(store.getState().editedObjects).length).toEqual(5));
                clickDataTabButton(container);

                // Start a card drag and check if it's not displayed (inside `startSubobjectCardDrag`)
                let cards = getSubobjectCards(container, { expectedNumbersOfCards: [4] });
                expect(compareArrays(cards[0].map(card => parseInt(card.id)), [101, 1101, 2101, 3101])).toBeTruthy();
                const draggedCard = cards[0][3];
                const dropTarget = cards[0][0];
                expect(draggedCard.classList.contains("expanded")).toBeTruthy();
                expect(dropTarget.classList.contains("expanded")).toBeFalsy();
                await startSubobjectCardDrag(draggedCard);

                // Drop card on another card
                fireEvent.drop(dropTarget);
                fireEvent.dragEnd(draggedCard);

                // Check if dropped card is displayed
                await waitFor(() => expect(draggedCard.classList.contains("is-dragged")).toBeFalsy());

                // Check if subobject order is correctly updated
                cards = getSubobjectCards(container, { expectedNumbersOfCards: [4] });
                expect(compareArrays(cards[0].map(card => parseInt(card.id)), [3101, 101, 1101, 2101])).toBeTruthy();
                expect(cards[0][2].classList.contains("expanded")).toBeFalsy();
            });
        });


        describe("Card with an error placeholder", () => {
            test("Drag error placeholder on another card", async () => {
                let { container, store } = renderWithWrappers(<Route exact path="/objects/edit/:id"><EditObject /></Route>, {
                    route: "/objects/edit/3904"
                });

                // Wait for object and its subobject(-s) to load
                await waitFor(() => getByText(container, "Object Information"));
                await waitFor(() => expect(Object.keys(store.getState().editedObjects).length).toEqual(3));
                await waitFor(() => expect(store.getState().editedObjects[3904].composite.subobjects[9999].fetchError).not.toEqual(""));
                clickDataTabButton(container);

                // Start a card drag and check if it's not displayed
                let cards = getSubobjectCards(container, { expectedNumbersOfCards: [3] });
                expect(compareArrays(cards[0].map(card => parseInt(card.id)), [NaN, 1101, 2101])).toBeTruthy();
                const draggedCard = cards[0][0];
                const dropTarget = cards[0][2];
                
                fireEvent.dragStart(draggedCard);
                await waitFor(() => expect(draggedCard.classList.contains("is-dragged")).toBeTruthy());

                // Drop card on another card
                fireEvent.drop(dropTarget);
                fireEvent.dragEnd(draggedCard);

                // Check if dropped card is displayed
                await waitFor(() => expect(draggedCard.classList.contains("is-dragged")).toBeFalsy());

                // Check if subobject order is correctly updated
                cards = getSubobjectCards(container, { expectedNumbersOfCards: [3] });
                expect(compareArrays(cards[0].map(card => parseInt(card.id)), [1101, NaN, 2101])).toBeTruthy();
                getByText(cards[0][1], store.getState().editedObjects[3904].composite.subobjects[9999].fetchError);
            });
        });
    });


    describe("Multicolumn", () => {
        describe("Single column at start", () => {
            test("Drag from a single column with multiple cards to the right", async () => {
                let { container, store } = renderWithWrappers(<Route exact path="/objects/edit/:id"><EditObject /></Route>, {
                    route: "/objects/edit/3901"
                });

                // Wait for object and its subobject(-s) to load
                await waitFor(() => getByText(container, "Object Information"));
                await waitFor(() => expect(Object.keys(store.getState().editedObjects).length).toEqual(5));
                clickDataTabButton(container);

                // Start a card drag and check if it's not displayed (inside `startSubobjectCardDrag`)
                let cards = getSubobjectCards(container, { expectedNumbersOfCards: [4] });
                expect(compareArrays(cards[0].map(card => parseInt(card.id)), [101, 1101, 2101, 3101])).toBeTruthy();
                const draggedCard = cards[0][1];
                await startSubobjectCardDrag(draggedCard);
                
                // Drop the card on the right new column dropzone
                const columnContainer = getSubobjectGridColumnContainers(container)[0];
                const { rightDropzone } = getNewColumnDropzones(columnContainer);
                fireEvent.drop(rightDropzone);
                fireEvent.dragEnd(draggedCard);

                // Check if dragged card is displayed in the new column
                await waitFor(() => {
                    const { column, row } = store.getState().editedObjects[3901].composite.subobjects[1101];
                    expect(column).toEqual(1);
                    expect(row).toEqual(0);
                });

                // Check if rows are correctly reduced in the start column
                cards = getSubobjectCards(container, { expectedNumbersOfCards: [3, 1] });
                expect(compareArrays(cards[0].map(card => parseInt(card.id)), [101, 2101, 3101])).toBeTruthy();
                expect(store.getState().editedObjects[3901].composite.subobjects[2101].row).toEqual(1);
                expect(store.getState().editedObjects[3901].composite.subobjects[3101].row).toEqual(2);
            });


            test("Drag from a single column with multiple cards to the left", async () => {
                let { container, store } = renderWithWrappers(<Route exact path="/objects/edit/:id"><EditObject /></Route>, {
                    route: "/objects/edit/3901"
                });

                // Wait for object and its subobject(-s) to load
                await waitFor(() => getByText(container, "Object Information"));
                await waitFor(() => expect(Object.keys(store.getState().editedObjects).length).toEqual(5));
                clickDataTabButton(container);

                // Start a card drag and check if it's not displayed (inside `startSubobjectCardDrag`)
                let cards = getSubobjectCards(container, { expectedNumbersOfCards: [4] });
                expect(compareArrays(cards[0].map(card => parseInt(card.id)), [101, 1101, 2101, 3101])).toBeTruthy();
                const draggedCard = cards[0][1];
                await startSubobjectCardDrag(draggedCard);
                
                // Drop the card on the left new column dropzone
                const columnContainer = getSubobjectGridColumnContainers(container)[0];
                const { leftDropzone } = getNewColumnDropzones(columnContainer);
                fireEvent.drop(leftDropzone);
                fireEvent.dragEnd(draggedCard);

                // Check if start column number is increased
                await waitFor(() => {
                    const { column, row } = store.getState().editedObjects[3901].composite.subobjects[101];
                    expect(column).toEqual(1);
                    expect(row).toEqual(0);
                });

                // Check if rows are correctly reduced in the start column
                cards = getSubobjectCards(container, { expectedNumbersOfCards: [1, 3] });
                expect(compareArrays(cards[1].map(card => parseInt(card.id)), [101, 2101, 3101])).toBeTruthy();
                expect(store.getState().editedObjects[3901].composite.subobjects[2101].row).toEqual(1);
                expect(store.getState().editedObjects[3901].composite.subobjects[3101].row).toEqual(2);

                // Check if dragged subobject is displayed in the new column
                expect(compareArrays(cards[0].map(card => parseInt(card.id)), [1101])).toBeTruthy();
            });


            test("Drag from a single column with a single card to the right", async () => {
                let { container, store } = renderWithWrappers(<Route exact path="/objects/edit/:id"><EditObject /></Route>, {
                    route: "/objects/edit/3001"
                });

                // Wait for object and its subobject(-s) to load
                await waitFor(() => getByText(container, "Object Information"));
                await waitFor(() => expect(Object.keys(store.getState().editedObjects).length).toEqual(2));
                clickDataTabButton(container);

                // Start a card drag and check if it's not displayed (inside `startSubobjectCardDrag`)
                let cards = getSubobjectCards(container, { expectedNumbersOfCards: [1] });
                expect(compareArrays(cards[0].map(card => parseInt(card.id)), [101])).toBeTruthy();
                const draggedCard = cards[0][0];
                await startSubobjectCardDrag(draggedCard);
                
                // Drop the card on the right new column dropzone
                const columnContainer = getSubobjectGridColumnContainers(container)[0];
                const { rightDropzone } = getNewColumnDropzones(columnContainer);
                fireEvent.drop(rightDropzone);
                fireEvent.dragEnd(draggedCard);
                
                // Check if subobject is displayed on the same position
                await waitFor(() => expect(draggedCard.classList.contains("is-dragged")).toBeFalsy());
                expect(store.getState().editedObjects[3001].composite.subobjects[101].row).toEqual(0);
                expect(store.getState().editedObjects[3001].composite.subobjects[101].column).toEqual(0);

                // Check if no new columns appeared
                getSubobjectCards(container, { expectedNumbersOfCards: [1] });
            });


            test("Drag from a single column with a single card to the left", async () => {
                let { container, store } = renderWithWrappers(<Route exact path="/objects/edit/:id"><EditObject /></Route>, {
                    route: "/objects/edit/3001"
                });

                // Wait for object and its subobject(-s) to load
                await waitFor(() => getByText(container, "Object Information"));
                await waitFor(() => expect(Object.keys(store.getState().editedObjects).length).toEqual(2));
                clickDataTabButton(container);

                // Start a card drag and check if it's not displayed (inside `startSubobjectCardDrag`)
                let cards = getSubobjectCards(container, { expectedNumbersOfCards: [1] });
                expect(compareArrays(cards[0].map(card => parseInt(card.id)), [101])).toBeTruthy();
                const draggedCard = cards[0][0];
                await startSubobjectCardDrag(draggedCard);
                
                // Drop the card on the left new column dropzone
                const columnContainer = getSubobjectGridColumnContainers(container)[0];
                const { leftDropzone } = getNewColumnDropzones(columnContainer);
                fireEvent.drop(leftDropzone);
                fireEvent.dragEnd(draggedCard);
                
                // Check if subobject is displayed on the same position
                await waitFor(() => expect(draggedCard.classList.contains("is-dragged")).toBeFalsy());
                expect(store.getState().editedObjects[3001].composite.subobjects[101].row).toEqual(0);
                expect(store.getState().editedObjects[3001].composite.subobjects[101].column).toEqual(0);

                // Check if no new columns appeared
                getSubobjectCards(container, { expectedNumbersOfCards: [1] });
            });
        });


        describe("Two columns at start", () => {
            test("Drag from a column with multiple cards onto a card in another column", async () => {
                let { container, store } = renderWithWrappers(<Route exact path="/objects/edit/:id"><EditObject /></Route>, {
                    route: "/objects/edit/3905"
                });

                // Wait for object and its subobject(-s) to load
                await waitFor(() => getByText(container, "Object Information"));
                await waitFor(() => expect(Object.keys(store.getState().editedObjects).length).toEqual(9)); // 1 + 2 * 4
                clickDataTabButton(container);

                // Start a card drag and check if it's not displayed (inside `startSubobjectCardDrag`)
                let cards = getSubobjectCards(container, { expectedNumbersOfCards: [4, 4] });
                expect(compareArrays(cards[0].map(card => parseInt(card.id)), [101, 102, 103, 104])).toBeTruthy();
                expect(compareArrays(cards[1].map(card => parseInt(card.id)), [105, 106, 107, 108])).toBeTruthy();
                const draggedCard = cards[0][1];
                const dropTarget = cards[1][1];
                await startSubobjectCardDrag(draggedCard);

                // Drop card on another card
                fireEvent.drop(dropTarget);
                fireEvent.dragEnd(draggedCard);

                // Check if dragged subobject's position is updated correctly
                await waitFor(() => {
                    const { column, row } = store.getState().editedObjects[3905].composite.subobjects[102];
                    expect(column).toEqual(1);
                    expect(row).toEqual(1);
                });

                // Check if cards are displayed in the correct positions
                cards = getSubobjectCards(container, { expectedNumbersOfCards: [3, 5] });
                expect(compareArrays(cards[0].map(card => parseInt(card.id)), [101, 103, 104])).toBeTruthy();
                expect(compareArrays(cards[1].map(card => parseInt(card.id)), [105, 102, 106, 107, 108])).toBeTruthy();

                // Check if dragged card is displayed correctly
                expect(cards[1][1].classList.contains("is-dragged")).toBeFalsy();

                // Check if rows are correctly reduced in the first column
                expect(store.getState().editedObjects[3905].composite.subobjects[103].row).toEqual(1);
                expect(store.getState().editedObjects[3905].composite.subobjects[104].row).toEqual(2);

                // Check if rows are correctly increased in the second column
                expect(store.getState().editedObjects[3905].composite.subobjects[106].row).toEqual(2);
                expect(store.getState().editedObjects[3905].composite.subobjects[107].row).toEqual(3);
                expect(store.getState().editedObjects[3905].composite.subobjects[108].row).toEqual(4);
            });


            test("Drag from a column with multiple cards onto an add menu in another column", async () => {
                let { container, store } = renderWithWrappers(<Route exact path="/objects/edit/:id"><EditObject /></Route>, {
                    route: "/objects/edit/3905"
                });

                // Wait for object and its subobject(-s) to load
                await waitFor(() => getByText(container, "Object Information"));
                await waitFor(() => expect(Object.keys(store.getState().editedObjects).length).toEqual(9)); // 1 + 2 * 4
                clickDataTabButton(container);

                // Start a card drag and check if it's not displayed (inside `startSubobjectCardDrag`)
                let cards = getSubobjectCards(container, { expectedNumbersOfCards: [5, 5], countAddMenusAsCards: true });
                expect(compareArrays(cards[0].map(card => parseInt(card.id)), [101, 102, 103, 104, NaN])).toBeTruthy();
                expect(compareArrays(cards[1].map(card => parseInt(card.id)), [105, 106, 107, 108, NaN])).toBeTruthy();
                const draggedCard = cards[0][1];
                const dropTarget = cards[1][4];
                await startSubobjectCardDrag(draggedCard);

                // Drop card on another card
                fireEvent.drop(dropTarget);
                fireEvent.dragEnd(draggedCard);

                // Check if dragged subobject's position is updated correctly
                await waitFor(() => {
                    const { column, row } = store.getState().editedObjects[3905].composite.subobjects[102];
                    expect(column).toEqual(1);
                    expect(row).toEqual(4);
                });

                // Check if cards are displayed in the correct positions
                cards = getSubobjectCards(container, { expectedNumbersOfCards: [3, 5] });
                expect(compareArrays(cards[0].map(card => parseInt(card.id)), [101, 103, 104])).toBeTruthy();
                expect(compareArrays(cards[1].map(card => parseInt(card.id)), [105, 106, 107, 108, 102])).toBeTruthy();

                // Check if dragged card is displayed correctly
                expect(cards[1][4].classList.contains("is-dragged")).toBeFalsy();

                // Check if rows are correctly reduced in the first column
                expect(store.getState().editedObjects[3905].composite.subobjects[103].row).toEqual(1);
                expect(store.getState().editedObjects[3905].composite.subobjects[104].row).toEqual(2);
            });
        });


        describe("Four columns at start", () => {
            test("Drag from a column with a single card onto a card in another column", async () => {
                let { container, store } = renderWithWrappers(<Route exact path="/objects/edit/:id"><EditObject /></Route>, {
                    route: "/objects/edit/3906"
                });

                // Wait for object and its subobject(-s) to load
                await waitFor(() => getByText(container, "Object Information"));
                await waitFor(() => expect(Object.keys(store.getState().editedObjects).length).toEqual(7));
                clickDataTabButton(container);

                // Start a card drag and check if it's not displayed (inside `startSubobjectCardDrag`)
                let cards = getSubobjectCards(container, { expectedNumbersOfCards: [2, 1, 2, 1] });
                expect(compareArrays(cards[0].map(card => parseInt(card.id)), [101, 102])).toBeTruthy();
                expect(compareArrays(cards[1].map(card => parseInt(card.id)), [103])).toBeTruthy();
                expect(compareArrays(cards[2].map(card => parseInt(card.id)), [104, 105])).toBeTruthy();
                expect(compareArrays(cards[3].map(card => parseInt(card.id)), [106])).toBeTruthy();
                const draggedCard = cards[1][0];
                const dropTarget = cards[2][1];
                await startSubobjectCardDrag(draggedCard);

                // Drop card on another card
                fireEvent.drop(dropTarget);
                fireEvent.dragEnd(draggedCard);

                // Check if dragged subobject's position is updated correctly
                await waitFor(() => {
                    const { column, row } = store.getState().editedObjects[3906].composite.subobjects[103];
                    expect(column).toEqual(1);
                    expect(row).toEqual(1);
                });

                // Check if subobjects are correctly displayed
                cards = getSubobjectCards(container, { expectedNumbersOfCards: [2, 3, 1] });

                // Check 3rd and 4th column numbers were reduced
                expect(store.getState().editedObjects[3906].composite.subobjects[104].column).toEqual(1);
                expect(store.getState().editedObjects[3906].composite.subobjects[105].column).toEqual(1);
                expect(store.getState().editedObjects[3906].composite.subobjects[106].column).toEqual(2);
            });
        });


        test("Drag from a column with a single card onto right new column dropzone", async () => {
            let { container, store } = renderWithWrappers(<Route exact path="/objects/edit/:id"><EditObject /></Route>, {
                route: "/objects/edit/3906"
            });

            // Wait for object and its subobject(-s) to load
            await waitFor(() => getByText(container, "Object Information"));
            await waitFor(() => expect(Object.keys(store.getState().editedObjects).length).toEqual(7));
            clickDataTabButton(container);

            // Start a card drag and check if it's not displayed (inside `startSubobjectCardDrag`)
            let cards = getSubobjectCards(container, { expectedNumbersOfCards: [2, 1, 2, 1] });
            expect(compareArrays(cards[0].map(card => parseInt(card.id)), [101, 102])).toBeTruthy();
            expect(compareArrays(cards[1].map(card => parseInt(card.id)), [103])).toBeTruthy();
            expect(compareArrays(cards[2].map(card => parseInt(card.id)), [104, 105])).toBeTruthy();
            expect(compareArrays(cards[3].map(card => parseInt(card.id)), [106])).toBeTruthy();
            const draggedCard = cards[1][0];
            await startSubobjectCardDrag(draggedCard);

            // Drop the card on the right new column dropzone
            const columnContainer = getSubobjectGridColumnContainers(container)[3];
            const { rightDropzone } = getNewColumnDropzones(columnContainer);
            fireEvent.drop(rightDropzone);
            fireEvent.dragEnd(draggedCard);

            // Check if dragged subobject's position is updated correctly
            await waitFor(() => {
                const { column, row } = store.getState().editedObjects[3906].composite.subobjects[103];
                expect(column).toEqual(3);
                expect(row).toEqual(0);
            });

            // Check if subobjects are correctly displayed
            cards = getSubobjectCards(container, { expectedNumbersOfCards: [2, 2, 1, 1] });

            // Check 3rd and 4th column numbers were reduced
            expect(store.getState().editedObjects[3906].composite.subobjects[104].column).toEqual(1);
            expect(store.getState().editedObjects[3906].composite.subobjects[105].column).toEqual(1);
            expect(store.getState().editedObjects[3906].composite.subobjects[106].column).toEqual(2);
        });


        test("Drag from a column with a single card onto right new column dropzone", async () => {
            let { container, store } = renderWithWrappers(<Route exact path="/objects/edit/:id"><EditObject /></Route>, {
                route: "/objects/edit/3906"
            });

            // Wait for object and its subobject(-s) to load
            await waitFor(() => getByText(container, "Object Information"));
            await waitFor(() => expect(Object.keys(store.getState().editedObjects).length).toEqual(7));
            clickDataTabButton(container);

            // Start a card drag and check if it's not displayed (inside `startSubobjectCardDrag`)
            let cards = getSubobjectCards(container, { expectedNumbersOfCards: [2, 1, 2, 1] });
            expect(compareArrays(cards[0].map(card => parseInt(card.id)), [101, 102])).toBeTruthy();
            expect(compareArrays(cards[1].map(card => parseInt(card.id)), [103])).toBeTruthy();
            expect(compareArrays(cards[2].map(card => parseInt(card.id)), [104, 105])).toBeTruthy();
            expect(compareArrays(cards[3].map(card => parseInt(card.id)), [106])).toBeTruthy();
            const draggedCard = cards[1][0];
            await startSubobjectCardDrag(draggedCard);

            // Drop the card on the right new column dropzone
            const columnContainer = getSubobjectGridColumnContainers(container)[3];
            const { rightDropzone } = getNewColumnDropzones(columnContainer);
            fireEvent.drop(rightDropzone);
            fireEvent.dragEnd(draggedCard);

            // Check if dragged subobject's position is updated correctly
            await waitFor(() => {
                const { column, row } = store.getState().editedObjects[3906].composite.subobjects[103];
                expect(column).toEqual(3);
                expect(row).toEqual(0);
            });

            // Check if subobjects are correctly displayed
            cards = getSubobjectCards(container, { expectedNumbersOfCards: [2, 2, 1, 1] });

            // Check 3rd and 4th column numbers were reduced
            expect(store.getState().editedObjects[3906].composite.subobjects[104].column).toEqual(1);
            expect(store.getState().editedObjects[3906].composite.subobjects[105].column).toEqual(1);
            expect(store.getState().editedObjects[3906].composite.subobjects[106].column).toEqual(2);
        });


        test("Drag from a column with multiple cards onto a left new column dropzone", async () => {
            let { container, store } = renderWithWrappers(<Route exact path="/objects/edit/:id"><EditObject /></Route>, {
                route: "/objects/edit/3906"
            });

            // Wait for object and its subobject(-s) to load
            await waitFor(() => getByText(container, "Object Information"));
            await waitFor(() => expect(Object.keys(store.getState().editedObjects).length).toEqual(7));
            clickDataTabButton(container);

            // Start a card drag and check if it's not displayed (inside `startSubobjectCardDrag`)
            let cards = getSubobjectCards(container, { expectedNumbersOfCards: [2, 1, 2, 1] });
            expect(compareArrays(cards[0].map(card => parseInt(card.id)), [101, 102])).toBeTruthy();
            expect(compareArrays(cards[1].map(card => parseInt(card.id)), [103])).toBeTruthy();
            expect(compareArrays(cards[2].map(card => parseInt(card.id)), [104, 105])).toBeTruthy();
            expect(compareArrays(cards[3].map(card => parseInt(card.id)), [106])).toBeTruthy();
            const draggedCard = cards[2][0];
            await startSubobjectCardDrag(draggedCard);

            // Drop the card on the left new column dropzone
            const columnContainer = getSubobjectGridColumnContainers(container)[0];
            const { leftDropzone } = getNewColumnDropzones(columnContainer);
            fireEvent.drop(leftDropzone);
            fireEvent.dragEnd(draggedCard);

            // Check if dragged subobject's position is updated correctly
            await waitFor(() => {
                const { column, row } = store.getState().editedObjects[3906].composite.subobjects[104];
                expect(column).toEqual(0);
                expect(row).toEqual(0);
            });

            // Check if subobjects are correctly displayed
            cards = getSubobjectCards(container, { expectedNumbersOfCards: [1, 2, 1, 1, 1] });

            // Check if column numbers to the right are increased
            expect(store.getState().editedObjects[3906].composite.subobjects[101].column).toEqual(1);
            expect(store.getState().editedObjects[3906].composite.subobjects[102].column).toEqual(1);
            expect(store.getState().editedObjects[3906].composite.subobjects[103].column).toEqual(2);
            expect(store.getState().editedObjects[3906].composite.subobjects[105].column).toEqual(3);
            expect(store.getState().editedObjects[3906].composite.subobjects[106].column).toEqual(4);

            // Check if row number in the start column is correctly reduced
            expect(store.getState().editedObjects[3906].composite.subobjects[105].row).toEqual(0);
        });
    });
});
