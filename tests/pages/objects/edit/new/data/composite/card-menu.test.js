import React from "react";

import { fireEvent } from "@testing-library/react";
import { getByText, getByPlaceholderText, waitFor } from "@testing-library/dom";

import { resetTestConfig } from "../../../../../../_mocks/config";
import { renderWithWrappers } from "../../../../../../_util/render";
import { clickDataTabButton, clickGeneralTabButton, getObjectTypeSwitchElements } from "../../../../../../_util/ui-objects-edit";
import { addANewSubobject, addAnExistingSubobject, getSubobjectCardAttributeElements, getSubobjectCards, 
    clickSubobjectCardDataTabButton, getSubobjectCardMenuButtons, getSubobjectCardTabSelectionButtons } from "../../../../../../_util/ui-composite";

import { App } from "../../../../../../../src/components/app";
import { SubobjectDeleteMode } from "../../../../../../../src/types/store/data/composite";


/*
    /objects/edit/new composite object data editing tests, subobject card menu buttons.
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
        expect(store.getState().editedObjects[0].composite.subobjects[firstCard.id].deleteMode).toEqual(SubobjectDeleteMode.subobjectOnly);
        
        // Check if tab selection is disabled
        const { subobjectGeneralTabButton, subobjectDataTabButton } = getSubobjectCardTabSelectionButtons(firstCard);
        expect(subobjectGeneralTabButton.classList.contains("disabled")).toBeTruthy();
        expect(subobjectDataTabButton.classList.contains("disabled")).toBeTruthy();

        // Check if second subobject is not deleted
        expect(store.getState().editedObjects[0].composite.subobjects[secondCard.id].deleteMode).toEqual(SubobjectDeleteMode.none);

        // Restore first subobject
        const { restoreButton } = getSubobjectCardMenuButtons(firstCard);
        expect(restoreButton).toBeTruthy();
        fireEvent.click(restoreButton);

        // Check if first subobject is restored
        expect(getSubobjectCardAttributeElements(firstCard).subobjectDescriptionInput).toBeTruthy();
        expect(store.getState().editedObjects[0].composite.subobjects[firstCard.id].deleteMode).toEqual(SubobjectDeleteMode.none);

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
        expect(store.getState().editedObjects[0].composite.subobjects[card.id].deleteMode).toEqual(SubobjectDeleteMode.subobjectOnly);

        // Click restore button and check if subobject is restored
        fireEvent.click(getSubobjectCardMenuButtons(card).restoreButton);
        expect(store.getState().editedObjects[0].composite.subobjects[card.id].deleteMode).toEqual(SubobjectDeleteMode.none);
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
        expect(store.getState().editedObjects[0].composite.subobjects[card.id].deleteMode).toEqual(SubobjectDeleteMode.full);

        // Click restore button and check if subobject is restored
        fireEvent.click(getSubobjectCardMenuButtons(card).restoreButton);
        expect(store.getState().editedObjects[0].composite.subobjects[card.id].deleteMode).toEqual(SubobjectDeleteMode.none);
    });
});
