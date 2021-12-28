import React from "react";

import { fireEvent } from "@testing-library/react";
import { getByText, waitFor } from "@testing-library/dom";

import { renderWithWrappers } from "../_util/render";
import { getSideMenuItem } from "../_util/ui-common";
import { clickDataTabButton, clickDisplayTabButton, getObjectDisplayControls, clickPublishObjectCheckbox, 
    clickPublishSubbjectsCheckbox, clickDisplayInFeedCheckbox, clickShowDescriptionCheckbox, clickShowDescriptionAsLinkCheckbox, 
    resetObject, fillRequiredAttributesAndData, setObjectType, setFeedTimestampDate } from "../_util/ui-objects-edit";
import { addANewSubobject, clickSubobjectCardDisplayTabButton, getSubobjectCards, resetSubobject } from "../_util/ui-composite";

import { App } from "../../src/components/top-level/app";
import { getMappedSubobjectID, getStoreWithCompositeObjectAndSubobjectsOfEachType } from "../_mocks/data-composite";
import { setEditedObject } from "../../src/actions/objects-edit";
import { getReactDatetimeElements } from "../_util/ui-react-datetime";



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


describe("Object display properties", () => {
    describe("Publish object", () => {
        test("Link, markdown, to-do list, composite: default value, toggle & reset", async () => {
            let { store, container } = renderWithWrappers(<App />, {
                route: "/objects/edit/new"
            });

            for (let objectType of ["link", "markdown", "to_do_list", "composite"]) {
                // Set object type
                setObjectType(container, objectType);

                // Open display tab
                clickDisplayTabButton(container);
            
                // Click checkbox 3 times
                expect(store.getState().editedObjects[0].is_published).toBeFalsy();
                for (let i = 0; i < 3; i++) {
                    clickPublishObjectCheckbox(container);
                    expect(store.getState().editedObjects[0].is_published).toEqual(i % 2 === 0);
                }

                // Reset object
                resetObject(container, false);
                expect(store.getState().editedObjects[0].is_published).toBeFalsy();
            }
        });


        test("Link: save", async () => {
            let { store, container, history } = renderWithWrappers(<App />, {
                route: "/objects/edit/new"
            });

            // Fill required attributes & data
            await fillRequiredAttributesAndData(container, store, { objectType: "link" });

            // Toggle checkbox
            clickDisplayTabButton(container);
            clickPublishObjectCheckbox(container);
            expect(store.getState().editedObjects[0].is_published).toBeTruthy();

            // Save object
            let saveButton = getSideMenuItem(container, "Save");
            fireEvent.click(saveButton);
            const object_id = 1000; // mock object returned has this id
            await waitFor(() => expect(history.entries[history.length - 1].pathname).toBe(`/objects/edit/${object_id}`));

            const state = store.getState();
            expect(state.objects[object_id].is_published).toBeTruthy();
        });
    });


    describe("Publish subobjects", () => {
        test("Link, markdown, to-do list: control not rendered", async () => {
            let { store, container } = renderWithWrappers(<App />, {
                route: "/objects/edit/new"
            });

            for (let objectType of ["link", "markdown", "to_do_list"]) {
                // Set object type
                setObjectType(container, objectType);

                // Check if control is not rendered
                clickDisplayTabButton(container);
                expect(getObjectDisplayControls(container).publishSubobjects).toBeFalsy();
            }
        });


        test("Composite: reset", async () => {
            let { store, container } = renderWithWrappers(<App />, {
                route: "/objects/edit/new"
            });

            // Fill required attributes & data
            await fillRequiredAttributesAndData(container, store, { objectType: "composite" });
            clickDataTabButton(container);;
            let cards = getSubobjectCards(container, { expectedNumbersOfCards: [2] });
            const [firstID, secondID] = cards[0].map(card => card.id);
    
            // Open display tab
            clickDisplayTabButton(container);

            // Publish all subobjects
            clickPublishSubbjectsCheckbox(container);
            expect(store.getState().editedObjects[firstID].is_published).toBeTruthy();
            expect(store.getState().editedObjects[secondID].is_published).toBeTruthy();

            // Reset object with subobjects (and check if subobjects were removed from state.editedObjects after reset)
            resetObject(container, true);
            expect(store.getState().editedObjects[firstID]).toBeUndefined();
            expect(store.getState().editedObjects[secondID]).toBeUndefined();
        });


        test("Composite: toggle & save", async () => {
            let { store, container, history } = renderWithWrappers(<App />, {
                route: "/objects/edit/new"
            });

            // Fill required attributes & data
            await fillRequiredAttributesAndData(container, store, { objectType: "composite" });

            clickDataTabButton(container);;
            let cards = getSubobjectCards(container, { expectedNumbersOfCards: [2] });
            const [firstID, secondID] = cards[0].map(card => card.id);
    
            // Open display tab
            clickDisplayTabButton(container);

            // Publish one subobject => check if "Publish Subobjects" checkbox is indeterminate state
            store.dispatch(setEditedObject({ is_published: true }, secondID));
            const publishSubobjectsContainer = getObjectDisplayControls(container).publishSubobjects.parentNode;
            expect(publishSubobjectsContainer.classList.contains("indeterminate")).toBeTruthy();

            // Published subobjects: partially published -> fully published -> fully not published -> fully published
            
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

            // Save new object and check if display settings are correctly saved
            let saveButton = getSideMenuItem(container, "Save");
            fireEvent.click(saveButton);
            const object_id = 1000; // mock object returned has this id
            await waitFor(() => expect(history.entries[history.length - 1].pathname).toBe(`/objects/edit/${object_id}`));

            const state = store.getState();
            expect(state.objects[firstID].is_published).toBeTruthy();
            expect(state.objects[secondID].is_published).toBeTruthy();
        });
    });


    describe("Show description", () => {
        test("Link, markdown, to-do list, composite: default value, toggle & reset", async () => {
            let { store, container } = renderWithWrappers(<App />, {
                route: "/objects/edit/new"
            });

            for (let objectType of ["link", "markdown", "to_do_list", "composite"]) {
                // Set object type
                setObjectType(container, objectType);

                // Open display tab
                clickDisplayTabButton(container);
            
                // Click checkbox 3 times
                expect(store.getState().editedObjects[0].show_description).toBeFalsy();
                for (let i = 0; i < 3; i++) {
                    clickShowDescriptionCheckbox(container);
                    expect(store.getState().editedObjects[0].show_description).toEqual(i % 2 === 0);
                }

                // Reset object
                resetObject(container, false);
                expect(store.getState().editedObjects[0].show_description).toBeFalsy();
            }
        });


        test("Link: save", async () => {
            let { store, container, history } = renderWithWrappers(<App />, {
                route: "/objects/edit/new"
            });

            // Fill required attributes & data
            await fillRequiredAttributesAndData(container, store, { objectType: "link" });

            // Toggle checkbox
            clickDisplayTabButton(container);
            clickShowDescriptionCheckbox(container);
            expect(store.getState().editedObjects[0].show_description).toBeTruthy();

            // Save object
            let saveButton = getSideMenuItem(container, "Save");
            fireEvent.click(saveButton);
            const object_id = 1000; // mock object returned has this id
            await waitFor(() => expect(history.entries[history.length - 1].pathname).toBe(`/objects/edit/${object_id}`));

            const state = store.getState();
            expect(state.objects[object_id].show_description).toBeTruthy();
        });
    });


    describe("Show description as link", () => {
        test("Markdown, to-do list, composite: control not rendered", async () => {
            let { store, container } = renderWithWrappers(<App />, {
                route: "/objects/edit/new"
            });

            for (let objectType of ["markdown", "to_do_list", "composite"]) {
                // Set object type
                setObjectType(container, objectType);

                // Check if control is not rendered
                clickDisplayTabButton(container);
                expect(getObjectDisplayControls(container).showDescriptionAsLink).toBeFalsy();
            }
        });


        test("Link: default value, toggle & reset", async () => {
            let { store, container } = renderWithWrappers(<App />, {
                route: "/objects/edit/new"
            });

            // Show description as link: click checkbox 3 times
            clickDisplayTabButton(container);
            expect(store.getState().editedObjects[0].link.show_description_as_link).toBeFalsy();
            for (let i = 0; i < 3; i++) {
                clickShowDescriptionAsLinkCheckbox(container);
                expect(store.getState().editedObjects[0].link.show_description_as_link).toEqual(i % 2 === 0);
            }

            // Reset object
            resetObject(container);
            expect(store.getState().editedObjects[0].link.show_description_as_link).toBeFalsy();
        });


        test("Link: save", async () => {
            let { store, container, history } = renderWithWrappers(<App />, {
                route: "/objects/edit/new"
            });

            // Fill required attributes & data
            await fillRequiredAttributesAndData(container, store, { objectType: "link" });

            // Toggle checkbox
            clickDisplayTabButton(container);
            clickShowDescriptionAsLinkCheckbox(container);
            expect(store.getState().editedObjects[0].link.show_description_as_link).toBeTruthy();

            // Save object
            let saveButton = getSideMenuItem(container, "Save");
            fireEvent.click(saveButton);
            const object_id = 1000; // mock object returned has this id
            await waitFor(() => expect(history.entries[history.length - 1].pathname).toBe(`/objects/edit/${object_id}`));

            const state = store.getState();
            expect(state.links[object_id].show_description_as_link).toBeTruthy();
        });
    });


    describe("Display in feed", () => {
        test("Link, markdown, to-do list, composite: default value, toggle & reset", async () => {
            let { store, container } = renderWithWrappers(<App />, {
                route: "/objects/edit/new"
            });

            for (let objectType of ["link", "markdown", "to_do_list", "composite"]) {
                // Set object type
                setObjectType(container, objectType);

                // Open display tab
                clickDisplayTabButton(container);
            
                // Click checkbox 3 times
                expect(store.getState().editedObjects[0].display_in_feed).toEqual(true);
                for (let i = 0; i < 3; i++) {
                    clickDisplayInFeedCheckbox(container);
                    expect(store.getState().editedObjects[0].display_in_feed).toEqual(i % 2 !== 0);
                }

                // Reset object
                resetObject(container, false);
                expect(store.getState().editedObjects[0].display_in_feed).toEqual(true);
            }
        });


        test("Link: save", async () => {
            let { store, container, history } = renderWithWrappers(<App />, {
                route: "/objects/edit/new"
            });

            // Fill required attributes & data
            await fillRequiredAttributesAndData(container, store, { objectType: "link" });

            // Toggle checkbox
            clickDisplayTabButton(container);
            clickDisplayInFeedCheckbox(container);
            expect(store.getState().editedObjects[0].display_in_feed).toEqual(false);

            // Save object
            let saveButton = getSideMenuItem(container, "Save");
            fireEvent.click(saveButton);
            const object_id = 1000; // mock object returned has this id
            await waitFor(() => expect(history.entries[history.length - 1].pathname).toBe(`/objects/edit/${object_id}`));

            const state = store.getState();
            expect(state.objects[object_id].display_in_feed).toEqual(false);
        });
    });

    
    describe("Feed timestamp", () => {
        test("Link, markdown, to-do list, composite: default value, toggle & reset", async () => {
            let { store, container } = renderWithWrappers(<App />, {
                route: "/objects/edit/new"
            });

            for (let objectType of ["link", "markdown", "to_do_list", "composite"]) {
                // Set object type
                setObjectType(container, objectType);

                // Open display tab
                clickDisplayTabButton(container);

                // Check default value
                expect(store.getState().editedObjects[0].feed_timestamp).toEqual("");

                // Set feed timestamp to `newDate`
                const now = new Date();
                const newDate = new Date(now.getFullYear(), now.getMonth(), 10);
                await setFeedTimestampDate(container, newDate);
                expect(store.getState().editedObjects[0].feed_timestamp).toEqual(newDate.toISOString());

                // Reset object
                resetObject(container, false);
                expect(store.getState().editedObjects[0].feed_timestamp).toEqual("");
                const { feedTimestampContainer } = getObjectDisplayControls(container);
                const { input } = getReactDatetimeElements(feedTimestampContainer);
                expect(input.textContent).toEqual("");
            }
        });


        test("Link: save", async () => {
            let { store, container, history } = renderWithWrappers(<App />, {
                route: "/objects/edit/new"
            });

            // Fill required attributes & data
            await fillRequiredAttributesAndData(container, store, { objectType: "link" });

            // Open display tab
            clickDisplayTabButton(container);

            // Check default value
            expect(store.getState().editedObjects[0].feed_timestamp).toEqual("");

            // Set feed timestamp to `newDate`
            const now = new Date();
            const newDate = new Date(now.getFullYear(), now.getMonth(), 10);
            await setFeedTimestampDate(container, newDate);
            expect(store.getState().editedObjects[0].feed_timestamp).toEqual(newDate.toISOString());

            // Save object
            let saveButton = getSideMenuItem(container, "Save");
            fireEvent.click(saveButton);
            const object_id = 1000; // mock object returned has this id
            await waitFor(() => expect(history.entries[history.length - 1].pathname).toBe(`/objects/edit/${object_id}`));

            const state = store.getState();
            expect(state.objects[object_id].feed_timestamp).toEqual(newDate.toISOString());
        });
    });


    describe("Display mode", () => {
        test("Link, Markdown, to-do list: control not rendered", async () => {
            let { store, container } = renderWithWrappers(<App />, {
                route: "/objects/edit/new"
            });

            for (let objectType of ["link", "markdown", "to_do_list"]) {
                // Set object type
                setObjectType(container, objectType);

                // Check if control is not rendered
                clickDisplayTabButton(container);
                expect(getObjectDisplayControls(container).displayMode.selected).toBeUndefined();
            }
        });


        // NOTE: update this test when new display modes are added to check if control correctly modifies object's `display_mode` value
        test("Composite: default value", async () => {
            let { store, container } = renderWithWrappers(<App />, {
                route: "/objects/edit/new"
            });

            // Set object type
            setObjectType(container, "composite");

            // Composite display mode: is rendered and eqaul "Basic" by default
            clickDisplayTabButton(container);
            const displayModeControls = getObjectDisplayControls(container).displayMode;
            expect(displayModeControls.selected.textContent).toEqual("Basic");

            // Select `grouped_links` display mode
            fireEvent.click(displayModeControls.selected);
            fireEvent.click(displayModeControls.options.grouped_links);
            expect(store.getState().editedObjects[0].composite.display_mode).toEqual("grouped_links");

            // Select `basic` display mode
            fireEvent.click(displayModeControls.selected);
            fireEvent.click(displayModeControls.options.basic);
            expect(store.getState().editedObjects[0].composite.display_mode).toEqual("basic");
        });
    });

    describe("Show description composite", () => {
        test("Link, markdown, to-do list, composite: control not rendered", async () => {
            let { store, container } = renderWithWrappers(<App />, {
                route: "/objects/edit/new"
            });

            for (let objectType of ["link", "markdown", "to_do_list", "composite"]) {
                // Set object type
                setObjectType(container, objectType);

                // Check if control is not rendered
                clickDisplayTabButton(container);
                expect(getObjectDisplayControls(container).showDescriptionComposite.selected).toBeFalsy();
            }
        });
    });


    describe("Show description as link composite", () => {
        test("Link, markdown, to-do list, composite: control not rendered", async () => {
            let { store, container } = renderWithWrappers(<App />, {
                route: "/objects/edit/new"
            });

            for (let objectType of ["link", "markdown", "to_do_list", "composite"]) {
                // Set object type
                setObjectType(container, objectType);

                // Check if control is not rendered
                clickDisplayTabButton(container);
                expect(getObjectDisplayControls(container).showDescriptionAsLinkComposite.selected).toBeFalsy();
            }
        });
    });
});


describe("Composite subobject display properties", () => {
    describe("Publish subobject", () => {
        test("Default value inheritance", async () => {
            let { container, store } = renderWithWrappers(<App />, {
                route: "/objects/edit/new"
            });
            expect(store.getState().editedObjects[0].is_published).toBeFalsy();
        
            // Select composite object type
            setObjectType(container, "composite");
        
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


        test("Link, markdown, to-do list, composite: toggle & reset", async () => {
            const store = getStoreWithCompositeObjectAndSubobjectsOfEachType(true, true);
            let { container } = renderWithWrappers(<App />, {
                route: "/objects/edit/new",
                store
            });

            // Check data and get subobject ids and cards
            clickDataTabButton(container);
            let cards = getSubobjectCards(container, { expectedNumbersOfCards: [4] });
            const subobjectObjectTypes = ["link", "markdown", "to_do_list", "composite"];

            // Wait for composite subobject card to load
            await waitFor(() => getByText(cards[0][3], "Object Name"));

            for (let i = 0; i < cards.length; i++) {
                const subobjectCard = cards[0][i];
                const subobjectID = subobjectCard.id;
                expect(store.getState().editedObjects[subobjectID].object_type).toEqual(subobjectObjectTypes[i]);

                // Click on tested subobject's card display tab
                clickSubobjectCardDisplayTabButton(subobjectCard);

                // Publish object: click checkbox 3 times
                expect(store.getState().editedObjects[subobjectID].is_published).toBeFalsy();
                for (let j = 0; j < 3; j++) {
                    clickPublishObjectCheckbox(subobjectCard);
                    expect(store.getState().editedObjects[subobjectID].is_published).toEqual(j % 2 === 0);
                }

                // Reset subobject
                resetSubobject(subobjectCard);
                expect(store.getState().editedObjects[subobjectID].is_published).toBeFalsy();
            }
        });


        test("Link: update", async () => {
            const store = getStoreWithCompositeObjectAndSubobjectsOfEachType(true, true);
            let { container, history } = renderWithWrappers(<App />, {
                route: "/objects/edit/new",
                store
            });

            // Check data and get subobject ids and cards
            clickDataTabButton(container);
            let cards = getSubobjectCards(container, { expectedNumbersOfCards: [4] });

            // Wait for composite subobject card to load
            await waitFor(() => getByText(cards[0][3], "Object Name"));

            const subobjectCard = cards[0][0];
            const subobjectID = subobjectCard.id;
            expect(store.getState().editedObjects[subobjectID].object_type).toEqual("link");

            // Click on tested subobject's card display tab
            clickSubobjectCardDisplayTabButton(subobjectCard);

            // Publish subobject
            clickPublishObjectCheckbox(subobjectCard);
            expect(store.getState().editedObjects[subobjectID].is_published).toBeTruthy();

            // Save new object and check if display settings are correctly saved
            let saveButton = getSideMenuItem(container, "Save");
            fireEvent.click(saveButton);
            const object_id = 1000; // mock object returned has this id
            await waitFor(() => expect(history.entries[history.length - 1].pathname).toBe(`/objects/edit/${object_id}`));

            const state = store.getState();
            const mappedSubobjectID = getMappedSubobjectID(subobjectID, "link");
            expect(state.objects[mappedSubobjectID].is_published).toBeTruthy();
        });
    });


    describe("Show description composite", () => {
        test("Link, markdown, to-do list, composite: toggle & reset", async () => {
            const store = getStoreWithCompositeObjectAndSubobjectsOfEachType(true, true);
            let { container } = renderWithWrappers(<App />, {
                route: "/objects/edit/new",
                store
            });

            // Check data and get subobject ids and cards
            clickDataTabButton(container);
            let cards = getSubobjectCards(container, { expectedNumbersOfCards: [4] });
            const subobjectObjectTypes = ["link", "markdown", "to_do_list", "composite"];

            // Wait for composite subobject card to load
            await waitFor(() => getByText(cards[0][3], "Object Name"));

            for (let i = 0; i < cards.length; i++) {
                const subobjectCard = cards[0][i];
                const subobjectID = subobjectCard.id;
                expect(store.getState().editedObjects[subobjectID].object_type).toEqual(subobjectObjectTypes[i]);

                // Click on tested subobject's card display tab
                clickSubobjectCardDisplayTabButton(subobjectCard);
                const displayControls = getObjectDisplayControls(subobjectCard);

                // Show description composite: inherit => no => inherit => yes
                expect(displayControls.showDescriptionComposite.selected.textContent).toEqual("Inherit");
                
                fireEvent.click(displayControls.showDescriptionComposite.selected);
                fireEvent.click(displayControls.showDescriptionComposite.options.no);
                expect(displayControls.showDescriptionComposite.selected.textContent).toEqual("No");
                expect(store.getState().editedObjects[0].composite.subobjects[subobjectID].show_description_composite).toEqual("no");

                fireEvent.click(displayControls.showDescriptionComposite.selected);
                fireEvent.click(displayControls.showDescriptionComposite.options.inherit);
                expect(displayControls.showDescriptionComposite.selected.textContent).toEqual("Inherit");
                expect(store.getState().editedObjects[0].composite.subobjects[subobjectID].show_description_composite).toEqual("inherit");

                fireEvent.click(displayControls.showDescriptionComposite.selected);
                fireEvent.click(displayControls.showDescriptionComposite.options.yes);
                expect(displayControls.showDescriptionComposite.selected.textContent).toEqual("Yes");
                expect(store.getState().editedObjects[0].composite.subobjects[subobjectID].show_description_composite).toEqual("yes");

                // Reset subobject
                resetSubobject(subobjectCard);
                expect(store.getState().editedObjects[0].composite.subobjects[subobjectID].show_description_composite).toEqual("inherit");
            }
        });


        test("Link: update", async () => {
            const store = getStoreWithCompositeObjectAndSubobjectsOfEachType(true, true);
            let { container, history } = renderWithWrappers(<App />, {
                route: "/objects/edit/new",
                store
            });

            // Check data and get subobject ids and cards
            clickDataTabButton(container);
            let cards = getSubobjectCards(container, { expectedNumbersOfCards: [4] });

            // Wait for composite subobject card to load
            await waitFor(() => getByText(cards[0][3], "Object Name"));

            const subobjectCard = cards[0][0];
            const subobjectID = subobjectCard.id;
            expect(store.getState().editedObjects[subobjectID].object_type).toEqual("link");

            // Click on tested subobject's card display tab
            clickSubobjectCardDisplayTabButton(subobjectCard);
            const displayControls = getObjectDisplayControls(subobjectCard);

            // Show description composite: change to yes
            expect(displayControls.showDescriptionComposite.selected.textContent).toEqual("Inherit");

            fireEvent.click(displayControls.showDescriptionComposite.selected);
            fireEvent.click(displayControls.showDescriptionComposite.options.yes);
            expect(displayControls.showDescriptionComposite.selected.textContent).toEqual("Yes");
            expect(store.getState().editedObjects[0].composite.subobjects[subobjectID].show_description_composite).toEqual("yes");

            // Save new object and check if display settings are correctly saved
            let saveButton = getSideMenuItem(container, "Save");
            fireEvent.click(saveButton);
            const object_id = 1000; // mock object returned has this id
            await waitFor(() => expect(history.entries[history.length - 1].pathname).toBe(`/objects/edit/${object_id}`));

            const state = store.getState();
            const mappedSubobjectID = getMappedSubobjectID(subobjectID, "link");
            expect(state.composite[object_id].subobjects[mappedSubobjectID].show_description_composite).toEqual("yes");
        });
    });


    describe("Show description as link composite", () => {
        test("Markdown, to-do list, composite: not rendered", async () => {
            const store = getStoreWithCompositeObjectAndSubobjectsOfEachType(true, true);
            let { container } = renderWithWrappers(<App />, {
                route: "/objects/edit/new",
                store
            });

            // Check data and get subobject ids and cards
            clickDataTabButton(container);
            let cards = getSubobjectCards(container, { expectedNumbersOfCards: [4] });
            const subobjectObjectTypes = [undefined, "markdown", "to_do_list", "composite"];

            // Wait for composite subobject card to load
            await waitFor(() => getByText(cards[0][3], "Object Name"));

            for (let i = 1; i < cards.length; i++) {
                const subobjectCard = cards[0][i];
                const subobjectID = subobjectCard.id;
                expect(store.getState().editedObjects[subobjectID].object_type).toEqual(subobjectObjectTypes[i]);

                // Check if control is not rendered
                clickSubobjectCardDisplayTabButton(subobjectCard);
                expect(getObjectDisplayControls(subobjectCard).showDescriptionAsLinkComposite).toBeFalsy();
            }
        });


        test("Link: toggle & reset", async () => {
            const store = getStoreWithCompositeObjectAndSubobjectsOfEachType(true, true);
            let { container } = renderWithWrappers(<App />, {
                route: "/objects/edit/new",
                store
            });

            // Check data and get subobject ids and cards
            clickDataTabButton(container);
            let cards = getSubobjectCards(container, { expectedNumbersOfCards: [4] });

            // Wait for composite subobject card to load
            await waitFor(() => getByText(cards[0][3], "Object Name"));
                
            const subobjectCard = cards[0][0];
            const subobjectID = subobjectCard.id;
            expect(store.getState().editedObjects[subobjectID].object_type).toEqual("link");

            // Click on tested subobject's card display tab
            clickSubobjectCardDisplayTabButton(subobjectCard);
            const displayControls = getObjectDisplayControls(subobjectCard);

            // Show description as link composite: inherit => no => inherit => yes
            expect(displayControls.showDescriptionAsLinkComposite.selected.textContent).toEqual("Inherit");
                
            fireEvent.click(displayControls.showDescriptionAsLinkComposite.selected);
            fireEvent.click(displayControls.showDescriptionAsLinkComposite.options.no);
            expect(displayControls.showDescriptionAsLinkComposite.selected.textContent).toEqual("No");
            expect(store.getState().editedObjects[0].composite.subobjects[subobjectID].show_description_as_link_composite).toEqual("no");

            fireEvent.click(displayControls.showDescriptionAsLinkComposite.selected);
            fireEvent.click(displayControls.showDescriptionAsLinkComposite.options.inherit);
            expect(displayControls.showDescriptionAsLinkComposite.selected.textContent).toEqual("Inherit");
            expect(store.getState().editedObjects[0].composite.subobjects[subobjectID].show_description_as_link_composite).toEqual("inherit");

            fireEvent.click(displayControls.showDescriptionAsLinkComposite.selected);
            fireEvent.click(displayControls.showDescriptionAsLinkComposite.options.yes);
            expect(displayControls.showDescriptionAsLinkComposite.selected.textContent).toEqual("Yes");
            expect(store.getState().editedObjects[0].composite.subobjects[subobjectID].show_description_as_link_composite).toEqual("yes");

            // Reset subobject
            resetSubobject(subobjectCard);
            expect(store.getState().editedObjects[0].composite.subobjects[subobjectID].show_description_as_link_composite).toEqual("inherit");
        });


        test("Link: update", async () => {
            const store = getStoreWithCompositeObjectAndSubobjectsOfEachType(true, true);
            let { container, history } = renderWithWrappers(<App />, {
                route: "/objects/edit/new",
                store
            });

            // Check data and get subobject ids and cards
            clickDataTabButton(container);
            let cards = getSubobjectCards(container, { expectedNumbersOfCards: [4] });

            // Wait for composite subobject card to load
            await waitFor(() => getByText(cards[0][3], "Object Name"));

            const subobjectCard = cards[0][0];
            const subobjectID = subobjectCard.id;
            expect(store.getState().editedObjects[subobjectID].object_type).toEqual("link");

            // Click on tested subobject's card display tab
            clickSubobjectCardDisplayTabButton(subobjectCard);
            const displayControls = getObjectDisplayControls(subobjectCard);

            // Show description composite: change to yes
            expect(displayControls.showDescriptionAsLinkComposite.selected.textContent).toEqual("Inherit");

            fireEvent.click(displayControls.showDescriptionAsLinkComposite.selected);
            fireEvent.click(displayControls.showDescriptionAsLinkComposite.options.yes);
            expect(displayControls.showDescriptionAsLinkComposite.selected.textContent).toEqual("Yes");
            expect(store.getState().editedObjects[0].composite.subobjects[subobjectID].show_description_as_link_composite).toEqual("yes");

            // Save new object and check if display settings are correctly saved
            let saveButton = getSideMenuItem(container, "Save");
            fireEvent.click(saveButton);
            const object_id = 1000; // mock object returned has this id
            await waitFor(() => expect(history.entries[history.length - 1].pathname).toBe(`/objects/edit/${object_id}`));

            const state = store.getState();
            const mappedSubobjectID = getMappedSubobjectID(subobjectID, "link");
            expect(state.composite[object_id].subobjects[mappedSubobjectID].show_description_as_link_composite).toEqual("yes");
        });
    });


    describe("Display in feed", () => {
        test("Default value of a new subobject", async () => {
            let { store, container } = renderWithWrappers(<App />, {
                route: "/objects/edit/new"
            });

            // Set object type
            setObjectType(container, "composite");

            // Open data tab and add a new subobject
            clickDataTabButton(container);
            addANewSubobject(container);
            const cards = getSubobjectCards(container, { expectedNumbersOfCards: [1] });
            const subobjectID = cards[0][0].id;
            expect(store.getState().editedObjects[subobjectID].display_in_feed).toEqual(false);
        });


        test("Link, markdown, to-do list, composite: toggle & reset", async () => {
            const store = getStoreWithCompositeObjectAndSubobjectsOfEachType(true, true);
            let { container } = renderWithWrappers(<App />, {
                route: "/objects/edit/new",
                store
            });

            // Check data and get subobject ids and cards
            clickDataTabButton(container);
            let cards = getSubobjectCards(container, { expectedNumbersOfCards: [4] });
            const subobjectObjectTypes = ["link", "markdown", "to_do_list", "composite"];

            // Wait for composite subobject card to load
            await waitFor(() => getByText(cards[0][3], "Object Name"));

            for (let i = 0; i < cards.length; i++) {
                const subobjectCard = cards[0][i];
                const subobjectID = subobjectCard.id;
                expect(store.getState().editedObjects[subobjectID].object_type).toEqual(subobjectObjectTypes[i]);

                // Click on tested subobject's card display tab
                clickSubobjectCardDisplayTabButton(subobjectCard);

                // Click checkbox 3 times
                expect(store.getState().editedObjects[subobjectID].display_in_feed).toBeFalsy();
                for (let j = 0; j < 3; j++) {
                    clickDisplayInFeedCheckbox(subobjectCard);
                    expect(store.getState().editedObjects[subobjectID].display_in_feed).toEqual(j % 2 === 0);
                }

                // Reset subobject
                resetSubobject(subobjectCard);
                expect(store.getState().editedObjects[subobjectID].display_in_feed).toBeFalsy();
            }
        });


        test("Link: update", async () => {
            const store = getStoreWithCompositeObjectAndSubobjectsOfEachType(true, true);
            let { container, history } = renderWithWrappers(<App />, {
                route: "/objects/edit/new",
                store
            });

            // Check data and get subobject ids and cards
            clickDataTabButton(container);
            let cards = getSubobjectCards(container, { expectedNumbersOfCards: [4] });

            // Wait for composite subobject card to load
            await waitFor(() => getByText(cards[0][3], "Object Name"));

            const subobjectCard = cards[0][0];
            const subobjectID = subobjectCard.id;
            expect(store.getState().editedObjects[subobjectID].object_type).toEqual("link");

            // Click on tested subobject's card display tab
            clickSubobjectCardDisplayTabButton(subobjectCard);

            // Click checkbox
            clickDisplayInFeedCheckbox(subobjectCard);
            expect(store.getState().editedObjects[subobjectID].display_in_feed).toEqual(true);

            // Save new object and check if display settings are correctly saved
            let saveButton = getSideMenuItem(container, "Save");
            fireEvent.click(saveButton);
            const object_id = 1000; // mock object returned has this id
            await waitFor(() => expect(history.entries[history.length - 1].pathname).toBe(`/objects/edit/${object_id}`));

            const state = store.getState();
            const mappedSubobjectID = getMappedSubobjectID(subobjectID, "link");
            expect(state.objects[mappedSubobjectID].display_in_feed).toEqual(true);
        });
    });


    describe("Feed timestamp", () => {
        test("Link, markdown, to-do list: toggle & reset", async () => {
            const store = getStoreWithCompositeObjectAndSubobjectsOfEachType(true, true);
            let { container } = renderWithWrappers(<App />, {
                route: "/objects/edit/new",
                store
            });

            // Check data and get subobject ids and cards
            clickDataTabButton(container);
            let cards = getSubobjectCards(container, { expectedNumbersOfCards: [4] });
            const subobjectObjectTypes = ["link", "markdown", "to_do_list", undefined];

            // Wait for composite subobject card to load
            await waitFor(() => getByText(cards[0][3], "Object Name"));

            for (let i = 0; i < cards.length - 1; i++) {
                const subobjectCard = cards[0][i];
                const subobjectID = subobjectCard.id;
                expect(store.getState().editedObjects[subobjectID].object_type).toEqual(subobjectObjectTypes[i]);

                // Click on tested subobject's card display tab
                clickSubobjectCardDisplayTabButton(subobjectCard);

                // Check default value
                expect(store.getState().editedObjects[subobjectID].feed_timestamp).toEqual("");

                // Set feed timestamp to `newDate`
                const now = new Date();
                const newDate = new Date(now.getFullYear(), now.getMonth(), 10);
                await setFeedTimestampDate(subobjectCard, newDate);
                expect(store.getState().editedObjects[subobjectID].feed_timestamp).toEqual(newDate.toISOString());

                // Reset subobject
                resetSubobject(subobjectCard);
                expect(store.getState().editedObjects[subobjectID].feed_timestamp).toEqual("");
            }
        });


        test("Link: update", async () => {
            const store = getStoreWithCompositeObjectAndSubobjectsOfEachType(true, true);
            let { container, history } = renderWithWrappers(<App />, {
                route: "/objects/edit/new",
                store
            });

            // Check data and get subobject ids and cards
            clickDataTabButton(container);
            let cards = getSubobjectCards(container, { expectedNumbersOfCards: [4] });

            // Wait for composite subobject card to load
            await waitFor(() => getByText(cards[0][3], "Object Name"));

            const subobjectCard = cards[0][0];
            const subobjectID = subobjectCard.id;
            expect(store.getState().editedObjects[subobjectID].object_type).toEqual("link");

            // Click on tested subobject's card display tab
            clickSubobjectCardDisplayTabButton(subobjectCard);

            // Check default value
            expect(store.getState().editedObjects[subobjectID].feed_timestamp).toEqual("");

            // Set feed timestamp to `newDate`
            const now = new Date();
            const newDate = new Date(now.getFullYear(), now.getMonth(), 10);
            await setFeedTimestampDate(subobjectCard, newDate);
            expect(store.getState().editedObjects[subobjectID].feed_timestamp).toEqual(newDate.toISOString());

            // Save new object and check if display settings are correctly saved
            let saveButton = getSideMenuItem(container, "Save");
            fireEvent.click(saveButton);
            const object_id = 1000; // mock object returned has this id
            await waitFor(() => expect(history.entries[history.length - 1].pathname).toBe(`/objects/edit/${object_id}`));

            const state = store.getState();
            const mappedSubobjectID = getMappedSubobjectID(subobjectID, "link");
            expect(state.objects[mappedSubobjectID].feed_timestamp).toEqual(newDate.toISOString());
        });
    });


    describe("Show description; show description as link; display mode", () => {
        test("Link, markdown, to-do list, composite: not rendered", async () => {
            const store = getStoreWithCompositeObjectAndSubobjectsOfEachType(true, true);
            let { container } = renderWithWrappers(<App />, {
                route: "/objects/edit/new",
                store
            });

            // Check data and get subobject ids and cards
            clickDataTabButton(container);
            let cards = getSubobjectCards(container, { expectedNumbersOfCards: [4] });
            const subobjectObjectTypes = ["link", "markdown", "to_do_list", "composite"];

            // Wait for composite subobject card to load
            await waitFor(() => getByText(cards[0][3], "Object Name"));

            for (let i = 0; i < cards.length; i++) {
                const subobjectCard = cards[0][i];
                const subobjectID = subobjectCard.id;
                expect(store.getState().editedObjects[subobjectID].object_type).toEqual(subobjectObjectTypes[i]);

                // Check if controls are not rendered
                clickSubobjectCardDisplayTabButton(subobjectCard);
                expect(getObjectDisplayControls(subobjectCard).showDescriptionAsLink).toBeFalsy();
                expect(getObjectDisplayControls(subobjectCard).showDescription).toBeFalsy();
                expect(getObjectDisplayControls(subobjectCard).displayMode.selected).toBeFalsy();
            }
        });
    });
});
