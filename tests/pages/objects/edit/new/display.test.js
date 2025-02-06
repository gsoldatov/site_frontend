import React from "react";

import { fireEvent } from "@testing-library/react";
import { getByText, waitFor } from "@testing-library/dom";

import { resetTestConfig } from "../../../../_mocks/config";
import { renderWithWrappers } from "../../../../_util/render";
import { getSideMenuItem } from "../../../../_util/ui-common";
import { clickDataTabButton, clickDisplayTabButton, getObjectDisplayControls, clickPublishObjectCheckbox, 
    clickPublishSubbjectsCheckbox, clickDisplayInFeedCheckbox, clickShowDescriptionCheckbox, clickShowDescriptionAsLinkCheckbox, clickNumerateChaptersCheckbox,
    resetObject, fillRequiredAttributesAndData, setObjectType, setFeedTimestampDate } from "../../../../_util/ui-objects-edit";
import { getSubobjectCards } from "../../../../_util/ui-composite";
import { getReactDatetimeElements } from "../../../../_util/ui-react-datetime";

import { App } from "../../../../../src/components/app";
import { updateEditedObject } from "../../../../../src/reducers/data/edited-objects";
import { compositeDisplayModeOptions } from "../../../../../src/store/types/ui/general/composite-display-mode";


/*
    /objects/edit/new page tests for new objects' display options.
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


describe("Publish object", () => {
    test("Link, markdown, to-do list, composite: default value, toggle & reset", async () => {
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/edit/new"
        });

        // Wait for the page to load
        await waitFor(() => getByText(container, "Add a New Object"));

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
        let { container, store, historyManager } = renderWithWrappers(<App />, {
            route: "/objects/edit/new"
        });

        // Wait for the page to load
        await waitFor(() => getByText(container, "Add a New Object"));

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
        await historyManager.waitForCurrentURLToBe(`/objects/edit/${object_id}`);

        const state = store.getState();
        expect(state.objects[object_id].is_published).toBeTruthy();
    });
});


describe("Publish subobjects", () => {
    test("Link, markdown, to-do list: control not rendered", async () => {
        let { container } = renderWithWrappers(<App />, {
            route: "/objects/edit/new"
        });

        // Wait for the page to load
        await waitFor(() => getByText(container, "Add a New Object"));

        for (let objectType of ["link", "markdown", "to_do_list"]) {
            // Set object type
            setObjectType(container, objectType);

            // Check if control is not rendered
            clickDisplayTabButton(container);
            expect(getObjectDisplayControls(container).publishSubobjects).toBeFalsy();
        }
    });


    test("Composite: reset", async () => {
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/edit/new"
        });

        // Wait for the page to load
        await waitFor(() => getByText(container, "Add a New Object"));

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
        let { container, store, historyManager } = renderWithWrappers(<App />, {
            route: "/objects/edit/new"
        });

        // Wait for the page to load
        await waitFor(() => getByText(container, "Add a New Object"));

        // Fill required attributes & data
        await fillRequiredAttributesAndData(container, store, { objectType: "composite" });

        clickDataTabButton(container);
        let cards = getSubobjectCards(container, { expectedNumbersOfCards: [2] });
        const [firstID, secondID] = cards[0].map(card => card.id);

        // Open display tab
        clickDisplayTabButton(container);

        // Publish one subobject => check if "Publish Subobjects" checkbox is indeterminate state
        store.dispatch(updateEditedObject(secondID, { is_published: true }));
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
        await historyManager.waitForCurrentURLToBe(`/objects/edit/${object_id}`);

        const state = store.getState();
        expect(state.objects[firstID].is_published).toBeTruthy();
        expect(state.objects[secondID].is_published).toBeTruthy();
    });
});


describe("Show description", () => {
    test("Link, markdown, to-do list, composite: default value, toggle & reset", async () => {
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/edit/new"
        });

        // Wait for the page to load
        await waitFor(() => getByText(container, "Add a New Object"));

        for (let objectType of ["link", "markdown", "to_do_list", "composite"]) {
            // Set object type
            setObjectType(container, objectType);

            // Open display tab
            clickDisplayTabButton(container);
        
            // Click checkbox 3 times
            expect(store.getState().editedObjects[0].show_description).toBeTruthy();
            for (let i = 0; i < 3; i++) {
                clickShowDescriptionCheckbox(container);
                expect(store.getState().editedObjects[0].show_description).toEqual(i % 2 !== 0);
            }

            // Reset object
            resetObject(container, false);
            expect(store.getState().editedObjects[0].show_description).toBeTruthy();
        }
    });


    test("Link: save", async () => {
        let { container, store, historyManager } = renderWithWrappers(<App />, {
            route: "/objects/edit/new"
        });

        // Wait for the page to load
        await waitFor(() => getByText(container, "Add a New Object"));

        // Fill required attributes & data
        await fillRequiredAttributesAndData(container, store, { objectType: "link" });

        // Toggle checkbox
        clickDisplayTabButton(container);

        for (let i = 0; i < 2; i++) {
            expect(store.getState().editedObjects[0].show_description).toEqual(i % 2 === 0);
            clickShowDescriptionCheckbox(container);
        }
        expect(store.getState().editedObjects[0].show_description).toBeTruthy();

        // Save object
        let saveButton = getSideMenuItem(container, "Save");
        fireEvent.click(saveButton);
        const object_id = 1000; // mock object returned has this id
        await historyManager.waitForCurrentURLToBe(`/objects/edit/${object_id}`);

        const state = store.getState();
        expect(state.objects[object_id].show_description).toBeTruthy();
    });
});


describe("Show description as link", () => {
    test("Markdown, to-do list, composite: control not rendered", async () => {
        let { container } = renderWithWrappers(<App />, {
            route: "/objects/edit/new"
        });

        // Wait for the page to load
        await waitFor(() => getByText(container, "Add a New Object"));

        for (let objectType of ["markdown", "to_do_list", "composite"]) {
            // Set object type
            setObjectType(container, objectType);

            // Check if control is not rendered
            clickDisplayTabButton(container);
            expect(getObjectDisplayControls(container).showDescriptionAsLink).toBeFalsy();
        }
    });


    test("Link: default value, toggle & reset", async () => {
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/edit/new"
        });

        // Wait for the page to load
        await waitFor(() => getByText(container, "Add a New Object"));

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
        let { container, store, historyManager } = renderWithWrappers(<App />, {
            route: "/objects/edit/new"
        });

        // Wait for the page to load
        await waitFor(() => getByText(container, "Add a New Object"));

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
        await historyManager.waitForCurrentURLToBe(`/objects/edit/${object_id}`);

        const state = store.getState();
        expect(state.links[object_id].show_description_as_link).toBeTruthy();
    });
});


describe("Display in feed", () => {
    test("Link, markdown, to-do list, composite: default value, toggle & reset", async () => {
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/edit/new"
        });

        // Wait for the page to load
        await waitFor(() => getByText(container, "Add a New Object"));

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
        let { container, store, historyManager } = renderWithWrappers(<App />, {
            route: "/objects/edit/new"
        });

        // Wait for the page to load
        await waitFor(() => getByText(container, "Add a New Object"));

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
        await historyManager.waitForCurrentURLToBe(`/objects/edit/${object_id}`);

        const state = store.getState();
        expect(state.objects[object_id].display_in_feed).toEqual(false);
    });
});


describe("Feed timestamp", () => {
    test("Link, markdown, to-do list, composite: default value, toggle & reset", async () => {
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/edit/new"
        });

        // Wait for the page to load
        await waitFor(() => getByText(container, "Add a New Object"));

        for (let objectType of ["link", "markdown", "to_do_list", "composite"]) {
            // Set object type
            setObjectType(container, objectType);

            // Open display tab
            clickDisplayTabButton(container);

            // Check default value
            expect(store.getState().editedObjects[0].feed_timestamp).toEqual(null);

            // Set feed timestamp to `newDate`
            const now = new Date();
            const newDate = new Date(now.getFullYear(), now.getMonth(), 10);
            await setFeedTimestampDate(container, newDate);
            expect(store.getState().editedObjects[0].feed_timestamp).toEqual(newDate.toISOString());

            // Reset object
            resetObject(container, false);
            expect(store.getState().editedObjects[0].feed_timestamp).toEqual(null);
            const { feedTimestampContainer } = getObjectDisplayControls(container);
            const { input } = getReactDatetimeElements(feedTimestampContainer);
            expect(input.textContent).toEqual("");
        }
    });


    test("Link: save", async () => {
        let { container, store, historyManager } = renderWithWrappers(<App />, {
            route: "/objects/edit/new"
        });

        // Wait for the page to load
        await waitFor(() => getByText(container, "Add a New Object"));

        // Fill required attributes & data
        await fillRequiredAttributesAndData(container, store, { objectType: "link" });

        // Open display tab
        clickDisplayTabButton(container);

        // Check default value
        expect(store.getState().editedObjects[0].feed_timestamp).toEqual(null);

        // Set feed timestamp to `newDate`
        const now = new Date();
        const newDate = new Date(now.getFullYear(), now.getMonth(), 10);
        await setFeedTimestampDate(container, newDate);
        expect(store.getState().editedObjects[0].feed_timestamp).toEqual(newDate.toISOString());

        // Save object
        let saveButton = getSideMenuItem(container, "Save");
        fireEvent.click(saveButton);
        const object_id = 1000; // mock object returned has this id
        await historyManager.waitForCurrentURLToBe(`/objects/edit/${object_id}`);

        const state = store.getState();
        expect(state.objects[object_id].feed_timestamp).toEqual(newDate.toISOString());
    });
});


describe("Display mode", () => {
    test("Link, Markdown, to-do list: control not rendered", async () => {
        let { container } = renderWithWrappers(<App />, {
            route: "/objects/edit/new"
        });

        // Wait for the page to load
        await waitFor(() => getByText(container, "Add a New Object"));

        for (let objectType of ["link", "markdown", "to_do_list"]) {
            // Set object type
            setObjectType(container, objectType);

            // Check if control is not rendered
            clickDisplayTabButton(container);
            expect(getObjectDisplayControls(container).displayMode.selected).toBeUndefined();
        }
    });


    test("Composite: default value & change", async () => {
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/edit/new"
        });

        // Wait for the page to load
        await waitFor(() => getByText(container, "Add a New Object"));

        // Set object type
        setObjectType(container, "composite");

        // Composite display mode: is rendered and eqaul "Basic" by default
        clickDisplayTabButton(container);
        const displayModeControls = getObjectDisplayControls(container).displayMode;
        expect(displayModeControls.selected.textContent).toEqual("Basic");

        // Select each display mode, except for `basic`
        for (let k of Object.keys(compositeDisplayModeOptions)) {
            const mode = compositeDisplayModeOptions[k].value;

            if (mode !== compositeDisplayModeOptions.basic.value) {
                fireEvent.click(displayModeControls.selected);
                fireEvent.click(displayModeControls.options[mode]);
                expect(store.getState().editedObjects[0].composite.display_mode).toEqual(mode);
            }
        }

        // Select `basic` display mode
        fireEvent.click(displayModeControls.selected);
        fireEvent.click(displayModeControls.options.basic);
        expect(store.getState().editedObjects[0].composite.display_mode).toEqual("basic");
    });
});

describe("Numerate chapters", () => {
    test("Link, markdown, to-do list: control not rendered", async () => {
        let { container } = renderWithWrappers(<App />, {
            route: "/objects/edit/new"
        });

        // Wait for the page to load
        await waitFor(() => getByText(container, "Add a New Object"));

        for (let objectType of ["link", "markdown", "to_do_list"]) {
            // Set object type
            setObjectType(container, objectType);

            // Check if control is not rendered
            clickDisplayTabButton(container);
            expect(getObjectDisplayControls(container).numerateChapters).toBeFalsy();
        }
    });


    test("Composite, non-chapters display mode: control not rendered", async () => {
        let { container } = renderWithWrappers(<App />, {
            route: "/objects/edit/new"
        });

        // Wait for the page to load
        await waitFor(() => getByText(container, "Add a New Object"));

        // Set object type
        setObjectType(container, "composite");
        clickDisplayTabButton(container);

        for (let mode of Object.keys(compositeDisplayModeOptions)) {
            mode = compositeDisplayModeOptions[mode].value
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
            route: "/objects/edit/new"
        });

        // Wait for the page to load
        await waitFor(() => getByText(container, "Add a New Object"));

        // Set object type and display mode
        setObjectType(container, "composite");
        clickDisplayTabButton(container);

        const displayModeControls = getObjectDisplayControls(container).displayMode;
        fireEvent.click(displayModeControls.selected);
        fireEvent.click(displayModeControls.options.chapters);

        // Toggle numerate chapters 3 times
        expect(store.getState().editedObjects[0].composite.numerate_chapters).toBeFalsy();
        for (let i = 0; i < 3; i++) {
            clickNumerateChaptersCheckbox(container);
            expect(store.getState().editedObjects[0].composite.numerate_chapters).toEqual(i % 2 === 0);
        }

        // Reset object
        resetObject(container);
        expect(store.getState().editedObjects[0].composite.numerate_chapters).toBeFalsy();
    });
});


describe("Show description composite", () => {
    test("Link, markdown, to-do list, composite: control not rendered", async () => {
        let { container } = renderWithWrappers(<App />, {
            route: "/objects/edit/new"
        });

        // Wait for the page to load
        await waitFor(() => getByText(container, "Add a New Object"));

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
        let { container } = renderWithWrappers(<App />, {
            route: "/objects/edit/new"
        });

        // Wait for the page to load
        await waitFor(() => getByText(container, "Add a New Object"));

        for (let objectType of ["link", "markdown", "to_do_list", "composite"]) {
            // Set object type
            setObjectType(container, objectType);

            // Check if control is not rendered
            clickDisplayTabButton(container);
            expect(getObjectDisplayControls(container).showDescriptionAsLinkComposite.selected).toBeFalsy();
        }
    });
});
