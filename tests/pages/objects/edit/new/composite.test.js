import React from "react";

import { fireEvent } from "@testing-library/react";
import { getByText, getByPlaceholderText, waitFor, getByTitle } from "@testing-library/dom";

import { resetTestConfig } from "../../../../_mocks/config";
import { checkRenderedItemsOrder } from "../../../../_util/to-do-lists";
import { renderWithWrappers } from "../../../../_util/render";
import { clickDataTabButton, clickGeneralTabButton, getObjectTypeSwitchElements } from "../../../../_util/ui-objects-edit";
import { addANewSubobject, addAnExistingSubobject, getSubobjectCardAttributeElements, getSubobjectCards, getAddSubobjectMenu, getAddSubobjectMenuDropdown,
    clickSubobjectCardAttributeTabButton, clickSubobjectCardDataTabButton, getSubobjectCardMenuButtons, getSubobjectCardTabSelectionButtons, 
    getSubobjectExpandToggleButton } from "../../../../_util/ui-composite";
import { getMarkdownEditorElements, waitForMarkdownHeaderRender } from "../../../../_util/ui-markdown-editor";

import { App } from "../../../../../src/components/top-level/app";
import { enumDeleteModes } from "../../../../../src/store/state-templates/composite-subobjects";


/*
    /objects/edit/new composite object data editing tests.

    NOTE: the following of composite logic and UI are tested in other files:
    - setting and saving object display properties (display.test.js);
    - saving composite objects (general.test.js);
    - indicators & drag and drop (../existing/composite.test.js).
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


describe("Basic load and UI checks", () => {
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
});


describe("Heading (without indicators)", () => {
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
});


describe("Subobject card tabs", () => {
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
});


describe("Subobject card menu buttons", () => {
    describe("New subobject", () => {
        test("Reset button", async () => {
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
            const markdownContainer = secondCard.querySelector(".markdown-editor-container");
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
            expect(secondCard.querySelector(".markdown-editor-container")).toBeTruthy();
            expect(secondCard.querySelector(".markdown-editor-container").querySelector(".edit-page-textarea").value).toEqual(secondMarkdown);

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
    
            // Add an existing subobject
            await addAnExistingSubobject(container, 0, "composite subobject", store, { waitForObjectLoad: true });
            let card = getSubobjectCards(container, { expectedNumbersOfCards: [1] })[0][0];
            const subobjectID = card.id;

            // Open subobject page and add a new subobject
            historyManager.push(`/objects/edit/${subobjectID}`);
            await waitFor(() => getByText(container, "Object Information"));
            // fireEvent.click(getSubobjectCardMenuButtons(card).viewObjectPageButton);
            clickDataTabButton(container);
            const subobjectsBeforeUpdate = Object.keys(store.getState().editedObjects[subobjectID].composite.subobjects).length;
            addANewSubobject(container);
            const newSubSubobjectID = getSubobjectCards(container, { expectedNumbersOfCards: [subobjectsBeforeUpdate + 1] })[0][subobjectsBeforeUpdate].id;
            
            // Return to main object and reset its composite subobject
            historyManager.push("/objects/edit/new");
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
