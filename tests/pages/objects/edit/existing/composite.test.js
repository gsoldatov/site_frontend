import React from "react";

import { fireEvent } from "@testing-library/react";
import { getByText, getByPlaceholderText, waitFor, getByTitle } from "@testing-library/dom";

import { resetTestConfig } from "../../../../_mocks/config";
import { compareArrays } from "../../../../_util/data-checks";
import { renderWithWrappers } from "../../../../_util/render";
import { getCurrentObject, clickDataTabButton, clickGeneralTabButton } from "../../../../_util/ui-objects-edit";
import { addANewSubobject, addAnExistingSubobject, getSubobjectCardAttributeElements, getSubobjectCards, clickSubobjectCardAttributeTabButton, 
    clickSubobjectCardDataTabButton, getSubobjectCardMenuButtons, getSubobjectCardIndicators, getSubobjectExpandToggleButton, 
    startSubobjectCardDrag, getSubobjectGridColumnContainers, getNewColumnDropzones } from "../../../../_util/ui-composite";
import { getDropdownOptionsContainer, getInlineInputField } from "../../../../_util/ui-objects-tags";
import { getInlineItem } from "../../../../_util/ui-inline";

import { App } from "../../../../../src/components/top-level/app";


/*
    /objects/edit/:id composite object data editing tests.

    NOTE: the following of composite logic and UI are tested in other files:
    - setting and saving object display properties (display.test.js);
    - saving composite objects (general.test.js);
    - most of the functionality present both for new & existing object data is tested in ../new/composite.test.js.
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


describe("Indicators", () => {
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
        await waitFor(() => expect(store.getState().objectUI.tagsInput.matchingIDs.length).toEqual(10));
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
});


describe("Drag and drop", () => {
    describe("Card drag and drop enabling and disabling", () => {
        test("Try to drag a card without hovering over its heading", async () => {
            let { container, store } = renderWithWrappers(<App />, {
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
            let { container, store } = renderWithWrappers(<App />, {
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
            let { container, store } = renderWithWrappers(<App />, {
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
                let { container, store } = renderWithWrappers(<App />, {
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
                let { container, store } = renderWithWrappers(<App />, {
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
                let { container, store } = renderWithWrappers(<App />, {
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
                let { container, store } = renderWithWrappers(<App />, {
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
                let { container, store } = renderWithWrappers(<App />, {
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
                let { container, store } = renderWithWrappers(<App />, {
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
                let { container, store } = renderWithWrappers(<App />, {
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
                let { container, store } = renderWithWrappers(<App />, {
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
                let { container, store } = renderWithWrappers(<App />, {
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
                let { container, store } = renderWithWrappers(<App />, {
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
                let { container, store } = renderWithWrappers(<App />, {
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
                let { container, store } = renderWithWrappers(<App />, {
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
                let { container, store } = renderWithWrappers(<App />, {
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
            let { container, store } = renderWithWrappers(<App />, {
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
            let { container, store } = renderWithWrappers(<App />, {
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
            let { container, store } = renderWithWrappers(<App />, {
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
