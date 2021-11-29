import React from "react";
import { Route } from "react-router-dom";

import { fireEvent } from "@testing-library/react";
import { getByText, getByPlaceholderText, waitFor, getByTitle } from "@testing-library/dom";

import { renderWithWrappers } from "../_util/render";
import { getSideMenuItem } from "../_util/ui-common";
import { getCurrentObject, getObjectTypeSwitchElements, clickDataTabButton, clickDisplayTabButton, 
    getObjectDisplayControls, clickPublishObjectCheckbox, clickPublishSubbjectsCheckbox, clickShowDescriptionCheckbox, clickShowDescriptionAsLinkCheckbox } from "../_util/ui-objects-edit";
import { addANewSubobject, addAnExistingSubobject, clickSubobjectCardDisplayTabButton, getSubobjectCards } from "../_util/ui-composite";

import { NewObject } from "../../src/components/top-level/objects-edit";
import { getMappedSubobjectID, getStoreWithCompositeObjectAndSubobjectsOfEachType } from "../_mocks/data-composite";
import { setEditedObject } from "../../src/actions/objects-edit";


/*
    /objects/edit/:id page tests for new objects' display options.
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


describe("Object display properties toggling & saving", () => {
    test("Link display properties", async () => {
        let { store, container, history } = renderWithWrappers(<Route exact path="/objects/edit/:id"><NewObject /></Route>, {
            route: "/objects/edit/new"
        });

        // Change object name and data
        let objectNameInput = getByPlaceholderText(container, "Object name");
        fireEvent.change(objectNameInput, { target: { value: "new object" } });
        await waitFor(() => expect(getCurrentObject(store.getState()).object_name).toBe("new object"));
    
        clickDataTabButton(container);
        let linkInput = getByPlaceholderText(container, "Link");
        const linkValue = "https://google.com"
        fireEvent.change(linkInput, { target: { value: linkValue } });
        await waitFor(() => expect(getCurrentObject(store.getState()).link.link).toBe(linkValue));
    
        // Open display tab
        clickDisplayTabButton(container);
        const displayControls = getObjectDisplayControls(container);
    
        // Publish object: click checkbox 3 times
        expect(store.getState().editedObjects[0].is_published).toBeFalsy();
        for (let i = 0; i < 3; i++) {
            clickPublishObjectCheckbox(container);
            expect(store.getState().editedObjects[0].is_published).toEqual(i % 2 === 0);
        }

        // Published subobjects: not rendered
        expect(displayControls.publishSubobjects).toBeFalsy();
        
        // Show description: click checkbox 3 times
        expect(store.getState().editedObjects[0].show_description).toBeFalsy();
        for (let i = 0; i < 3; i++) {
            clickShowDescriptionCheckbox(container);
            expect(store.getState().editedObjects[0].show_description).toEqual(i % 2 === 0);
        }

        // Show description as link: click checkbox 3 times
        expect(store.getState().editedObjects[0].link.show_description_as_link).toBeFalsy();
        for (let i = 0; i < 3; i++) {
            clickShowDescriptionAsLinkCheckbox(container);
            expect(store.getState().editedObjects[0].link.show_description_as_link).toEqual(i % 2 === 0);
        }

        // Composite display mode: not rendered
        expect(displayControls.displayMode.selected).toBeFalsy();

        // Save new object and check if display settings are correctly saved
        let saveButton = getSideMenuItem(container, "Save");
        fireEvent.click(saveButton);
        const object_id = 1000; // mock object returned has this id
        await waitFor(() => expect(history.entries[history.length - 1].pathname).toBe(`/objects/edit/${object_id}`));

        const state = store.getState();
        expect(state.objects[object_id].is_published).toBeTruthy();
        expect(state.objects[object_id].show_description).toBeTruthy();
        expect(state.links[object_id].show_description_as_link).toBeTruthy();
    });


    test("Markdown display properties", async () => {
        let { store, container, history } = renderWithWrappers(<Route exact path="/objects/edit/:id"><NewObject /></Route>, {
            route: "/objects/edit/new"
        });

        // Change object type, name and data
        let objectNameInput = getByPlaceholderText(container, "Object name");
        fireEvent.change(objectNameInput, { target: { value: "new object" } });
        await waitFor(() => expect(getCurrentObject(store.getState()).object_name).toBe("new object"));
        const { switchContainer, markdownOption } = getObjectTypeSwitchElements(container);
        fireEvent.click(switchContainer);
        fireEvent.click(markdownOption);
    
        clickDataTabButton(container);
        let editModeButton = getByTitle(container, "Display edit window")
        fireEvent.click(editModeButton);
        let inputForm = getByPlaceholderText(container, "Enter text here...");
        const rawText = "**Test text**";
        fireEvent.change(inputForm, { target: { value: rawText } });
        await waitFor(() => expect(getCurrentObject(store.getState()).markdown.raw_text).toEqual(rawText));
    
        // Open display tab
        clickDisplayTabButton(container);
        const displayControls = getObjectDisplayControls(container);
    
        // Publish object: click checkbox 3 times
        expect(store.getState().editedObjects[0].is_published).toBeFalsy();
        for (let i = 0; i < 3; i++) {
            clickPublishObjectCheckbox(container);
            expect(store.getState().editedObjects[0].is_published).toEqual(i % 2 === 0);
        }

        // Published subobjects: not rendered
        expect(displayControls.publishSubobjects).toBeFalsy();
        
        // Show description: click checkbox 3 times
        expect(store.getState().editedObjects[0].show_description).toBeFalsy();
        for (let i = 0; i < 3; i++) {
            clickShowDescriptionCheckbox(container);
            expect(store.getState().editedObjects[0].show_description).toEqual(i % 2 === 0);
        }

        // Show description as link: not rendered
        expect(displayControls.showDescriptionAsLink).toBeFalsy();

        // Composite display mode: not rendered
        expect(displayControls.displayMode.selected).toBeFalsy();

        // Save new object and check if display settings are correctly saved
        let saveButton = getSideMenuItem(container, "Save");
        fireEvent.click(saveButton);
        const object_id = 1000; // mock object returned has this id
        await waitFor(() => expect(history.entries[history.length - 1].pathname).toBe(`/objects/edit/${object_id}`));

        const state = store.getState();
        expect(state.objects[object_id].is_published).toBeTruthy();
        expect(state.objects[object_id].show_description).toBeTruthy();
    });


    test("To-do list display properties", async () => {
        let { store, container, history } = renderWithWrappers(<Route exact path="/objects/edit/:id"><NewObject /></Route>, {
            route: "/objects/edit/new"
        });

        // Change object type, name and data
        let objectNameInput = getByPlaceholderText(container, "Object name");
        fireEvent.change(objectNameInput, { target: { value: "new object" } });
        await waitFor(() => expect(getCurrentObject(store.getState()).object_name).toBe("new object"));
        const { switchContainer, toDoListOption } = getObjectTypeSwitchElements(container);
        fireEvent.click(switchContainer);
        fireEvent.click(toDoListOption);
    
        clickDataTabButton(container);
        let newItemInput = getByPlaceholderText(container.querySelector(".to-do-list-item-container"), "New item");
        fireEvent.input(newItemInput, { target: { innerHTML: "new value" } });
        await waitFor(() => expect(getCurrentObject(store.getState()).toDoList.items[0].item_text).toBe("new value"));
    
        // Open display tab
        clickDisplayTabButton(container);
        const displayControls = getObjectDisplayControls(container);
    
        // Publish object: click checkbox 3 times
        expect(store.getState().editedObjects[0].is_published).toBeFalsy();
        for (let i = 0; i < 3; i++) {
            clickPublishObjectCheckbox(container);
            expect(store.getState().editedObjects[0].is_published).toEqual(i % 2 === 0);
        }

        // Published subobjects: not rendered
        expect(displayControls.publishSubobjects).toBeFalsy();
        
        // Show description: click checkbox 3 times
        expect(store.getState().editedObjects[0].show_description).toBeFalsy();
        for (let i = 0; i < 3; i++) {
            clickShowDescriptionCheckbox(container);
            expect(store.getState().editedObjects[0].show_description).toEqual(i % 2 === 0);
        }

        // Show description as link: not rendered
        expect(displayControls.showDescriptionAsLink).toBeFalsy();

        // Composite display mode: not rendered
        expect(displayControls.displayMode.selected).toBeFalsy();

        // Save new object and check if display settings are correctly saved
        let saveButton = getSideMenuItem(container, "Save");
        fireEvent.click(saveButton);
        const object_id = 1000; // mock object returned has this id
        await waitFor(() => expect(history.entries[history.length - 1].pathname).toBe(`/objects/edit/${object_id}`));

        const state = store.getState();
        expect(state.objects[object_id].is_published).toBeTruthy();
        expect(state.objects[object_id].show_description).toBeTruthy();
    });


    test("Composite display properties (main object)", async () => {
        let { store, container, history } = renderWithWrappers(<Route exact path="/objects/edit/:id"><NewObject /></Route>, {
            route: "/objects/edit/new"
        });

        // Change object type, name and data
        let objectNameInput = getByPlaceholderText(container, "Object name");
        fireEvent.change(objectNameInput, { target: { value: "new object" } });
        await waitFor(() => expect(getCurrentObject(store.getState()).object_name).toBe("new object"));
        const { switchContainer, compositeOption } = getObjectTypeSwitchElements(container);
        fireEvent.click(switchContainer);
        fireEvent.click(compositeOption);
    
        clickDataTabButton(container);
        await addAnExistingSubobject(container, 0, "first subobject", store, { waitForObjectLoad: true });
        await addAnExistingSubobject(container, 0, "second subobject", store, { waitForObjectLoad: true });
        let cards = getSubobjectCards(container, { expectedNumbersOfCards: [2] });
        const [firstID, secondID] = cards[0].map(card => card.id);
    
        // Open display tab
        clickDisplayTabButton(container);
        const displayControls = getObjectDisplayControls(container);
    
        // Publish object: click checkbox 3 times
        expect(store.getState().editedObjects[0].is_published).toBeFalsy();
        for (let i = 0; i < 3; i++) {
            clickPublishObjectCheckbox(container);
            expect(store.getState().editedObjects[0].is_published).toEqual(i % 2 === 0);
        }

        // Published subobjects: partially published -> fully published -> fully not published -> fully published
        store.dispatch(setEditedObject({ is_published: true }, secondID));
        expect(store.getState().editedObjects[firstID].is_published).toBeFalsy();
        expect(store.getState().editedObjects[secondID].is_published).toBeTruthy();

        clickPublishSubbjectsCheckbox(container);
        expect(store.getState().editedObjects[firstID].is_published).toBeTruthy();
        expect(store.getState().editedObjects[secondID].is_published).toBeTruthy();

        clickPublishSubbjectsCheckbox(container);
        expect(store.getState().editedObjects[firstID].is_published).toBeFalsy();
        expect(store.getState().editedObjects[secondID].is_published).toBeFalsy();

        clickPublishSubbjectsCheckbox(container);
        expect(store.getState().editedObjects[firstID].is_published).toBeTruthy();
        expect(store.getState().editedObjects[secondID].is_published).toBeTruthy();
        
        // Show description: click checkbox 3 times
        expect(store.getState().editedObjects[0].show_description).toBeFalsy();
        for (let i = 0; i < 3; i++) {
            clickShowDescriptionCheckbox(container);
            expect(store.getState().editedObjects[0].show_description).toEqual(i % 2 === 0);
        }

        // Show description as link: not rendered
        expect(displayControls.showDescriptionAsLink).toBeFalsy();

        // Composite display mode: is rendered and eqaul "Basic" by default
        expect(displayControls.displayMode.selected.textContent).toEqual("Basic");

        // Save new object and check if display settings are correctly saved
        let saveButton = getSideMenuItem(container, "Save");
        fireEvent.click(saveButton);
        const object_id = 1000; // mock object returned has this id
        await waitFor(() => expect(history.entries[history.length - 1].pathname).toBe(`/objects/edit/${object_id}`));

        const state = store.getState();
        expect(state.objects[object_id].is_published).toBeTruthy();
        expect(state.objects[object_id].show_description).toBeTruthy();

        expect(state.objects[firstID].is_published).toBeTruthy();
        expect(state.objects[secondID].is_published).toBeTruthy();
    });
});


describe("Composite subobject display properties", () => {
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


    test("Link subobject display properties", async () => {
        const store = getStoreWithCompositeObjectAndSubobjectsOfEachType(true, true);
        let { container, history } = renderWithWrappers(<Route exact path="/objects/edit/:id"><NewObject /></Route>, {
            route: "/objects/edit/new",
            store
        });

        // Check data and get subobject id and card
        clickDataTabButton(container);
        let cards = getSubobjectCards(container, { expectedNumbersOfCards: [4] });
        const subobjectID = cards[0].map(card => card.id)[0];
        expect(store.getState().editedObjects[subobjectID].object_type).toEqual("link");
        const subobjectCard = cards[0][0];

        // Wait for composite subobject card to load
        await waitFor(() => getByText(cards[0][3], "Object Name"));
        
        // Click on tested subobject's card display tab
        clickSubobjectCardDisplayTabButton(subobjectCard);
        const displayControls = getObjectDisplayControls(subobjectCard);

        // Publish object: click checkbox 3 times
        expect(store.getState().editedObjects[subobjectID].is_published).toBeFalsy();
        for (let i = 0; i < 3; i++) {
            clickPublishObjectCheckbox(subobjectCard);
            expect(store.getState().editedObjects[subobjectID].is_published).toEqual(i % 2 === 0);
        }

        // Published subobjects: not rendered
        expect(displayControls.publishSubobjects).toBeFalsy();
        
        // Show description: not rendered
        expect(displayControls.showDescription).toBeFalsy();

        // Show description composite: inherit => no => inherit => yes
        expect(displayControls.showDescriptionComposite.selected.textContent).toEqual("Inherit");
        
        fireEvent.click(displayControls.showDescriptionComposite.selected);
        fireEvent.click(displayControls.showDescriptionComposite.options.no);
        expect(displayControls.showDescriptionComposite.selected.textContent).toEqual("No");

        fireEvent.click(displayControls.showDescriptionComposite.selected);
        fireEvent.click(displayControls.showDescriptionComposite.options.inherit);
        expect(displayControls.showDescriptionComposite.selected.textContent).toEqual("Inherit");

        fireEvent.click(displayControls.showDescriptionComposite.selected);
        fireEvent.click(displayControls.showDescriptionComposite.options.yes);
        expect(displayControls.showDescriptionComposite.selected.textContent).toEqual("Yes");

        // Show description as link: not rendered
        expect(displayControls.showDescriptionAsLink).toBeFalsy();

        // Show description as link composite: inherit => no => inherit => yes
        expect(displayControls.showDescriptionAsLinkComposite.selected.textContent).toEqual("Inherit");
        
        fireEvent.click(displayControls.showDescriptionAsLinkComposite.selected);
        fireEvent.click(displayControls.showDescriptionAsLinkComposite.options.no);
        expect(displayControls.showDescriptionAsLinkComposite.selected.textContent).toEqual("No");

        fireEvent.click(displayControls.showDescriptionAsLinkComposite.selected);
        fireEvent.click(displayControls.showDescriptionAsLinkComposite.options.inherit);
        expect(displayControls.showDescriptionAsLinkComposite.selected.textContent).toEqual("Inherit");

        fireEvent.click(displayControls.showDescriptionAsLinkComposite.selected);
        fireEvent.click(displayControls.showDescriptionAsLinkComposite.options.yes);
        expect(displayControls.showDescriptionAsLinkComposite.selected.textContent).toEqual("Yes");

        // Composite display mode: not rendered
        expect(displayControls.displayMode.selected).toBeFalsy();

        // Save new object and check if display settings are correctly saved
        let saveButton = getSideMenuItem(container, "Save");
        fireEvent.click(saveButton);
        const object_id = 1000; // mock object returned has this id
        await waitFor(() => expect(history.entries[history.length - 1].pathname).toBe(`/objects/edit/${object_id}`));

        const state = store.getState();
        
        const mappedSubobjectID = getMappedSubobjectID(subobjectID, "link");
        expect(state.objects[mappedSubobjectID].is_published).toBeTruthy();
        expect(state.composite[object_id].subobjects[mappedSubobjectID].show_description_composite).toEqual("yes");
        expect(state.composite[object_id].subobjects[mappedSubobjectID].show_description_as_link_composite).toEqual("yes");
    });


    test("Markdown subobject display properties", async () => {
        const store = getStoreWithCompositeObjectAndSubobjectsOfEachType(true, true);
        let { container, history } = renderWithWrappers(<Route exact path="/objects/edit/:id"><NewObject /></Route>, {
            route: "/objects/edit/new",
            store
        });

        // Check data and get subobject id and card
        clickDataTabButton(container);
        let cards = getSubobjectCards(container, { expectedNumbersOfCards: [4] });
        const subobjectID = cards[0].map(card => card.id)[1];
        expect(store.getState().editedObjects[subobjectID].object_type).toEqual("markdown");
        const subobjectCard = cards[0][1];

        // Wait for composite subobject card to load
        await waitFor(() => getByText(cards[0][3], "Object Name"));
        
        // Click on tested subobject's card display tab
        clickSubobjectCardDisplayTabButton(subobjectCard);
        const displayControls = getObjectDisplayControls(subobjectCard);

        // Publish object: click checkbox 3 times
        expect(store.getState().editedObjects[subobjectID].is_published).toBeFalsy();
        for (let i = 0; i < 3; i++) {
            clickPublishObjectCheckbox(subobjectCard);
            expect(store.getState().editedObjects[subobjectID].is_published).toEqual(i % 2 === 0);
        }

        // Published subobjects: not rendered
        expect(displayControls.publishSubobjects).toBeFalsy();
        
        // Show description: not rendered
        expect(displayControls.showDescription).toBeFalsy();

        // Show description composite: inherit => no => inherit => yes
        expect(displayControls.showDescriptionComposite.selected.textContent).toEqual("Inherit");
        
        fireEvent.click(displayControls.showDescriptionComposite.selected);
        fireEvent.click(displayControls.showDescriptionComposite.options.no);
        expect(displayControls.showDescriptionComposite.selected.textContent).toEqual("No");

        fireEvent.click(displayControls.showDescriptionComposite.selected);
        fireEvent.click(displayControls.showDescriptionComposite.options.inherit);
        expect(displayControls.showDescriptionComposite.selected.textContent).toEqual("Inherit");

        fireEvent.click(displayControls.showDescriptionComposite.selected);
        fireEvent.click(displayControls.showDescriptionComposite.options.yes);
        expect(displayControls.showDescriptionComposite.selected.textContent).toEqual("Yes");

        // Show description as link: not rendered
        expect(displayControls.showDescriptionAsLink).toBeFalsy();

        // Show description as link composite: not rendered
        expect(displayControls.showDescriptionAsLinkComposite.selected).toBeFalsy();

        // Composite display mode: not rendered
        expect(displayControls.displayMode.selected).toBeFalsy();

        // Save new object and check if display settings are correctly saved
        let saveButton = getSideMenuItem(container, "Save");
        fireEvent.click(saveButton);
        const object_id = 1000; // mock object returned has this id
        await waitFor(() => expect(history.entries[history.length - 1].pathname).toBe(`/objects/edit/${object_id}`));

        const state = store.getState();
        
        const mappedSubobjectID = getMappedSubobjectID(subobjectID, "markdown");
        expect(state.objects[mappedSubobjectID].is_published).toBeTruthy();
        expect(state.composite[object_id].subobjects[mappedSubobjectID].show_description_composite).toEqual("yes");
        expect(state.composite[object_id].subobjects[mappedSubobjectID].show_description_as_link_composite).toEqual("inherit");
    });


    test("To-do list subobject display properties", async () => {
        const store = getStoreWithCompositeObjectAndSubobjectsOfEachType(true, true);
        let { container, history } = renderWithWrappers(<Route exact path="/objects/edit/:id"><NewObject /></Route>, {
            route: "/objects/edit/new",
            store
        });

        // Check data and get subobject id and card
        clickDataTabButton(container);
        let cards = getSubobjectCards(container, { expectedNumbersOfCards: [4] });
        const subobjectID = cards[0].map(card => card.id)[2];
        expect(store.getState().editedObjects[subobjectID].object_type).toEqual("to_do_list");
        const subobjectCard = cards[0][2];

        // Wait for composite subobject card to load
        await waitFor(() => getByText(cards[0][3], "Object Name"));
        
        // Click on tested subobject's card display tab
        clickSubobjectCardDisplayTabButton(subobjectCard);
        const displayControls = getObjectDisplayControls(subobjectCard);

        // Publish object: click checkbox 3 times
        expect(store.getState().editedObjects[subobjectID].is_published).toBeFalsy();
        for (let i = 0; i < 3; i++) {
            clickPublishObjectCheckbox(subobjectCard);
            expect(store.getState().editedObjects[subobjectID].is_published).toEqual(i % 2 === 0);
        }

        // Published subobjects: not rendered
        expect(displayControls.publishSubobjects).toBeFalsy();
        
        // Show description: not rendered
        expect(displayControls.showDescription).toBeFalsy();

        // Show description composite: inherit => no => inherit => yes
        expect(displayControls.showDescriptionComposite.selected.textContent).toEqual("Inherit");
        
        fireEvent.click(displayControls.showDescriptionComposite.selected);
        fireEvent.click(displayControls.showDescriptionComposite.options.no);
        expect(displayControls.showDescriptionComposite.selected.textContent).toEqual("No");

        fireEvent.click(displayControls.showDescriptionComposite.selected);
        fireEvent.click(displayControls.showDescriptionComposite.options.inherit);
        expect(displayControls.showDescriptionComposite.selected.textContent).toEqual("Inherit");

        fireEvent.click(displayControls.showDescriptionComposite.selected);
        fireEvent.click(displayControls.showDescriptionComposite.options.yes);
        expect(displayControls.showDescriptionComposite.selected.textContent).toEqual("Yes");

        // Show description as link: not rendered
        expect(displayControls.showDescriptionAsLink).toBeFalsy();

        // Show description as link composite: not rendered
        expect(displayControls.showDescriptionAsLinkComposite.selected).toBeFalsy();

        // Composite display mode: not rendered
        expect(displayControls.displayMode.selected).toBeFalsy();

        // Save new object and check if display settings are correctly saved
        let saveButton = getSideMenuItem(container, "Save");
        fireEvent.click(saveButton);
        const object_id = 1000; // mock object returned has this id
        await waitFor(() => expect(history.entries[history.length - 1].pathname).toBe(`/objects/edit/${object_id}`));

        const state = store.getState();
        
        const mappedSubobjectID = getMappedSubobjectID(subobjectID, "to_do_list");
        expect(state.objects[mappedSubobjectID].is_published).toBeTruthy();
        expect(state.composite[object_id].subobjects[mappedSubobjectID].show_description_composite).toEqual("yes");
        expect(state.composite[object_id].subobjects[mappedSubobjectID].show_description_as_link_composite).toEqual("inherit");
    });


    test("Composite subobject display properties", async () => {
        const store = getStoreWithCompositeObjectAndSubobjectsOfEachType(true, true);
        let { container, history } = renderWithWrappers(<Route exact path="/objects/edit/:id"><NewObject /></Route>, {
            route: "/objects/edit/new",
            store
        });

        // Check data and get subobject id and card
        clickDataTabButton(container);
        let cards = getSubobjectCards(container, { expectedNumbersOfCards: [4] });
        const subobjectID = cards[0].map(card => card.id)[3];
        expect(store.getState().editedObjects[subobjectID].object_type).toEqual("composite");
        const subobjectCard = cards[0][3];

        // Wait for composite subobject card to load
        await waitFor(() => getByText(cards[0][3], "Object Name"));
        
        // Click on tested subobject's card display tab
        clickSubobjectCardDisplayTabButton(subobjectCard);
        const displayControls = getObjectDisplayControls(subobjectCard);

        // Publish object: not rendered (because it won't be saved with the parent object)
        expect(displayControls.publishObject).toBeFalsy();

        // Published subobjects: not rendered
        expect(displayControls.publishSubobjects).toBeFalsy();
        
        // Show description: not rendered
        expect(displayControls.showDescription).toBeFalsy();

        // Show description composite: inherit => no => inherit => yes
        expect(displayControls.showDescriptionComposite.selected.textContent).toEqual("Inherit");
        
        fireEvent.click(displayControls.showDescriptionComposite.selected);
        fireEvent.click(displayControls.showDescriptionComposite.options.no);
        expect(displayControls.showDescriptionComposite.selected.textContent).toEqual("No");

        fireEvent.click(displayControls.showDescriptionComposite.selected);
        fireEvent.click(displayControls.showDescriptionComposite.options.inherit);
        expect(displayControls.showDescriptionComposite.selected.textContent).toEqual("Inherit");

        fireEvent.click(displayControls.showDescriptionComposite.selected);
        fireEvent.click(displayControls.showDescriptionComposite.options.yes);
        expect(displayControls.showDescriptionComposite.selected.textContent).toEqual("Yes");

        // Show description as link: not rendered
        expect(displayControls.showDescriptionAsLink).toBeFalsy();

        // Show description as link composite: not rendered
        expect(displayControls.showDescriptionAsLinkComposite.selected).toBeFalsy();

        // Composite display mode: not rendered
        expect(displayControls.displayMode.selected).toBeFalsy();

        // Save new object and check if display settings are correctly saved
        let saveButton = getSideMenuItem(container, "Save");
        fireEvent.click(saveButton);
        const object_id = 1000; // mock object returned has this id
        await waitFor(() => expect(history.entries[history.length - 1].pathname).toBe(`/objects/edit/${object_id}`));

        const state = store.getState();
        expect(state.composite[object_id].subobjects[subobjectID].show_description_composite).toEqual("yes");
        expect(state.composite[object_id].subobjects[subobjectID].show_description_as_link_composite).toEqual("inherit");
    });
});
