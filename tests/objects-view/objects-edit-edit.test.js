import React from "react";
import { Route } from "react-router-dom";

import { fireEvent } from "@testing-library/react";
import { getByText, waitFor} from "@testing-library/dom";

import { renderWithWrappers } from "../_util/render";
import { getSideMenuItem } from "../_util/ui-common";
import { clickDataTabButton, clickDisplayTabButton, getObjectDisplayControls, clickPublishObjectCheckbox, 
    clickPublishSubbjectsCheckbox, clickShowDescriptionCheckbox, clickShowDescriptionAsLinkCheckbox } from "../_util/ui-objects-edit";
import { clickSubobjectCardDisplayTabButton, getSubobjectCards } from "../_util/ui-composite";

import { getStoreWithCompositeObjectAndSubobjectsOfEachType } from "../_mocks/data-composite";

import { EditObject } from "../../src/components/top-level/objects-edit";
import { setEditedObject } from "../../src/actions/objects-edit";


/*
    /objects/edit/:id page tests for existing objects' display options.
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
        let { store, container } = renderWithWrappers(<Route exact path="/objects/edit/:id"><EditObject /></Route>, {
            route: "/objects/edit/1"
        });
    
        // Wait for the page to load and open display tab
        await waitFor(() => getByText(container, "Object Information"));
        clickDisplayTabButton(container);
        const displayControls = getObjectDisplayControls(container);
    
        // Publish object: click checkbox 3 times
        expect(store.getState().editedObjects[1].is_published).toBeFalsy();
        for (let i = 0; i < 3; i++) {
            clickPublishObjectCheckbox(container);
            expect(store.getState().editedObjects[1].is_published).toEqual(i % 2 === 0);
        }

        // Published subobjects: not rendered
        expect(displayControls.publishSubobjects).toBeFalsy();
        
        // Show description: click checkbox 3 times
        expect(store.getState().editedObjects[1].show_description).toBeFalsy();
        for (let i = 0; i < 3; i++) {
            clickShowDescriptionCheckbox(container);
            expect(store.getState().editedObjects[1].show_description).toEqual(i % 2 === 0);
        }

        // Show description as link: click checkbox 3 times
        expect(store.getState().editedObjects[1].link.show_description_as_link).toBeFalsy();
        for (let i = 0; i < 3; i++) {
            clickShowDescriptionAsLinkCheckbox(container);
            expect(store.getState().editedObjects[1].link.show_description_as_link).toEqual(i % 2 === 0);
        }

        // Composite display mode: not rendered
        expect(displayControls.displayMode.selected).toBeFalsy();

        // Update object and check if display settings are correctly saved
        let saveButton = getSideMenuItem(container, "Save");
        fireEvent.click(saveButton);
        await waitFor(() => expect(store.getState().objects[1].is_published).toBeTruthy());

        const state = store.getState();
        expect(state.objects[1].show_description).toBeTruthy();
        expect(state.links[1].show_description_as_link).toBeTruthy();
    });


    test("Markdown display properties", async () => {
        let { store, container } = renderWithWrappers(<Route exact path="/objects/edit/:id"><EditObject /></Route>, {
            route: "/objects/edit/1001"
        });
    
        // Wait for the page to load and open display tab
        await waitFor(() => getByText(container, "Object Information"));
        clickDisplayTabButton(container);
        const displayControls = getObjectDisplayControls(container);
    
        // Publish object: click checkbox 3 times
        expect(store.getState().editedObjects[1001].is_published).toBeFalsy();
        for (let i = 0; i < 3; i++) {
            clickPublishObjectCheckbox(container);
            expect(store.getState().editedObjects[1001].is_published).toEqual(i % 2 === 0);
        }

        // Published subobjects: not rendered
        expect(displayControls.publishSubobjects).toBeFalsy();
        
        // Show description: click checkbox 3 times
        expect(store.getState().editedObjects[1001].show_description).toBeFalsy();
        for (let i = 0; i < 3; i++) {
            clickShowDescriptionCheckbox(container);
            expect(store.getState().editedObjects[1001].show_description).toEqual(i % 2 === 0);
        }

        // Show description as link: not rendered
        expect(displayControls.showDescriptionAsLink).toBeFalsy();

        // Composite display mode: not rendered
        expect(displayControls.displayMode.selected).toBeFalsy();

        // Update object and check if display settings are correctly saved
        let saveButton = getSideMenuItem(container, "Save");
        fireEvent.click(saveButton);
        await waitFor(() => expect(store.getState().objects[1001].is_published).toBeTruthy());

        const state = store.getState();
        expect(state.objects[1001].show_description).toBeTruthy();
    });


    test("To-do list display properties", async () => {
        let { store, container } = renderWithWrappers(<Route exact path="/objects/edit/:id"><EditObject /></Route>, {
            route: "/objects/edit/2001"
        });
    
        // Wait for the page to load and open display tab
        await waitFor(() => getByText(container, "Object Information"));
        clickDisplayTabButton(container);
        const displayControls = getObjectDisplayControls(container);
    
        // Publish object: click checkbox 3 times
        expect(store.getState().editedObjects[2001].is_published).toBeFalsy();
        for (let i = 0; i < 3; i++) {
            clickPublishObjectCheckbox(container);
            expect(store.getState().editedObjects[2001].is_published).toEqual(i % 2 === 0);
        }

        // Published subobjects: not rendered
        expect(displayControls.publishSubobjects).toBeFalsy();
        
        // Show description: click checkbox 3 times
        expect(store.getState().editedObjects[2001].show_description).toBeFalsy();
        for (let i = 0; i < 3; i++) {
            clickShowDescriptionCheckbox(container);
            expect(store.getState().editedObjects[2001].show_description).toEqual(i % 2 === 0);
        }

        // Show description as link: not rendered
        expect(displayControls.showDescriptionAsLink).toBeFalsy();

        // Composite display mode: not rendered
        expect(displayControls.displayMode.selected).toBeFalsy();

        // Update object and check if display settings are correctly saved
        let saveButton = getSideMenuItem(container, "Save");
        fireEvent.click(saveButton);
        await waitFor(() => expect(store.getState().objects[2001].is_published).toBeTruthy());

        const state = store.getState();
        expect(state.objects[2001].show_description).toBeTruthy();
    });


    test("Composite display properties (main object)", async () => {
        let { store, container } = renderWithWrappers(<Route exact path="/objects/edit/:id"><EditObject /></Route>, {
            route: "/objects/edit/3901"
        });
    
        // Wait for the page to load
        await waitFor(() => getByText(container, "Object Information"));
        clickDataTabButton(container);
        let cards = getSubobjectCards(container, { expectedNumbersOfCards: [4] });
        const subobjectIDs = cards[0].map(card => card.id);
    
        // Open display tab
        clickDisplayTabButton(container);
        const displayControls = getObjectDisplayControls(container);
    
        // Publish object: click checkbox 3 times
        expect(store.getState().editedObjects[3901].is_published).toBeFalsy();
        for (let i = 0; i < 3; i++) {
            clickPublishObjectCheckbox(container);
            expect(store.getState().editedObjects[3901].is_published).toEqual(i % 2 === 0);
        }

        // Published subobjects: partially published -> fully published -> fully not published -> fully published
        store.dispatch(setEditedObject({ is_published: true }, subobjectIDs[3]));
        for (let i = 0; i <= 2; i++) expect(store.getState().editedObjects[subobjectIDs[i]].is_published).toBeFalsy();
        expect(store.getState().editedObjects[subobjectIDs[3]].is_published).toBeTruthy();

        clickPublishSubbjectsCheckbox(container);
        for (let i = 0; i <= 3; i++) expect(store.getState().editedObjects[subobjectIDs[i]].is_published).toBeTruthy();

        clickPublishSubbjectsCheckbox(container);
        for (let i = 0; i <= 3; i++) expect(store.getState().editedObjects[subobjectIDs[i]].is_published).toBeFalsy();

        clickPublishSubbjectsCheckbox(container);
        for (let i = 0; i <= 3; i++) expect(store.getState().editedObjects[subobjectIDs[i]].is_published).toBeTruthy();
        
        // Show description: click checkbox 3 times
        expect(store.getState().editedObjects[3901].show_description).toBeFalsy();
        for (let i = 0; i < 3; i++) {
            clickShowDescriptionCheckbox(container);
            expect(store.getState().editedObjects[3901].show_description).toEqual(i % 2 === 0);
        }

        // Show description as link: not rendered
        expect(displayControls.showDescriptionAsLink).toBeFalsy();

        // Composite display mode: is rendered and eqaul "Basic" by default
        expect(displayControls.displayMode.selected.textContent).toEqual("Basic");

        // Update object and check if display settings are correctly saved
        let saveButton = getSideMenuItem(container, "Save");
        fireEvent.click(saveButton);
        await waitFor(() => expect(store.getState().objects[3901].is_published).toBeTruthy());

        const state = store.getState();
        expect(state.objects[3901].show_description).toBeTruthy();
        for (let i = 0; i <= 2; i++) expect(state.editedObjects[subobjectIDs[i]].is_published).toBeTruthy();     // NOTE: composite subobject is not checked, as it's considered no to be updated
    });
});


describe("Composite subobject display properties", () => {
    test("Link subobject display properties", async () => {
        const store = getStoreWithCompositeObjectAndSubobjectsOfEachType();
        let { container } = renderWithWrappers(<Route exact path="/objects/edit/:id"><EditObject /></Route>, {
            route: "/objects/edit/3201",
            store
        });

        // Wait for the page to load
        await waitFor(() => getByText(container, "Object Information"));

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

        // Update object and check if display settings are correctly saved
        let saveButton = getSideMenuItem(container, "Save");
        fireEvent.click(saveButton);

        await waitFor(() => expect(store.getState().objects[subobjectID].is_published).toBeTruthy());

        const state = store.getState();
        expect(state.composite[3201].subobjects[subobjectID].show_description_composite).toEqual("yes");
        expect(state.composite[3201].subobjects[subobjectID].show_description_as_link_composite).toEqual("yes");
    });


    test("Markdown subobject display properties", async () => {
        const store = getStoreWithCompositeObjectAndSubobjectsOfEachType();
        let { container } = renderWithWrappers(<Route exact path="/objects/edit/:id"><EditObject /></Route>, {
            route: "/objects/edit/3201",
            store
        });

        // Wait for the page to load
        await waitFor(() => getByText(container, "Object Information"));

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

        // Update object and check if display settings are correctly saved
        let saveButton = getSideMenuItem(container, "Save");
        fireEvent.click(saveButton);

        await waitFor(() => expect(store.getState().objects[subobjectID].is_published).toBeTruthy());

        const state = store.getState();
        expect(state.composite[3201].subobjects[subobjectID].show_description_composite).toEqual("yes");
    });


    test("To-do list subobject display properties", async () => {
        const store = getStoreWithCompositeObjectAndSubobjectsOfEachType();
        let { container } = renderWithWrappers(<Route exact path="/objects/edit/:id"><EditObject /></Route>, {
            route: "/objects/edit/3201",
            store
        });

        // Wait for the page to load
        await waitFor(() => getByText(container, "Object Information"));

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

        // Update object and check if display settings are correctly saved
        let saveButton = getSideMenuItem(container, "Save");
        fireEvent.click(saveButton);

        await waitFor(() => expect(store.getState().objects[subobjectID].is_published).toBeTruthy());

        const state = store.getState();
        expect(state.composite[3201].subobjects[subobjectID].show_description_composite).toEqual("yes");
    });


    test("Composite subobject display properties", async () => {
        const store = getStoreWithCompositeObjectAndSubobjectsOfEachType();
        let { container } = renderWithWrappers(<Route exact path="/objects/edit/:id"><EditObject /></Route>, {
            route: "/objects/edit/3201",
            store
        });

        // Wait for the page to load
        await waitFor(() => getByText(container, "Object Information"));

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

        // Update object and check if display settings are correctly saved
        let saveButton = getSideMenuItem(container, "Save");
        fireEvent.click(saveButton);

        await waitFor(() => expect(store.getState().composite[3201].subobjects[subobjectID].show_description_composite).toEqual("yes"));
    });
});
