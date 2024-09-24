import React from "react";
import ReactDOM from "react-dom";

import { fireEvent } from "@testing-library/react";
import { getByText, waitFor} from "@testing-library/dom";

import { resetTestConfig } from "../../../../_mocks/config";
import { renderWithWrappers } from "../../../../_util/render";
import { getSideMenuItem } from "../../../../_util/ui-common";
import { clickDataTabButton, clickDisplayTabButton, getObjectDisplayControls, clickPublishObjectCheckbox, clickPublishSubbjectsCheckbox, clickShowDescriptionCheckbox, 
    clickShowDescriptionAsLinkCheckbox, resetObject, clickDisplayInFeedCheckbox, setFeedTimestampDate, clickNumerateChaptersCheckbox } from "../../../../_util/ui-objects-edit";
import { addANewSubobject, clickSubobjectCardDisplayTabButton, getSubobjectCards, resetSubobject } from "../../../../_util/ui-composite";
import { getReactDatetimeElements } from "../../../../_util/ui-react-datetime";

import { getStoreWithCompositeObjectAndSubobjectsOfEachType } from "../../../../_mocks/data-composite";

import { App } from "../../../../../src/components/top-level/app";
import { setEditedObject } from "../../../../../src/actions/objects-edit";
import { enumCompositeObjectDisplayModes } from "../../../../../src/util/enum-composite-object-display-modes";


/*
    /objects/edit/:id page tests for existing objects' display options.
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


describe("Object display properties", () => {
    describe("Publish object", () => {
        test("Link, markdown, to-do list, composite: default value, toggle & reset", async () => {
            const objectTypes = ["link", "markdown", "to_do_list", "composite"];

            for (let i = 0; i < objectTypes.length; i++) {
                const objectID = 1000 * i + 1;
                let { container, store } = renderWithWrappers(<App />, {
                    route: `/objects/edit/${objectID}`
                });
            
                // Wait for the page to load and open display tab
                await waitFor(() => getByText(container, "Object Information"));
                clickDisplayTabButton(container);
            
                // Click checkbox 3 times
                expect(store.getState().editedObjects[objectID].is_published).toBeFalsy();
                for (let j = 0; j < 3; j++) {
                    clickPublishObjectCheckbox(container);
                    expect(store.getState().editedObjects[objectID].is_published).toEqual(j % 2 === 0);
                }

                // Reset object
                resetObject(container, false);
                expect(store.getState().editedObjects[objectID].is_published).toBeFalsy();

                ReactDOM.unmountComponentAtNode(container);
            }
        });


        test("Link: update", async () => {
            let { store, container } = renderWithWrappers(<App />, {
                route: "/objects/edit/1"
            });
        
            // Wait for the page to load and open display tab
            await waitFor(() => getByText(container, "Object Information"));
            clickDisplayTabButton(container);

            // Toggle checkbox
            clickPublishObjectCheckbox(container);
            expect(store.getState().editedObjects[1].is_published).toBeTruthy();

            // Update object and check if display setting is correctly saved
            let saveButton = getSideMenuItem(container, "Save");
            fireEvent.click(saveButton);
            await waitFor(() => expect(store.getState().objects[1].is_published).toBeTruthy());
        });
    });


    describe("Publish subobjects", () => {
        test("Link, markdown, to-do list: control not rendered", async () => {
            const objectTypes = ["link", "markdown", "to_do_list", undefined];

            for (let i = 0; i < objectTypes.length - 1; i++) {
                const objectID = 1000 * i + 1;
                let { container } = renderWithWrappers(<App />, {
                    route: `/objects/edit/${objectID}`
                });

                // Wait for the page to load and open display tab
                await waitFor(() => getByText(container, "Object Information"));
                clickDisplayTabButton(container);

                // Check if control is not rendered
                expect(getObjectDisplayControls(container).publishSubobjects).toBeFalsy();

                ReactDOM.unmountComponentAtNode(container);
            }
        });


        test("Composite: toggle & reset", async () => {
            let { container, store } = renderWithWrappers(<App />, {
                route: "/objects/edit/3901"
            });
        
            // Wait for the page to load
            await waitFor(() => getByText(container, "Object Information"));
            clickDataTabButton(container);
            let cards = getSubobjectCards(container, { expectedNumbersOfCards: [4] });
            const subobjectIDs = cards[0].map(card => card.id);
        
            // Open display tab
            clickDisplayTabButton(container);
    
            // Publish subobjects: partially published -> fully published -> fully not published -> fully published
            store.dispatch(setEditedObject({ is_published: true }, subobjectIDs[3]));
            for (let i = 0; i <= 2; i++) expect(store.getState().editedObjects[subobjectIDs[i]].is_published).toBeFalsy();
            expect(store.getState().editedObjects[subobjectIDs[3]].is_published).toBeTruthy();

            clickPublishSubbjectsCheckbox(container);
            for (let i = 0; i <= 3; i++) expect(store.getState().editedObjects[subobjectIDs[i]].is_published).toBeTruthy();

            clickPublishSubbjectsCheckbox(container);
            for (let i = 0; i <= 3; i++) expect(store.getState().editedObjects[subobjectIDs[i]].is_published).toBeFalsy();

            clickPublishSubbjectsCheckbox(container);
            for (let i = 0; i <= 3; i++) expect(store.getState().editedObjects[subobjectIDs[i]].is_published).toBeTruthy();

            // Reset object (don't check composite subobject, because it's not reset)
            resetObject(container, true);
            for (let i = 0; i <= 2; i++) expect(store.getState().editedObjects[subobjectIDs[i]].is_published).toBeFalsy();
        });


        test("Composite: save", async () => {
            let { container, store } = renderWithWrappers(<App />, {
                route: "/objects/edit/3901"
            });
        
            // Wait for the page to load
            await waitFor(() => getByText(container, "Object Information"));
            clickDataTabButton(container);
            let cards = getSubobjectCards(container, { expectedNumbersOfCards: [4] });
            const subobjectIDs = cards[0].map(card => card.id);
        
            // Open display tab
            clickDisplayTabButton(container);

            // Publish all subobjects
            clickPublishSubbjectsCheckbox(container);
            for (let i = 0; i <= 3; i++) expect(store.getState().editedObjects[subobjectIDs[i]].is_published).toBeTruthy();

            // Update object and check if subobjects were updated (except for composite)
            let saveButton = getSideMenuItem(container, "Save");
            fireEvent.click(saveButton);
            await waitFor(() => {
                for (let i = 0; i < 3; i++)
                    expect(store.getState().objects[subobjectIDs[i]].is_published).toBeTruthy();
            });
        });
    });


    describe("Show description", () => {
        test("Link, markdown, to-do list, composite: default value, toggle & reset", async () => {
            const objectTypes = ["link", "markdown", "to_do_list", "composite"];

            for (let i = 0; i < objectTypes.length; i++) {
                const objectID = 1000 * i + 1;
                let { container, store } = renderWithWrappers(<App />, {
                    route: `/objects/edit/${objectID}`
                });
            
                // Wait for the page to load and open display tab
                await waitFor(() => getByText(container, "Object Information"));
                clickDisplayTabButton(container);
            
                // Click checkbox 3 times
                expect(store.getState().editedObjects[objectID].show_description).toBeFalsy();
                for (let j = 0; j < 3; j++) {
                    clickShowDescriptionCheckbox(container);
                    expect(store.getState().editedObjects[objectID].show_description).toEqual(j % 2 === 0);
                }

                // Reset object
                resetObject(container, false);
                expect(store.getState().editedObjects[objectID].show_description).toBeFalsy();

                ReactDOM.unmountComponentAtNode(container);
            }
        });


        test("Link: update", async () => {
            let { container, store } = renderWithWrappers(<App />, {
                route: "/objects/edit/1"
            });
        
            // Wait for the page to load and open display tab
            await waitFor(() => getByText(container, "Object Information"));
            clickDisplayTabButton(container);

            // Toggle checkbox
            clickShowDescriptionCheckbox(container);
            expect(store.getState().editedObjects[1].show_description).toBeTruthy();

            // Update object and check if display setting is correctly saved
            let saveButton = getSideMenuItem(container, "Save");
            fireEvent.click(saveButton);
            await waitFor(() => expect(store.getState().objects[1].show_description).toBeTruthy());
        });
    });


    describe("Show description as link", () => {
        test("Markdown, to-do list: control not rendered", async () => {
            const objectTypes = [undefined, "markdown", "to_do_list", "composite"];

            for (let i = 1; i < objectTypes.length; i++) {
                const objectID = 1000 * i + 1;
                let { container } = renderWithWrappers(<App />, {
                    route: `/objects/edit/${objectID}`
                });

                // Wait for the page to load and open display tab
                await waitFor(() => getByText(container, "Object Information"));
                clickDisplayTabButton(container);

                // Check if control is not rendered
                expect(getObjectDisplayControls(container).showDescriptionAsLink).toBeFalsy();

                ReactDOM.unmountComponentAtNode(container);
            }
        });


        test("Link: toggle & reset", async () => {
            let { container, store } = renderWithWrappers(<App />, {
                route: "/objects/edit/1"
            });
        
            // Wait for the page to load
            await waitFor(() => getByText(container, "Object Information"));
        
            // Open display tab
            clickDisplayTabButton(container);

            // Click checkbox 3 times
            expect(store.getState().editedObjects[1].link.show_description_as_link).toEqual(false);
            for (let j = 0; j < 3; j++) {
                clickShowDescriptionAsLinkCheckbox(container);
                expect(store.getState().editedObjects[1].link.show_description_as_link).toEqual(j % 2 === 0);
            }

            // Reset object
            resetObject(container, false);
            expect(store.getState().editedObjects[1].link.show_description_as_link).toEqual(false);
        });


        test("Link: save", async () => {
            let { container, store } = renderWithWrappers(<App />, {
                route: "/objects/edit/1"
            });
        
            // Wait for the page to load
            await waitFor(() => getByText(container, "Object Information"));
        
            // Open display tab
            clickDisplayTabButton(container);

            // Toggle checkbox
            clickShowDescriptionAsLinkCheckbox(container);
            expect(store.getState().editedObjects[1].link.show_description_as_link).toEqual(true);

            // Update object and check if subobjects were updated (except for composite)
            let saveButton = getSideMenuItem(container, "Save");
            fireEvent.click(saveButton);
            await waitFor(() => expect(store.getState().links[1].show_description_as_link).toEqual(true));
        });
    });


    describe("Display in feed", () => {
        test("Link, markdown, to-do list, composite: default value, toggle & reset", async () => {
            const objectTypes = ["link", "markdown", "to_do_list", "composite"];

            for (let i = 0; i < objectTypes.length; i++) {
                const objectID = 1000 * i + 1;
                let { container, store } = renderWithWrappers(<App />, {
                    route: `/objects/edit/${objectID}`
                });
            
                // Wait for the page to load and open display tab
                await waitFor(() => getByText(container, "Object Information"));
                clickDisplayTabButton(container);
            
                // Click checkbox 3 times
                expect(store.getState().editedObjects[objectID].display_in_feed).toBeFalsy();
                for (let j = 0; j < 3; j++) {
                    clickDisplayInFeedCheckbox(container);
                    expect(store.getState().editedObjects[objectID].display_in_feed).toEqual(j % 2 === 0);
                }

                // Reset object
                resetObject(container, false);
                expect(store.getState().editedObjects[objectID].display_in_feed).toBeFalsy();

                ReactDOM.unmountComponentAtNode(container);
            }
        });


        test("Link: update", async () => {
            let { container, store } = renderWithWrappers(<App />, {
                route: "/objects/edit/1"
            });
        
            // Wait for the page to load and open display tab
            await waitFor(() => getByText(container, "Object Information"));
            clickDisplayTabButton(container);

            // Toggle checkbox
            clickDisplayInFeedCheckbox(container);
            expect(store.getState().editedObjects[1].display_in_feed).toBeTruthy();

            // Update object and check if display setting is correctly saved
            let saveButton = getSideMenuItem(container, "Save");
            fireEvent.click(saveButton);
            await waitFor(() => expect(store.getState().objects[1].display_in_feed).toBeTruthy());
        });
    });


    describe("Feed timestamp", () => {
        test("Link, markdown, to-do list, composite: default value, toggle & reset", async () => {
            const objectTypes = ["link", "markdown", "to_do_list", "composite"];

            for (let i = 0; i < objectTypes.length; i++) {
                const objectID = 1000 * i + 1;
                let { container, store } = renderWithWrappers(<App />, {
                    route: `/objects/edit/${objectID}`
                });
            
                // Wait for the page to load and open display tab
                await waitFor(() => getByText(container, "Object Information"));
                clickDisplayTabButton(container);

                // Set feed timestamp to an empty string
                const { feedTimestampContainer } = getObjectDisplayControls(container);
                let rdtElements = getReactDatetimeElements(feedTimestampContainer);
                fireEvent.change(rdtElements.input, { target: { value: "" }});
                expect(store.getState().editedObjects[objectID].feed_timestamp).toEqual("");

                // Set feed timestamp to `newDate`
                const now = new Date();
                const newDate = new Date(now.getFullYear(), now.getMonth(), 10);
                await setFeedTimestampDate(container, newDate);
                expect(store.getState().editedObjects[objectID].feed_timestamp).toEqual(newDate.toISOString());

                // Reset object
                resetObject(container, false);
                expect(store.getState().editedObjects[objectID].feed_timestamp).toEqual(store.getState().objects[objectID].feed_timestamp);

                ReactDOM.unmountComponentAtNode(container);
            }
        });


        test("Link: update", async () => {
            let { container, store } = renderWithWrappers(<App />, {
                route: "/objects/edit/1"
            });
        
            // Wait for the page to load and open display tab
            await waitFor(() => getByText(container, "Object Information"));
            clickDisplayTabButton(container);

            // Set feed timestamp to an empty string
            const { feedTimestampContainer } = getObjectDisplayControls(container);
            let rdtElements = getReactDatetimeElements(feedTimestampContainer);
            fireEvent.change(rdtElements.input, { target: { value: "" }});
            expect(store.getState().editedObjects[1].feed_timestamp).toEqual("");

            // Set feed timestamp to `newDate`
            const now = new Date();
            const newDate = new Date(now.getFullYear(), now.getMonth(), 10);
            await setFeedTimestampDate(container, newDate);
            expect(store.getState().editedObjects[1].feed_timestamp).toEqual(newDate.toISOString());

            // Update object and check if display setting is correctly saved
            let saveButton = getSideMenuItem(container, "Save");
            fireEvent.click(saveButton);
            await waitFor(() => expect(store.getState().objects[1].feed_timestamp).toEqual(newDate.toISOString()));
        });
    });


    describe("Display mode", () => {
        test("Link, Markdown, to-do list: control not rendered", async () => {
            const objectTypes = ["link", "markdown", "to_do_list", undefined];

            for (let i = 0; i < objectTypes.length - 1; i++) {
                const objectID = 1000 * i + 1;
                let { container } = renderWithWrappers(<App />, {
                    route: `/objects/edit/${objectID}`
                });
            
                // Wait for the page to load and open display tab
                await waitFor(() => getByText(container, "Object Information"));
                clickDisplayTabButton(container);

                // Check if control is not rendered
                expect(getObjectDisplayControls(container).displayMode.selected).toBeUndefined();

                ReactDOM.unmountComponentAtNode(container);
            }
        });


        test("Composite: default value & change", async () => {
            let { container, store } = renderWithWrappers(<App />, {
                route: "/objects/edit/3001"
            });
        
            // Wait for the page to load and open display tab
            await waitFor(() => getByText(container, "Object Information"));
            clickDisplayTabButton(container);

            // Composite display mode: is rendered and eqaul "Basic" by default
            const displayModeControls = getObjectDisplayControls(container).displayMode;
            expect(displayModeControls.selected.textContent).toEqual("Basic");
            expect(getObjectDisplayControls(container).displayMode.selected.textContent).toEqual("Basic");

            // Select each display mode, except for `basic`
            for (let k of Object.keys(enumCompositeObjectDisplayModes)) {
                const mode = enumCompositeObjectDisplayModes[k].value;

                if (mode !== enumCompositeObjectDisplayModes.basic.value) {
                    fireEvent.click(displayModeControls.selected);
                    fireEvent.click(displayModeControls.options[mode]);
                    expect(store.getState().editedObjects[3001].composite.display_mode).toEqual(mode);
                }
            }

            // Select `basic` display mode
            fireEvent.click(displayModeControls.selected);
            fireEvent.click(displayModeControls.options.basic);
            expect(store.getState().editedObjects[3001].composite.display_mode).toEqual("basic");
        });
    });


    describe("Numerate chapters", () => {
        test("Link, markdown, to-do list: control not rendered", async () => {
            const objectTypes = ["link", "markdown", "to_do_list", undefined];

            for (let i = 0; i < objectTypes.length - 1; i++) {
                const objectID = 1000 * i + 1;
                let { container, store } = renderWithWrappers(<App />, {
                    route: `/objects/edit/${objectID}`
                });
            
                // Wait for the page to load and open display tab
                await waitFor(() => getByText(container, "Object Information"));
                clickDisplayTabButton(container);

                // Check if control is not rendered
                expect(getObjectDisplayControls(container).numerateChapters).toBeFalsy();

                ReactDOM.unmountComponentAtNode(container);
            }
        });


        test("Composite, non-chapters display mode: control not rendered", async () => {
            let { container } = renderWithWrappers(<App />, {
                route: "/objects/edit/3001"
            });
        
            // Wait for the page to load and open display tab
            await waitFor(() => getByText(container, "Object Information"));
            clickDisplayTabButton(container);

            for (let mode of Object.keys(enumCompositeObjectDisplayModes)) {
                mode = enumCompositeObjectDisplayModes[mode].value
                if (mode !== "chapters") {
                    const displayModeControls = getObjectDisplayControls(container).displayMode;

                    // Select display mode and check if numerate chapters control is not rendered
                    fireEvent.click(displayModeControls.selected);
                    fireEvent.click(displayModeControls.options[mode]);
                    
                    clickDisplayTabButton(container);
                    expect(getObjectDisplayControls(container).numerateChapters).toBeFalsy();
                }
            }
        });


        test("Composite, chapters display mode: default value, toggle & reset", async () => {
            let { container, store } = renderWithWrappers(<App />, {
                route: "/objects/edit/3001"
            });
        
            // Wait for the page to load and open display tab
            await waitFor(() => getByText(container, "Object Information"));
            clickDisplayTabButton(container);

            // Set display mode
            const displayModeControls = getObjectDisplayControls(container).displayMode;
            fireEvent.click(displayModeControls.selected);
            fireEvent.click(displayModeControls.options.chapters);

            // Toggle numerate chapters 3 times
            expect(store.getState().editedObjects[3001].composite.numerate_chapters).toBeFalsy();
            for (let i = 0; i < 3; i++) {
                clickNumerateChaptersCheckbox(container);
                expect(store.getState().editedObjects[3001].composite.numerate_chapters).toEqual(i % 2 === 0);
            }

            // Reset object
            resetObject(container);
            expect(store.getState().editedObjects[3001].composite.numerate_chapters).toBeFalsy();
        });
    });


    describe("Show description composite", () => {
        test("Link, markdown, to-do list, composite: control not rendered", async () => {
            const objectTypes = ["link", "markdown", "to_do_list", "composite"];

            for (let i = 0; i < objectTypes.length; i++) {
                const objectID = 1000 * i + 1;
                let { container } = renderWithWrappers(<App />, {
                    route: `/objects/edit/${objectID}`
                });
            
                // Wait for the page to load and open display tab
                await waitFor(() => getByText(container, "Object Information"));
                clickDisplayTabButton(container);

                // Check if control is not rendered
                expect(getObjectDisplayControls(container).showDescriptionComposite.selected).toBeUndefined();

                ReactDOM.unmountComponentAtNode(container);
            }
        });
    });


    describe("Show description as link composite", () => {
        test("Link, markdown, to-do list, composite: control not rendered", async () => {
            const objectTypes = ["link", "markdown", "to_do_list", "composite"];

            for (let i = 0; i < objectTypes.length; i++) {
                const objectID = 1000 * i + 1;
                let { container } = renderWithWrappers(<App />, {
                    route: `/objects/edit/${objectID}`
                });
            
                // Wait for the page to load and open display tab
                await waitFor(() => getByText(container, "Object Information"));
                clickDisplayTabButton(container);

                // Check if control is not rendered
                expect(getObjectDisplayControls(container).showDescriptionAsLinkComposite.selected).toBeUndefined();

                ReactDOM.unmountComponentAtNode(container);
            }
        });
    });
});


describe("Composite subobject display properties", () => {
    describe("Publish subobject", () => {
        test("Default value inheritance", async () => {
            const store = getStoreWithCompositeObjectAndSubobjectsOfEachType();
            let { container } = renderWithWrappers(<App />, {
                route: "/objects/edit/3201", store
            });

            // Wait for the page to load
            await waitFor(() => getByText(container, "Object Information"));
        
            // Publish object
            clickDisplayTabButton(container);
            clickPublishObjectCheckbox(container);
            expect(store.getState().editedObjects[3201].is_published).toBeTruthy();
        
            // Add a new subobject & check if it has the same `is_published` setting as parent
            clickDataTabButton(container);
            addANewSubobject(container);
            let firstSubobjectID = getSubobjectCards(container, { expectedNumbersOfCards: [5] })[0][4].id;
            expect(store.getState().editedObjects[firstSubobjectID].is_published).toBeTruthy();
        
            // Unpublish object
            clickDisplayTabButton(container);
            clickPublishObjectCheckbox(container);
            expect(store.getState().editedObjects[3201].is_published).toBeFalsy();
        
            // Add a new subobject & check if it has the same `is_published` setting as parent
            clickDataTabButton(container);
            addANewSubobject(container);
            let secondSubobjectID = getSubobjectCards(container, { expectedNumbersOfCards: [6] })[0][5].id;
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
            let firstSubobjectCard = getSubobjectCards(container, { expectedNumbersOfCards: [6] })[0][4];
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
            const store = getStoreWithCompositeObjectAndSubobjectsOfEachType();
            let { container } = renderWithWrappers(<App />, {
                route: "/objects/edit/3201", store
            });

            // Wait for the page to load
            await waitFor(() => getByText(container, "Object Information"));

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
            const store = getStoreWithCompositeObjectAndSubobjectsOfEachType();
            let { container } = renderWithWrappers(<App />, {
                route: "/objects/edit/3201", store
            });

            // Wait for the page to load
            await waitFor(() => getByText(container, "Object Information"));

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
            expect(store.getState().editedObjects[subobjectID].is_published).toEqual(true);

            // Update object and check if display settings are correctly saved
            let saveButton = getSideMenuItem(container, "Save");
            fireEvent.click(saveButton);

            await waitFor(() => expect(store.getState().objects[subobjectID].is_published).toEqual(true));
        });
    });


    describe("Show description composite", () => {
        test("Link, markdown, to-do list, composite: toggle & reset", async () => {
            const store = getStoreWithCompositeObjectAndSubobjectsOfEachType();
            let { container } = renderWithWrappers(<App />, {
                route: "/objects/edit/3201", store
            });

            // Wait for the page to load
            await waitFor(() => getByText(container, "Object Information"));

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
                expect(store.getState().editedObjects[3201].composite.subobjects[subobjectID].show_description_composite).toEqual("no");

                fireEvent.click(displayControls.showDescriptionComposite.selected);
                fireEvent.click(displayControls.showDescriptionComposite.options.inherit);
                expect(displayControls.showDescriptionComposite.selected.textContent).toEqual("Inherit");
                expect(store.getState().editedObjects[3201].composite.subobjects[subobjectID].show_description_composite).toEqual("inherit");

                fireEvent.click(displayControls.showDescriptionComposite.selected);
                fireEvent.click(displayControls.showDescriptionComposite.options.yes);
                expect(displayControls.showDescriptionComposite.selected.textContent).toEqual("Yes");
                expect(store.getState().editedObjects[3201].composite.subobjects[subobjectID].show_description_composite).toEqual("yes");

                // Reset subobject
                resetSubobject(subobjectCard);
                expect(store.getState().editedObjects[3201].composite.subobjects[subobjectID].show_description_composite).toEqual("inherit");
            }
        });


        test("Link: update", async () => {
            const store = getStoreWithCompositeObjectAndSubobjectsOfEachType();
            let { container } = renderWithWrappers(<App />, {
                route: "/objects/edit/3201", store
            });

            // Wait for the page to load
            await waitFor(() => getByText(container, "Object Information"));

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
            expect(store.getState().editedObjects[3201].composite.subobjects[subobjectID].show_description_composite).toEqual("yes");

            // Update object and check if display settings are correctly saved
            let saveButton = getSideMenuItem(container, "Save");
            fireEvent.click(saveButton);

            await waitFor(() => expect(store.getState().composite[3201].subobjects[subobjectID].show_description_composite).toEqual("yes"));
        });
    });


    describe("Show description as link composite", () => {
        test("Markdown, to-do list, composite: not rendered", async () => {
            const store = getStoreWithCompositeObjectAndSubobjectsOfEachType();
            let { container } = renderWithWrappers(<App />, {
                route: "/objects/edit/3201", store
            });

            // Wait for the page to load
            await waitFor(() => getByText(container, "Object Information"));

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
            const store = getStoreWithCompositeObjectAndSubobjectsOfEachType();
            let { container } = renderWithWrappers(<App />, {
                route: "/objects/edit/3201", store
            });

            // Wait for the page to load
            await waitFor(() => getByText(container, "Object Information"));

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
            expect(store.getState().editedObjects[3201].composite.subobjects[subobjectID].show_description_as_link_composite).toEqual("no");

            fireEvent.click(displayControls.showDescriptionAsLinkComposite.selected);
            fireEvent.click(displayControls.showDescriptionAsLinkComposite.options.inherit);
            expect(displayControls.showDescriptionAsLinkComposite.selected.textContent).toEqual("Inherit");
            expect(store.getState().editedObjects[3201].composite.subobjects[subobjectID].show_description_as_link_composite).toEqual("inherit");

            fireEvent.click(displayControls.showDescriptionAsLinkComposite.selected);
            fireEvent.click(displayControls.showDescriptionAsLinkComposite.options.yes);
            expect(displayControls.showDescriptionAsLinkComposite.selected.textContent).toEqual("Yes");
            expect(store.getState().editedObjects[3201].composite.subobjects[subobjectID].show_description_as_link_composite).toEqual("yes");

            // Reset subobject
            resetSubobject(subobjectCard);
            expect(store.getState().editedObjects[3201].composite.subobjects[subobjectID].show_description_as_link_composite).toEqual("inherit");
        });


        test("Link: update", async () => {
            const store = getStoreWithCompositeObjectAndSubobjectsOfEachType();
            let { container } = renderWithWrappers(<App />, {
                route: "/objects/edit/3201", store
            });

            // Wait for the page to load
            await waitFor(() => getByText(container, "Object Information"));

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
            expect(store.getState().editedObjects[3201].composite.subobjects[subobjectID].show_description_as_link_composite).toEqual("yes");

            // Update object and check if display settings are correctly saved
            let saveButton = getSideMenuItem(container, "Save");
            fireEvent.click(saveButton);

            await waitFor(() => expect(store.getState().composite[3201].subobjects[subobjectID].show_description_as_link_composite).toEqual("yes"));
        });
    });


    describe("Display in feed", () => {
        test("Default value of a new subobject", async () => {
            const store = getStoreWithCompositeObjectAndSubobjectsOfEachType();
            let { container } = renderWithWrappers(<App />, {
                route: "/objects/edit/3201", store
            });

            // Wait for the page to load
            await waitFor(() => getByText(container, "Object Information"));

            // Open data tab and add a new subobject
            clickDataTabButton(container);
            addANewSubobject(container);
            const cards = getSubobjectCards(container, { expectedNumbersOfCards: [5] });
            const subobjectID = cards[0][4].id;
            expect(store.getState().editedObjects[subobjectID].display_in_feed).toEqual(false);
        });


        test("Link, markdown, to-do list, composite: toggle & reset", async () => {
            const store = getStoreWithCompositeObjectAndSubobjectsOfEachType();
            let { container } = renderWithWrappers(<App />, {
                route: "/objects/edit/3201", store
            });

            // Wait for the page to load
            await waitFor(() => getByText(container, "Object Information"));

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
            const store = getStoreWithCompositeObjectAndSubobjectsOfEachType();
            let { container } = renderWithWrappers(<App />, {
                route: "/objects/edit/3201", store
            });

            // Wait for the page to load
            await waitFor(() => getByText(container, "Object Information"));

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

            // Update object and check if display settings are correctly saved
            let saveButton = getSideMenuItem(container, "Save");
            fireEvent.click(saveButton);

            await waitFor(() => expect(store.getState().objects[subobjectID].display_in_feed).toEqual(true));
        });
    });


    describe("Feed timestamp", () => {
        test("Link, markdown, to-do list: toggle & reset", async () => {
            const store = getStoreWithCompositeObjectAndSubobjectsOfEachType();
            let { container } = renderWithWrappers(<App />, {
                route: "/objects/edit/3201", store
            });

            // Wait for the page to load
            await waitFor(() => getByText(container, "Object Information"));

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

                // Set feed timestamp to an empty string
                const { feedTimestampContainer } = getObjectDisplayControls(subobjectCard);
                let rdtElements = getReactDatetimeElements(feedTimestampContainer);
                fireEvent.change(rdtElements.input, { target: { value: "" }});
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
            const store = getStoreWithCompositeObjectAndSubobjectsOfEachType();
            let { container } = renderWithWrappers(<App />, {
                route: "/objects/edit/3201", store
            });

            // Wait for the page to load
            await waitFor(() => getByText(container, "Object Information"));

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

            // Set feed timestamp to an empty string
            const { feedTimestampContainer } = getObjectDisplayControls(subobjectCard);
            let rdtElements = getReactDatetimeElements(feedTimestampContainer);
            fireEvent.change(rdtElements.input, { target: { value: "" }});
            expect(store.getState().editedObjects[subobjectID].feed_timestamp).toEqual("");

            // Set feed timestamp to `newDate`
            const now = new Date();
            const newDate = new Date(now.getFullYear(), now.getMonth(), 10);
            await setFeedTimestampDate(subobjectCard, newDate);
            expect(store.getState().editedObjects[subobjectID].feed_timestamp).toEqual(newDate.toISOString());

            // Update object and check if display settings are correctly saved
            let saveButton = getSideMenuItem(container, "Save");
            fireEvent.click(saveButton);

            await waitFor(() => expect(store.getState().objects[subobjectID].feed_timestamp).toEqual(newDate.toISOString()));
        });
    });


    describe("Show description; show description as link; display mode; numerate chapters", () => {
        test("Link, markdown, to-do list, composite: not rendered", async () => {
            const store = getStoreWithCompositeObjectAndSubobjectsOfEachType();
            let { container } = renderWithWrappers(<App />, {
                route: "/objects/edit/3201", store
            });

            // Wait for the page to load
            await waitFor(() => getByText(container, "Object Information"));

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
                expect(getObjectDisplayControls(subobjectCard).numerateChapters).toBeFalsy();

                // Select `chapters` display mode for composite object and check again
                if (subobjectObjectTypes[i] === "composite") {
                    const displayModeControls = getObjectDisplayControls(subobjectCard).displayMode;
                    fireEvent.click(displayModeControls.selected);
                    fireEvent.click(displayModeControls.options.chapters);

                    expect(getObjectDisplayControls(subobjectCard).numerateChapters).toBeFalsy();
                }
            }
        });
    });
});
