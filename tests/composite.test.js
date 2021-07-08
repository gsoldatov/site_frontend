import React from "react";
import { Route } from "react-router-dom";

import { fireEvent } from "@testing-library/react";
import { getByText, getByPlaceholderText, waitFor, getByTitle } from "@testing-library/dom";

import { checkRenderedItemsOrder } from "./test-utils/to-do-lists";
import { renderWithWrappers } from "./test-utils/render";
import { getCurrentObject, clickDataTabButton, getObjectTypeSelectingElements, clickGeneralTabButton } from "./test-utils/ui-object";
import { addANewSubobject, addAnExistingSubobject, getSubobjectCardAttributeElements, getSubobjectCards, getAddSubobjectMenu, getAddSubobjectMenuDropdown,
    clickSubobjectCardAttributeTabButton, clickSubobjectCardDataTabButton, getSubobjectCardMenuButtons, getSubobjectCardTabSelectionButtons, 
    getSubobjectCardIndicators, getSubobjectExpandToggleButton } from "./test-utils/ui-composite";
import { getDropdownOptionsContainer, getInlineInputField } from "./test-utils/ui-objects-tags";

import { AddObject, EditObject } from "../src/components/object";
import { enumDeleteModes } from "../src/store/state-templates/composite-subobjects";



/*
    Composite object functionality tests.
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


describe("Basic load and UI checks", () => {
    test("Load a new object and add new subobjects", async () => {
        let { container, store } = renderWithWrappers(<Route exact path="/objects/:id"><AddObject /></Route>, {
            route: "/objects/add"
        });

        // Select composite object type and go to data tab
        const { compositeButton } = getObjectTypeSelectingElements(container);
        fireEvent.click(compositeButton);
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
        let { container, store, history } = renderWithWrappers(<Route exact path="/objects/:id" render={ props => props.match.params.id === "add" ? <AddObject /> : <EditObject /> } />, {
            route: "/objects/add", store
        });

        // Select composite object type and go to data tab
        const { compositeButton } = getObjectTypeSelectingElements(container);
        fireEvent.click(compositeButton);
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
        history.push(`/objects/${subobjectIDs[0]}`);
        // await waitForEditObjectPageLoad(container, store);
        clickGeneralTabButton(container);

        // Check if object name is updated, then update it again
        let nameInput = getByPlaceholderText(container, "Object name");
        expect(nameInput.value).toEqual(firstName);

        firstName = "updated again first subobject";
        fireEvent.change(nameInput, { target: { value: firstName } });

        // Return to composite object page and check if subobject name is displayed correctly;
        history.push(`/objects/add`);
        clickDataTabButton(container);
        cards = getSubobjectCards(container, { expectedNumbersOfCards: [2] });
        expect(getSubobjectCardAttributeElements(cards[0][0]).subobjectNameInput.value).toEqual(firstName);
    });


    test("Close add existing object menu dropdown", async () => {
        let { container } = renderWithWrappers(<Route exact path="/objects/:id"><AddObject /></Route>, {
            route: "/objects/add"
        });

        // Select composite object type and go to data tab
        const { compositeButton } = getObjectTypeSelectingElements(container);
        fireEvent.click(compositeButton);
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
        let { container } = renderWithWrappers(<Route exact path="/objects/:id"><AddObject /></Route>, {
            route: "/objects/add"
        });

        // Select composite object type and go to data tab
        const { compositeButton } = getObjectTypeSelectingElements(container);
        fireEvent.click(compositeButton);
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
        let { container, store } = renderWithWrappers(<Route exact path="/objects/:id"><AddObject /></Route>, {
            route: "/objects/add"
        });

        // Select composite object type and go to data tab
        const { compositeButton } = getObjectTypeSelectingElements(container);
        fireEvent.click(compositeButton);
        clickDataTabButton(container);

        // Add a new subobject
        addANewSubobject(container);
        let card = getSubobjectCards(container, { expectedNumbersOfCards: [1] })[0][0];
        let heading = card.querySelector(".composite-subobjct-card-heading");
        expect(heading).toBeTruthy();

        // Select each object type and check object type icon's title text
        const { linkButton, markdownButton, TDLButton } = getSubobjectCardAttributeElements(card);
        
        fireEvent.click(markdownButton);
        getByTitle(heading, "Markdown");

        fireEvent.click(TDLButton);
        getByTitle(heading, "To-do list");

        fireEvent.click(linkButton);
        getByTitle(heading, "Link");

        // Add an existing composite subobject
        const objectName = "Test composite";
        await addAnExistingSubobject(container, 0, objectName, store, { waitForObjectLoad: true });

        // Check icon title
        card = getSubobjectCards(container, { expectedNumbersOfCards: [2] })[0][1];
        heading = card.querySelector(".composite-subobjct-card-heading");
        getByTitle(heading, "Composite object");
    });


    test("Expand/collapse toggle", async () => {
        let { container, store } = renderWithWrappers(<Route exact path="/objects/:id"><AddObject /></Route>, {
            route: "/objects/add"
        });

        // Select composite object type and go to data tab
        const { compositeButton } = getObjectTypeSelectingElements(container);
        fireEvent.click(compositeButton);
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
        let { container, store } = renderWithWrappers(<Route exact path="/objects/:id"><AddObject /></Route>, {
            route: "/objects/add"
        });

        // Select composite object type and go to data tab
        fireEvent.click(getObjectTypeSelectingElements(container).compositeButton);
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
        let { container, store } = renderWithWrappers(<Route exact path="/objects/:id"><AddObject /></Route>, {
            route: "/objects/add"
        });

        // Select composite object type and go to data tab
        const { compositeButton } = getObjectTypeSelectingElements(container);
        fireEvent.click(compositeButton);
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
        expect(firstCardAttributeElements.linkButton.classList.contains("active")).toBeTruthy();
        expect(firstCardAttributeElements.subobjectNameInput.value).toEqual(firstName);
        expect(firstCardAttributeElements.subobjectNameInput.value).toEqual(store.getState().editedObjects[subobjectID].object_name);
        expect(firstCardAttributeElements.subobjectDescriptionInput.value).toEqual(store.getState().editedObjects[subobjectID].object_description);

        // Check if object type can't be changed
        fireEvent.click(firstCardAttributeElements.TDLButton);
        expect(store.getState().editedObjects[cards[0][0].id].object_type).toEqual("link");

        // Edit name & description and check if they're changed
        const objectName = "some name", objectDescription = "some description";
        fireEvent.change(firstCardAttributeElements.subobjectNameInput, { target: { value: objectName } });
        await waitFor(() => expect(store.getState().editedObjects[subobjectID].object_name).toEqual(objectName));
        fireEvent.change(firstCardAttributeElements.subobjectDescriptionInput, { target: { value: objectDescription } });
        await waitFor(() => expect(store.getState().editedObjects[subobjectID].object_description).toEqual(objectDescription));
    });


    test("New subobjects' data tab", async () => {
        let { container, store } = renderWithWrappers(<Route exact path="/objects/:id"><AddObject /></Route>, {
            route: "/objects/add"
        });

        // Select composite object type and go to data tab
        fireEvent.click(getObjectTypeSelectingElements(container).compositeButton);
        clickDataTabButton(container);

        // Add two new subobjects
        addANewSubobject(container);
        addANewSubobject(container);
        let cards = getSubobjectCards(container, { expectedNumbersOfCards: [2] });
        const card = cards[0][0];
        
        // Select markdown object type, check if data is correctly updated and markdown container is rendered on the data tab
        fireEvent.click(getSubobjectCardAttributeElements(card).markdownButton);
        expect(store.getState().editedObjects[cards[0][0].id].object_type).toEqual("markdown");
        expect(store.getState().editedObjects[cards[0][1].id].object_type).toEqual("link");
        clickSubobjectCardDataTabButton(card);
        expect(card.querySelector(".markdown-container")).toBeTruthy();

        // Select to-do object type and check if to-do list container is rendered on the data tab
        clickSubobjectCardAttributeTabButton(card);
        fireEvent.click(getSubobjectCardAttributeElements(card).TDLButton);
        clickSubobjectCardDataTabButton(card);
        expect(card.querySelector(".to-do-list-container")).toBeTruthy();

        // Select link object type and check if link input is rendered on the data tab
        clickSubobjectCardAttributeTabButton(card);
        fireEvent.click(getSubobjectCardAttributeElements(card).linkButton);
        clickSubobjectCardDataTabButton(card);
        const linkInput = getByPlaceholderText(card, "Link");

        // Edit link value and check if it was updated
        const linkText = "test text";
        fireEvent.change(linkInput, { target: { value: linkText } });
        await waitFor(() => expect(store.getState().editedObjects[cards[0][0].id].link).toEqual(linkText));
    });


    test("Existing subobjects' data tab", async () => {
        let { container, store } = renderWithWrappers(<Route exact path="/objects/:id" render={ props => props.match.params.id === "add" ? <AddObject /> : <EditObject /> } />, {
            route: "/objects/add"
        });

        // Select composite object type and go to data tab
        fireEvent.click(getObjectTypeSelectingElements(container).compositeButton);
        clickDataTabButton(container);

        // Add an existing link object
        await addAnExistingSubobject(container, 0, "link subobject", store, { waitForObjectLoad: true });
        let card = getSubobjectCards(container, { expectedNumbersOfCards: [1] })[0][0];
        expect(getSubobjectCardAttributeElements(card).linkButton.classList.contains("active")).toBeTruthy();

        // Check if link data is displayed
        clickSubobjectCardDataTabButton(card);
        const linkInput = getByPlaceholderText(card, "Link");
        expect(linkInput.value).toEqual(store.getState().editedObjects[card.id].link);
        
        // Edit link value and check if it was updated
        const linkText = "test text";
        fireEvent.change(linkInput, { target: { value: linkText } });
        await waitFor(() => expect(store.getState().editedObjects[card.id].link).toEqual(linkText));

        // Add an existing markdown object
        await addAnExistingSubobject(container, 0, "markdown subobject", store, { waitForObjectLoad: true });
        card = getSubobjectCards(container, { expectedNumbersOfCards: [2] })[0][1];
        expect(getSubobjectCardAttributeElements(card).markdownButton.classList.contains("active")).toBeTruthy();

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
        expect(getSubobjectCardAttributeElements(card).TDLButton.classList.contains("active")).toBeTruthy();

        // Check if to-do list data is displayed
        clickSubobjectCardDataTabButton(card);
        const TDLContainer = card.querySelector(".to-do-list-container");
        expect(TDLContainer).toBeTruthy();
        checkRenderedItemsOrder(TDLContainer, [0, 1, 2, 3, 4, 5, 6, 7]);

        // Add an existing composite object
        await addAnExistingSubobject(container, 0, "composite subobject", store, { waitForObjectLoad: true });
        card = getSubobjectCards(container, { expectedNumbersOfCards: [4] })[0][3];
        expect(getSubobjectCardAttributeElements(card).compositeButton.classList.contains("active")).toBeTruthy();

        // Check if data tab placeholder is displayed
        clickSubobjectCardDataTabButton(card);
        getByText(card, "Object preview unavailable.");

        // Click placeholder link and check if redirect occured
        const subobjectID = card.id;
        const objectPageLink = card.querySelector(".default-object-data-page-link");
        fireEvent.click(objectPageLink);
        clickGeneralTabButton(container);
        const objectNameInput = getByPlaceholderText(container, "Object name");
        expect(objectNameInput.value).toEqual("composite subobject");
    });
});


describe("Subobject card menu buttons", () => {
    describe("New subobject", () => {
        test("Reset button", async () => {
            let { container, store } = renderWithWrappers(<Route exact path="/objects/:id"><AddObject /></Route>, {
                route: "/objects/add"
            });
    
            // Select composite object type and go to data tab
            fireEvent.click(getObjectTypeSelectingElements(container).compositeButton);
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

            fireEvent.click(getSubobjectCardAttributeElements(secondCard).markdownButton);
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
            let { container, store } = renderWithWrappers(<Route exact path="/objects/:id"><AddObject /></Route>, {
                route: "/objects/add"
            });
    
            // Select composite object type and go to data tab
            fireEvent.click(getObjectTypeSelectingElements(container).compositeButton);
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
            let { container, store } = renderWithWrappers(<Route exact path="/objects/:id" render={ props => props.match.params.id === "add" ? <AddObject /> : <EditObject /> } />, {
                route: "/objects/add"
            });
    
            // Select composite object type and go to data tab
            fireEvent.click(getObjectTypeSelectingElements(container).compositeButton);
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
            clickGeneralTabButton(container);
            const nameInput = getByPlaceholderText(container, "Object name");
            expect(nameInput.value).toEqual(objectName);
        });


        test("Reset button (general behaviour)", async () => {
            let { container, store } = renderWithWrappers(<Route exact path="/objects/:id"><AddObject /></Route>, {
                route: "/objects/add"
            });
    
            // Select composite object type and go to data tab
            fireEvent.click(getObjectTypeSelectingElements(container).compositeButton);
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
            await waitFor(() => expect(store.getState().editedObjects[card.id].link).toEqual(linkText));

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
            expect(secondEditedObject.link).toEqual(unchangedEditedObject.link);
        });


        test("Reset button (composite subobject)", async () => {
            let { container, store, history } = renderWithWrappers(<Route exact path="/objects/:id" render={ props => props.match.params.id === "add" ? <AddObject /> : <EditObject /> } />, {
                route: "/objects/add"
            });

            // Select composite object type and go to data tab
            fireEvent.click(getObjectTypeSelectingElements(container).compositeButton);
            clickDataTabButton(container);
    
            // Add an existing subobject
            await addAnExistingSubobject(container, 0, "composite subobject", store, { waitForObjectLoad: true });
            let card = getSubobjectCards(container, { expectedNumbersOfCards: [1] })[0][0];
            const subobjectID = card.id;

            // Open subobject page and add a new subobject
            history.push(`/objects/${subobjectID}`);
            // fireEvent.click(getSubobjectCardMenuButtons(card).viewObjectPageButton);
            clickDataTabButton(container);
            const subobjectsBeforeUpdate = Object.keys(store.getState().editedObjects[subobjectID].composite.subobjects).length;
            addANewSubobject(container);
            const newSubSubobjectID = getSubobjectCards(container, { expectedNumbersOfCards: [subobjectsBeforeUpdate + 1] })[0][subobjectsBeforeUpdate].id;
            
            // Return to main object and reset its composite subobject
            history.push("/objects/add");
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
            let { container, store } = renderWithWrappers(<Route exact path="/objects/:id"><AddObject /></Route>, {
                route: "/objects/add"
            });
    
            // Select composite object type and go to data tab
            fireEvent.click(getObjectTypeSelectingElements(container).compositeButton);
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
            let { container, store } = renderWithWrappers(<Route exact path="/objects/:id"><AddObject /></Route>, {
                route: "/objects/add"
            });
    
            // Select composite object type and go to data tab
            fireEvent.click(getObjectTypeSelectingElements(container).compositeButton);
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
        let { container, store } = renderWithWrappers(<Route exact path="/objects/:id"><EditObject /></Route>, {
            route: "/objects/3001"
        });

        // Wait for object and its subobject to load
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
        let { container, store } = renderWithWrappers(<Route exact path="/objects/:id"><EditObject /></Route>, {
            route: "/objects/3001"
        });

        // Wait for object and its subobject to load
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
        await waitFor(() => expect(store.getState().editedObjects[card.id].link).toEqual(""));
        expect(getSubobjectCardIndicators(card).validationError).toBeTruthy();

        fireEvent.change(linkInput, { target: { value: link } });
        await waitFor(() => expect(store.getState().editedObjects[card.id].link).toEqual(link));
        expect(getSubobjectCardIndicators(card).validationError).toBeFalsy();
    });


    test("Is composite subobject", async () => {
        let { container, store } = renderWithWrappers(<Route exact path="/objects/:id"><EditObject /></Route>, {
            route: "/objects/3001"
        });

        // Wait for object and its subobject to load
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
        let { container, store } = renderWithWrappers(<Route exact path="/objects/:id"><EditObject /></Route>, {
            route: "/objects/3001"
        });

        // Wait for object and its subobject to load
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
        let { container, store, history } = renderWithWrappers(<Route exact path="/objects/:id"><EditObject /></Route>, {
            route: "/objects/3001"
        });

        // Wait for object and its subobject to load
        await waitFor(() => getByText(container, "Object Information"));
        await waitFor(() => expect(store.getState().editedObjects).toHaveProperty(Object.keys(store.getState().editedObjects[3001].composite.subobjects)[0]));
        clickDataTabButton(container);
        
        // Add an existing subobject
        await addAnExistingSubobject(container, 0, "some subobject", store, { waitForObjectLoad: true });
        let cards = getSubobjectCards(container, { expectedNumbersOfCards: [2] });

        expect(getSubobjectCardIndicators(cards[0][0]).isExistingSubobjectWithModifiedTags).toBeFalsy();
        expect(getSubobjectCardIndicators(cards[0][1]).isExistingSubobjectWithModifiedTags).toBeFalsy();

        // Go to first subobject page and add a tag
        history.push(`/objects/${cards[0][0].id}`);
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
        history.push(`/objects/${cards[0][1].id}`);
        clickGeneralTabButton(container);

        let tag = getByText(container, "tag #1");
        fireEvent.click(tag);
        expect(getCurrentObject(store.getState()).removedTagIDs.includes(1)).toBeTruthy();

        // Go to composite object page and check if indicators appeared on both subobjects
        history.push(`/objects/3001`);
        clickDataTabButton(container);

        cards = getSubobjectCards(container, { expectedNumbersOfCards: [2] });
        expect(getSubobjectCardIndicators(cards[0][0]).isExistingSubobjectWithModifiedTags).toBeTruthy();
        expect(getSubobjectCardIndicators(cards[0][1]).isExistingSubobjectWithModifiedTags).toBeTruthy();
    });


    test("Is existing subobject with modified data", async () => {
        let { container, store, } = renderWithWrappers(<Route exact path="/objects/:id"><EditObject /></Route>, {
            route: "/objects/3001"
        });

        // Wait for object and its subobject to load
        await waitFor(() => getByText(container, "Object Information"));
        await waitFor(() => expect(store.getState().editedObjects).toHaveProperty(Object.keys(store.getState().editedObjects[3001].composite.subobjects)[0]));
        clickDataTabButton(container);
        
        // Check if indicator appeared after data is modified
        const card = getSubobjectCards(container, { expectedNumbersOfCards: [1] })[0][0];
        expect(getSubobjectCardIndicators(card).isExistingSubobjectWithModifiedData).toBeFalsy();
        
        clickSubobjectCardDataTabButton(card);
        const linkInput = getByPlaceholderText(card, "Link");
        fireEvent.change(linkInput, { target: { value: "updated value" } });
        await waitFor(() => expect(store.getState().editedObjects[card.id].link).toEqual("updated value"));
        expect(getSubobjectCardIndicators(card).isExistingSubobjectWithModifiedData).toBeTruthy();
    });

   
    test("Is existing subobject with modified parameters", async () => {
        let { container, store } = renderWithWrappers(<Route exact path="/objects/:id"><EditObject /></Route>, {
            route: "/objects/3001"
        });

        // Wait for object and its subobject to load
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
        let { container, store, } = renderWithWrappers(<Route exact path="/objects/:id"><EditObject /></Route>, {
            route: "/objects/3001"
        });

        // Wait for object and its subobject to load
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
        let { container, store, } = renderWithWrappers(<Route exact path="/objects/:id"><EditObject /></Route>, {
            route: "/objects/3001"
        });

        // Wait for object and its subobject to load
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