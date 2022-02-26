import React from "react";

import { fireEvent } from "@testing-library/react";
import { getByPlaceholderText, waitFor, screen } from "@testing-library/dom";

import { createTestStore } from "../_util/create-test-store";
import { renderWithWrappers } from "../_util/render";
import { getObjectsViewCardElements } from "../_util/ui-objects-view";
import { compositeWithGroupedLinksDisplayMode, compositeWithGroupedLinksDisplayModeAndNoLinkSubobjects, compositeMulticolumnDisplayMode } from "../_mocks/data-composite";
import { handleView } from "../_mocks/mock-fetch-handlers-objects";
import { compareArrays } from "../_util/data-checks";

import { resetEditedObjects } from "../../src/actions/objects-edit";
import { addObjectData, addObjects } from "../../src/actions/data-objects";

import { App } from "../../src/components/top-level/app";
import { deepCopy } from "../../src/util/copy";


/*
    /objects/view/:id page tests.
*/
beforeEach(() => {
    // isolate fetch mock to avoid tests state collision because of cached data in fetch
    jest.isolateModules(() => {
        const { mockFetch, setFetchFail, addCustomRouteResponse } = require("../_mocks/mock-fetch");
        // reset fetch mocks
        jest.resetAllMocks();
        global.fetch = jest.fn(mockFetch);
        global.setFetchFail = jest.fn(setFetchFail);
        global.addCustomRouteResponse = jest.fn(addCustomRouteResponse);
    });
});


describe("General", () => {
    test("Loading placeholder & fetch error", async () => {
        setFetchFail(true);

        let { container } = renderWithWrappers(<App />, {
            route: "/objects/view/1"
        });

        // Loading placeholder is rendered initially
        expect(getObjectsViewCardElements({ container }).placeholders.loading).toBeTruthy();

        // Error message is displayed when loading fetch is failed
        await waitFor(() => expect(getObjectsViewCardElements({ container }).placeholders.loading).toBeFalsy());
        expect(getObjectsViewCardElements({ container }).placeholders.fetchError).toBeTruthy();
    });
});


describe("Main object attributes & tags", () => {
    test("Timestamp", async () => {
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/view/1"
        });

        // Wait for the page to load
        await waitFor(() => expect(getObjectsViewCardElements({ container }).placeholders.loading).toBeFalsy());

        // Check if feed timestamp is displayed
        let cardElements = getObjectsViewCardElements({ container });
        let ed = new Date(store.getState().objects[1].feed_timestamp), dd = new Date(cardElements.attributes.timestamp.element.textContent);
        expect(ed.getFullYear() === dd.getFullYear() && ed.getMonth() === dd.getMonth() && ed.getDate() === dd.getDate()).toBeTruthy();

        // Check if modified at is used as a fallback for missing feed timestamp
        store.dispatch(addObjects([{ ...store.getState().objects[1], feed_timestamp: "" }]));
        cardElements = getObjectsViewCardElements({ container });
        ed = new Date(store.getState().objects[1].modified_at), dd = new Date(cardElements.attributes.timestamp.element.textContent);
        expect(ed.getFullYear() === dd.getFullYear() && ed.getMonth() === dd.getMonth() && ed.getDate() === dd.getDate()).toBeTruthy();
    });

    test("Header (logged as admin)", async () => {
        let { container, store, history } = renderWithWrappers(<App />, {
            route: "/objects/view/1"
        });

        // Wait for the page to load
        await waitFor(() => expect(getObjectsViewCardElements({ container }).placeholders.loading).toBeFalsy());

        // Check if header is displayed
        const cardElements = getObjectsViewCardElements({ container });
        expect(cardElements.attributes.header.headerText.textContent).toEqual(store.getState().objects[1].object_name);

        // Check if view button is not displayed
        expect(cardElements.attributes.header.viewButton).toBeFalsy();

        // Check if edit button is displayed and working
        fireEvent.click(cardElements.attributes.header.editButton);
        expect(history.entries[history.length - 1].pathname).toBe("/objects/edit/1");
    });

    test("Header (anonymous)", async () => {
        const store = createTestStore({ addAdminToken: false });
        let { container } = renderWithWrappers(<App />, {
            route: "/objects/view/1", store
        });

        // Wait for the page to load
        await waitFor(() => expect(getObjectsViewCardElements({ container }).placeholders.loading).toBeFalsy());

        // Check if header is displayed
        const cardElements = getObjectsViewCardElements({ container });
        expect(cardElements.attributes.header.headerText.textContent).toEqual(store.getState().objects[1].object_name);

        // Check if view and edit buttons are not displayed
        expect(cardElements.attributes.header.viewButton).toBeFalsy();
        expect(cardElements.attributes.header.editButton).toBeFalsy();
    });


    test("'Object is edited' message", async () => {
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/view/1"
        });

        // Wait for the page to load
        await waitFor(() => expect(getObjectsViewCardElements({ container }).placeholders.loading).toBeFalsy());

        // Check if message is not displayed
        expect(getObjectsViewCardElements({ container }).attributes.objectIsEdited.element).toBeFalsy();
        
        // Add object to state.editedObjects & check if message if dispalyed
        store.dispatch(resetEditedObjects({ objectIDs: [1] }));
        expect(getObjectsViewCardElements({ container }).attributes.objectIsEdited.element).toBeTruthy();
    });


    test("Object description (link)", async () => {
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/view/1"
        });

        // Wait for the page to load
        await waitFor(() => expect(getObjectsViewCardElements({ container }).placeholders.loading).toBeFalsy());

        // !show_description && !show_description_as_link
        expect(store.getState().objects[1].show_description).toBeFalsy();
        expect(store.getState().links[1].show_description_as_link).toBeFalsy();
        expect(getObjectsViewCardElements({ container }).attributes.description.element).toBeFalsy();

        // !show_description && show_description_as_link
        let linkData = { ...store.getState().links[1], show_description_as_link: true };
        store.dispatch(addObjectData([{ object_id: 1, object_type: "link", object_data: linkData }]));
        expect(getObjectsViewCardElements({ container }).attributes.description.element).toBeFalsy();

        // show_description && show_description_as_link
        let objectAttributes = { ...store.getState().objects[1], show_description: true };
        store.dispatch(addObjects([ objectAttributes ]));
        expect(getObjectsViewCardElements({ container }).attributes.description.element).toBeFalsy();

        // show_description && !show_description_as_link
        linkData = { ...store.getState().links[1], show_description_as_link: false };
        store.dispatch(addObjectData([{ object_id: 1, object_type: "link", object_data: linkData }]));
        expect(getObjectsViewCardElements({ container }).attributes.description.element).toBeTruthy();
    });


    test("Object description (non-link)", async () => {
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/view/1001"
        });

        // Wait for the page to load
        await waitFor(() => expect(getObjectsViewCardElements({ container }).placeholders.loading).toBeFalsy());

        // !show_description
        expect(store.getState().objects[1001].show_description).toBeFalsy();
        expect(getObjectsViewCardElements({ container }).attributes.description.element).toBeFalsy();

        // show_description
        let objectAttributes = { ...store.getState().objects[1001], show_description: true };
        store.dispatch(addObjects([ objectAttributes ]));
        expect(getObjectsViewCardElements({ container }).attributes.description.element).toBeTruthy();
    });


    test("Object tags", async () => {
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/view/1"
        });

        // Wait for the page to load
        await waitFor(() => expect(getObjectsViewCardElements({ container }).placeholders.loading).toBeFalsy());

        // Check if tags are rendered
        const cardElements = getObjectsViewCardElements({ container });
        expect(cardElements.tags.isRendered).toBeTruthy();

        // Check if each tag name is displayed
        const state = store.getState();
        expect(state.objectsTags[1].length).toEqual(5);

        const renderedTagNames = [...cardElements.tags.tagElements].map(e => e.querySelector("span").textContent);        
        expect(renderedTagNames.length).toEqual(5);
        
        state.objectsTags[1].forEach(tagID => expect(renderedTagNames.indexOf(state.tags[tagID].tag_name)).toBeGreaterThan(-1));
    });
});


describe("Non-composite object data", () => {
    test("Link", async () => {
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/view/1"
        });

        // Wait for the page to load
        await waitFor(() => expect(getObjectsViewCardElements({ container }).placeholders.loading).toBeFalsy());

        // !show_description_as_link
        expect(store.getState().links[1].show_description_as_link).toBeFalsy();
        
        const linkURL = store.getState().links[1].link;
        let linkElement = getObjectsViewCardElements({ container }).data.link.element;
        expect(linkElement.textContent).toEqual(linkURL);
        expect(linkElement.href).toEqual(linkURL + (linkURL.endsWith("/") ? "" : "/"));        // href prop adds a slash at the end

        // !show_description && show_description_as_link
        let linkData = { ...store.getState().links[1], show_description_as_link: true };
        store.dispatch(addObjectData([{ object_id: 1, object_type: "link", object_data: linkData }]));

        expect(linkElement.textContent).toEqual(store.getState().objects[1].object_description);
        expect(linkElement.href).toEqual(linkURL + (linkURL.endsWith("/") ? "" : "/"));        // href prop adds a slash at the end
    });


    test("Markdown", async () => {
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/view/1001"
        });

        // Wait for the page to load
        await waitFor(() => expect(getObjectsViewCardElements({ container }).placeholders.loading).toBeFalsy());

        // Change markdown raw_text
        store.dispatch(addObjectData([{ object_id: 1001, object_type: "markdown", object_data: { raw_text: "# Some text" }}]));

        // Check if updated markdown is rendered
        await waitFor(() => {
            const markdownContainer = getObjectsViewCardElements({ container }).data.markdown.container;
            expect(markdownContainer).toBeTruthy();

            const renrederedHeader = markdownContainer.querySelector("h3");
            expect(renrederedHeader).toBeTruthy();
            expect(renrederedHeader.textContent).toEqual("Some text");
        });
    });


    test("To-do list (logged as admin)", async () => {
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/view/2001"
        });

        // Wait for the page to load
        await waitFor(() => expect(getObjectsViewCardElements({ container }).placeholders.loading).toBeFalsy());

        // Check if "readonly" message is not displayed
        expect(getObjectsViewCardElements({ container }).data.toDoList.isReadOnlyMessage).toBeFalsy();

        // Add a new item and check if it was saved
        const TDLContainer = getObjectsViewCardElements({ container }).data.toDoList.container;
        expect(Object.keys(store.getState().toDoLists[2001].items).length).toEqual(8);      // 8 items are returned by default
        const newItemInput = getByPlaceholderText(TDLContainer, "New item");
        fireEvent.input(newItemInput, { target: { innerHTML: "added item" }});
        
        await waitFor(() => expect(Object.keys(store.getState().toDoLists[2001].items).length).toEqual(9));
        expect(store.getState().toDoLists[2001].items[8].item_text).toEqual("added item");

        // Add a new item with fetch error and check if an error message is displayed
        setFetchFail(true);
        fireEvent.input(newItemInput, { target: { innerHTML: "second added item" }});
        await waitFor(() => expect(getObjectsViewCardElements({ container }).data.toDoList.fetchError).toBeTruthy());
        expect(Object.keys(store.getState().toDoLists[2001].items).length).toEqual(9);
    });


    test("To-do list (anonymous)", async () => {
        const store = createTestStore({ addAdminToken: false });
        let { container } = renderWithWrappers(<App />, {
            route: "/objects/view/2001", store
        });

        // Wait for the page to load
        await waitFor(() => expect(getObjectsViewCardElements({ container }).placeholders.loading).toBeFalsy());

        // Check if "readonly" message is displayed
        expect(getObjectsViewCardElements({ container }).data.toDoList.isReadOnlyMessage).toBeTruthy();

        // Add a new item and check if it was not saved
        const TDLContainer = getObjectsViewCardElements({ container }).data.toDoList.container;
        expect(Object.keys(store.getState().toDoLists[2001].items).length).toEqual(8);      // 8 items are returned by default
        const newItemInput = getByPlaceholderText(TDLContainer, "New item");
        fireEvent.input(newItemInput, { target: { innerHTML: "added item" }});

        try {
            await waitFor(() => expect(Object.keys(store.getState().toDoLists[2001].items).length).toEqual(9));
            throw Error("To-do list was updated in anonymous mode");
        } catch (e) {}
        expect(Object.keys(store.getState().toDoLists[2001].items).length).toEqual(8);
    });
});


describe("Composite object data, basic display mode", () => {
    describe("Subobject display order", () => {
        test("Multicolumn composite object", async () => {
            let { container, store } = renderWithWrappers(<App />, {
                route: "/objects/view/3906"
            });

            // Wait for the page to load
            await waitFor(() => expect(getObjectsViewCardElements({ container }).placeholders.loading).toBeFalsy());

            // Check if cards are displayed in correct order (column asc -> row asc)
            const subobjectCards = getObjectsViewCardElements({ container }).data.compositeBasic.subobjectCards;
            expect(subobjectCards.length).toEqual(6);
            expect([...subobjectCards].map(card => parseInt(getObjectsViewCardElements({ card }).objectID))).toEqual([101, 102, 103, 104, 105, 106]);
        });
    });


    describe("Subobject attributes & tags", () => {
        test("Timestamp", async () => {
            let { container, store } = renderWithWrappers(<App />, {
                route: "/objects/view/3901"
            });

            // Wait for the page to load
            await waitFor(() => expect(getObjectsViewCardElements({ container }).placeholders.loading).toBeFalsy());
            const subobjectCards = getObjectsViewCardElements({ container }).data.compositeBasic.subobjectCards;
            expect(subobjectCards.length).toEqual(4);
            await waitFor(() => expect(getObjectsViewCardElements({ card: subobjectCards[0] }).placeholders.loading).toBeFalsy());
            const cardElements = getObjectsViewCardElements({ card: subobjectCards[0] });

            // Check if timestamp is not displayed for subobject
            expect(cardElements.attributes.timestamp.element).toBeFalsy();
        });

        test("Header + edit button (logged as admin)", async () => {
            let { container, store, history } = renderWithWrappers(<App />, {
                route: "/objects/view/3901"
            });

            // Wait for the page to load
            await waitFor(() => expect(getObjectsViewCardElements({ container }).placeholders.loading).toBeFalsy());
            const subobjectCards = getObjectsViewCardElements({ container }).data.compositeBasic.subobjectCards;
            expect(subobjectCards.length).toEqual(4);
            await waitFor(() => expect(getObjectsViewCardElements({ card: subobjectCards[0] }).placeholders.loading).toBeFalsy());
            const cardElements = getObjectsViewCardElements({ card: subobjectCards[0] });

            // Check if header is displayed
            expect(cardElements.attributes.header.headerText.textContent).toEqual(store.getState().objects[cardElements.objectID].object_name);

            // Check if edit button is displayed and working
            fireEvent.click(cardElements.attributes.header.editButton);
            expect(history.entries[history.length - 1].pathname).toBe(`/objects/edit/${cardElements.objectID}`);
        });


        test("Header + view button (logged as admin)", async () => {
            let { container, store, history } = renderWithWrappers(<App />, {
                route: "/objects/view/3901"
            });

            // Wait for the page to load
            await waitFor(() => expect(getObjectsViewCardElements({ container }).placeholders.loading).toBeFalsy());
            const subobjectCards = getObjectsViewCardElements({ container }).data.compositeBasic.subobjectCards;
            expect(subobjectCards.length).toEqual(4);
            await waitFor(() => expect(getObjectsViewCardElements({ card: subobjectCards[0] }).placeholders.loading).toBeFalsy());
            const cardElements = getObjectsViewCardElements({ card: subobjectCards[0] });

            // Check if header is displayed
            expect(cardElements.attributes.header.headerText.textContent).toEqual(store.getState().objects[cardElements.objectID].object_name);

            // Check if view button is displayed and working
            fireEvent.click(cardElements.attributes.header.viewButton);
            expect(history.entries[history.length - 1].pathname).toBe(`/objects/view/${cardElements.objectID}`);
            await waitFor(() => {});    // end page load to correctly end the test
        });


        test("Header (anonymous)", async () => {
            const store = createTestStore({ addAdminToken: false });
            let { container, history } = renderWithWrappers(<App />, {
                route: "/objects/view/3901", store
            });

            // Wait for the page to load
            await waitFor(() => expect(getObjectsViewCardElements({ container }).placeholders.loading).toBeFalsy());
            const subobjectCards = getObjectsViewCardElements({ container }).data.compositeBasic.subobjectCards;
            expect(subobjectCards.length).toEqual(4);
            await waitFor(() => expect(getObjectsViewCardElements({ card: subobjectCards[0] }).placeholders.loading).toBeFalsy());
            let cardElements = getObjectsViewCardElements({ card: subobjectCards[0] });

            // Change is_published value of checked subobject to true to correctly test view button (non-published objects are returned)
            let objectAttributes = { ...store.getState().objects[cardElements.objectID], is_published: true };
            store.dispatch(addObjects([ objectAttributes ]));
            cardElements = getObjectsViewCardElements({ card: subobjectCards[0] });

            // Check if header is displayed
            expect(cardElements.attributes.header.headerText.textContent).toEqual(store.getState().objects[cardElements.objectID].object_name);

            // Check if edit buttons is not displayed
            expect(cardElements.attributes.header.editButton).toBeFalsy();

            // Check if view button is displayed and working
            fireEvent.click(cardElements.attributes.header.viewButton);
            expect(history.entries[history.length - 1].pathname).toBe(`/objects/view/${cardElements.objectID}`);
            await waitFor(() => {});    // end page load to correctly end the test
        });


        test("'Object is edited' message", async () => {
            let { container, store } = renderWithWrappers(<App />, {
                route: "/objects/view/3901"
            });

            // Wait for the page to load
            await waitFor(() => expect(getObjectsViewCardElements({ container }).placeholders.loading).toBeFalsy());
            const subobjectCards = getObjectsViewCardElements({ container }).data.compositeBasic.subobjectCards;
            expect(subobjectCards.length).toEqual(4);
            await waitFor(() => expect(getObjectsViewCardElements({ card: subobjectCards[0] }).placeholders.loading).toBeFalsy());
            let cardElements = getObjectsViewCardElements({ card: subobjectCards[0] });

            // Check if message is not displayed
            expect(cardElements.attributes.objectIsEdited.element).toBeFalsy();
            
            // Add object to state.editedObjects & check if message if dispalyed
            store.dispatch(resetEditedObjects({ objectIDs: [cardElements.objectID] }));
            expect(getObjectsViewCardElements({ card: subobjectCards[0] }).attributes.objectIsEdited.element).toBeTruthy();
        });


        test("Object description (link)", async () => {
            let { container, store } = renderWithWrappers(<App />, {
                route: "/objects/view/3901"
            });

            // Wait for the page to load
            await waitFor(() => expect(getObjectsViewCardElements({ container }).placeholders.loading).toBeFalsy());
            const subobjectCards = getObjectsViewCardElements({ container }).data.compositeBasic.subobjectCards;
            expect(subobjectCards.length).toEqual(4);
            await waitFor(() => expect(getObjectsViewCardElements({ card: subobjectCards[0] }).placeholders.loading).toBeFalsy());
            let cardElements = getObjectsViewCardElements({ card: subobjectCards[0] });

            // show_description_composite = yes & show_description_as_link_composite = yes
            let compositeData = deepCopy(store.getState().composite[3901]);
            compositeData.subobjects[cardElements.objectID].show_description_composite = "yes";
            compositeData.subobjects[cardElements.objectID].show_description_as_link_composite = "yes";
            compositeData.subobjects = Object.keys(compositeData.subobjects).map(subobjectID => ({ ...compositeData.subobjects[subobjectID], object_id: subobjectID }));
            store.dispatch(addObjectData([{ object_id: 3901, object_type: "composite", object_data: compositeData }]));
            
            expect(getObjectsViewCardElements({ card: subobjectCards[0] }).attributes.description.element).toBeFalsy();

            // show_description_composite = yes & show_description_as_link_composite = no
            compositeData = deepCopy(store.getState().composite[3901]);
            compositeData.subobjects[cardElements.objectID].show_description_as_link_composite = "no";
            compositeData.subobjects = Object.keys(compositeData.subobjects).map(subobjectID => ({ ...compositeData.subobjects[subobjectID], object_id: subobjectID }));
            store.dispatch(addObjectData([{ object_id: 3901, object_type: "composite", object_data: compositeData }]));

            expect(getObjectsViewCardElements({ card: subobjectCards[0] }).attributes.description.element).toBeTruthy();
        });


        test("Object description (non-link)", async () => {
            let { container, store } = renderWithWrappers(<App />, {
                route: "/objects/view/3901"
            });

            // Wait for the page to load
            await waitFor(() => expect(getObjectsViewCardElements({ container }).placeholders.loading).toBeFalsy());
            const subobjectCards = getObjectsViewCardElements({ container }).data.compositeBasic.subobjectCards;
            expect(subobjectCards.length).toEqual(4);
            await waitFor(() => expect(getObjectsViewCardElements({ card: subobjectCards[0] }).placeholders.loading).toBeFalsy());
            let cardElements = getObjectsViewCardElements({ card: subobjectCards[0] });


            // show_description_composite = yes & !show_description
            let compositeData = deepCopy(store.getState().composite[3901]);
            compositeData.subobjects[cardElements.objectID].show_description_composite = "yes";
            compositeData.subobjects = Object.keys(compositeData.subobjects).map(subobjectID => ({ ...compositeData.subobjects[subobjectID], object_id: subobjectID }));
            store.dispatch(addObjectData([{ object_id: 3901, object_type: "composite", object_data: compositeData }]));

            let objectAttributes = { ...store.getState().objects[cardElements.objectID], show_description: false };
            store.dispatch(addObjects([ objectAttributes ]));

            expect(getObjectsViewCardElements({ card: subobjectCards[0] }).attributes.description.element).toBeTruthy();

            // show_description_composite = inherit & !show_description;
            compositeData = deepCopy(store.getState().composite[3901]);
            compositeData.subobjects[cardElements.objectID].show_description_composite = "inherit";
            compositeData.subobjects = Object.keys(compositeData.subobjects).map(subobjectID => ({ ...compositeData.subobjects[subobjectID], object_id: subobjectID }));
            store.dispatch(addObjectData([{ object_id: 3901, object_type: "composite", object_data: compositeData }]));

            expect(getObjectsViewCardElements({ card: subobjectCards[0] }).attributes.description.element).toBeFalsy();

            // show_description_composite = inherit & show_description;
            objectAttributes = { ...store.getState().objects[cardElements.objectID], show_description: true };
            store.dispatch(addObjects([ objectAttributes ]));

            expect(getObjectsViewCardElements({ card: subobjectCards[0] }).attributes.description.element).toBeTruthy();

            // show_description_composite = no & show_description;
            compositeData = deepCopy(store.getState().composite[3901]);
            compositeData.subobjects[cardElements.objectID].show_description_composite = "no";
            compositeData.subobjects = Object.keys(compositeData.subobjects).map(subobjectID => ({ ...compositeData.subobjects[subobjectID], object_id: subobjectID }));
            store.dispatch(addObjectData([{ object_id: 3901, object_type: "composite", object_data: compositeData }]));

            expect(getObjectsViewCardElements({ card: subobjectCards[0] }).attributes.description.element).toBeFalsy();
        });


        test("Object tags", async () => {
            let { container, store } = renderWithWrappers(<App />, {
                route: "/objects/view/3901"
            });

            // Wait for the page to load
            await waitFor(() => expect(getObjectsViewCardElements({ container }).placeholders.loading).toBeFalsy());
            const subobjectCards = getObjectsViewCardElements({ container }).data.compositeBasic.subobjectCards;
            expect(subobjectCards.length).toEqual(4);
            await waitFor(() => expect(getObjectsViewCardElements({ card: subobjectCards[0] }).placeholders.loading).toBeFalsy());
            let cardElements = getObjectsViewCardElements({ card: subobjectCards[0] });

            // Check if tags are not rendered
            expect(cardElements.tags.isRendered).toBeFalsy();
        });
    });


    describe("Subobject object data", () => {
        test("Link", async () => {
            let { container, store } = renderWithWrappers(<App />, {
                route: "/objects/view/3901"
            });

            // Wait for the page to load
            await waitFor(() => expect(getObjectsViewCardElements({ container }).placeholders.loading).toBeFalsy());
            const subobjectCards = getObjectsViewCardElements({ container }).data.compositeBasic.subobjectCards;
            expect(subobjectCards.length).toEqual(4);
            await waitFor(() => expect(getObjectsViewCardElements({ card: subobjectCards[0] }).placeholders.loading).toBeFalsy());
            const cardElements = getObjectsViewCardElements({ card: subobjectCards[0] });
            expect(store.getState().objects[cardElements.objectID].object_type).toEqual("link");

            const linkURL = store.getState().links[cardElements.objectID].link;
            let linkElement = cardElements.data.link.element;

            // show_description_as_link_composite = yes & !show_description_as_link
            let compositeData = deepCopy(store.getState().composite[3901]);
            compositeData.subobjects[cardElements.objectID].show_description_as_link_composite = "yes";
            compositeData.subobjects = Object.keys(compositeData.subobjects).map(subobjectID => ({ ...compositeData.subobjects[subobjectID], object_id: subobjectID }));
            store.dispatch(addObjectData([{ object_id: 3901, object_type: "composite", object_data: compositeData }]));

            let linkData = { ...store.getState().links[cardElements.objectID], show_description_as_link: false };
            store.dispatch(addObjectData([{ object_id: cardElements.objectID, object_type: "link", object_data: linkData }]));

            expect(linkElement.textContent).toEqual(store.getState().objects[cardElements.objectID].object_description);
            expect(linkElement.href).toEqual(linkURL + (linkURL.endsWith("/") ? "" : "/"));        // href prop adds a slash at the end

            // show_description_as_link_composite = inherit & !show_description_as_link
            compositeData = deepCopy(store.getState().composite[3901]);
            compositeData.subobjects[cardElements.objectID].show_description_as_link_composite = "inherit";
            compositeData.subobjects = Object.keys(compositeData.subobjects).map(subobjectID => ({ ...compositeData.subobjects[subobjectID], object_id: subobjectID }));
            store.dispatch(addObjectData([{ object_id: 3901, object_type: "composite", object_data: compositeData }]));

            expect(linkElement.textContent).toEqual(linkURL);

            // show_description_as_link_composite = inherit & show_description_as_link
            linkData = { ...store.getState().links[cardElements.objectID], show_description_as_link: true };
            store.dispatch(addObjectData([{ object_id: cardElements.objectID, object_type: "link", object_data: linkData }]));

            expect(linkElement.textContent).toEqual(store.getState().objects[cardElements.objectID].object_description);

            // show_description_as_link_composite = no & show_description_as_link
            compositeData = deepCopy(store.getState().composite[3901]);
            compositeData.subobjects[cardElements.objectID].show_description_as_link_composite = "no";
            compositeData.subobjects = Object.keys(compositeData.subobjects).map(subobjectID => ({ ...compositeData.subobjects[subobjectID], object_id: subobjectID }));
            store.dispatch(addObjectData([{ object_id: 3901, object_type: "composite", object_data: compositeData }]));

            expect(linkElement.textContent).toEqual(linkURL);
        });


        test("Markdown", async () => {
            let { container, store } = renderWithWrappers(<App />, {
                route: "/objects/view/3901"
            });

            // Wait for the page to load
            await waitFor(() => expect(getObjectsViewCardElements({ container }).placeholders.loading).toBeFalsy());
            const subobjectCards = getObjectsViewCardElements({ container }).data.compositeBasic.subobjectCards;
            expect(subobjectCards.length).toEqual(4);
            await waitFor(() => expect(getObjectsViewCardElements({ card: subobjectCards[1] }).placeholders.loading).toBeFalsy());
            const cardElements = getObjectsViewCardElements({ card: subobjectCards[1] });
            expect(store.getState().objects[cardElements.objectID].object_type).toEqual("markdown");
    
            // Change markdown raw_text
            store.dispatch(addObjectData([{ object_id: cardElements.objectID, object_type: "markdown", object_data: { raw_text: "# Some text" }}]));
    
            // Check if updated markdown is rendered
            await waitFor(() => {
                const markdownContainer = getObjectsViewCardElements({ card: subobjectCards[1] }).data.markdown.container;
                expect(markdownContainer).toBeTruthy();
    
                const renrederedHeader = markdownContainer.querySelector("h3");
                expect(renrederedHeader).toBeTruthy();
                expect(renrederedHeader.textContent).toEqual("Some text");
            });
        });


        test("To-do list (logged as admin)", async () => {
            let { container, store } = renderWithWrappers(<App />, {
                route: "/objects/view/3901"
            });

            // Wait for the page to load
            await waitFor(() => expect(getObjectsViewCardElements({ container }).placeholders.loading).toBeFalsy());
            const subobjectCards = getObjectsViewCardElements({ container }).data.compositeBasic.subobjectCards;
            expect(subobjectCards.length).toEqual(4);
            await waitFor(() => expect(getObjectsViewCardElements({ card: subobjectCards[2] }).placeholders.loading).toBeFalsy());
            const cardElements = getObjectsViewCardElements({ card: subobjectCards[2] });
            expect(store.getState().objects[cardElements.objectID].object_type).toEqual("to_do_list");
    
            // Check if "readonly" message is not displayed
            expect(cardElements.data.toDoList.isReadOnlyMessage).toBeFalsy();
    
            // Add a new item and check if it was saved
            const TDLContainer = cardElements.data.toDoList.container;
            expect(Object.keys(store.getState().toDoLists[cardElements.objectID].items).length).toEqual(8);      // 8 items are returned by default
            const newItemInput = getByPlaceholderText(TDLContainer, "New item");
            fireEvent.input(newItemInput, { target: { innerHTML: "added item" }});
            
            await waitFor(() => expect(Object.keys(store.getState().toDoLists[cardElements.objectID].items).length).toEqual(9));
            expect(store.getState().toDoLists[cardElements.objectID].items[8].item_text).toEqual("added item");
    
            // Add a new item with fetch error and check if an error message is displayed
            setFetchFail(true);
            fireEvent.input(newItemInput, { target: { innerHTML: "second added item" }});
            await waitFor(() => expect(getObjectsViewCardElements({ card: subobjectCards[2] }).data.toDoList.fetchError).toBeTruthy());
            expect(Object.keys(store.getState().toDoLists[cardElements.objectID].items).length).toEqual(9);
        });


        test("Composite", async () => {
            let { container, store, history } = renderWithWrappers(<App />, {
                route: "/objects/view/3901"
            });

            // Wait for the page to load
            await waitFor(() => expect(getObjectsViewCardElements({ container }).placeholders.loading).toBeFalsy());
            const subobjectCards = getObjectsViewCardElements({ container }).data.compositeBasic.subobjectCards;
            expect(subobjectCards.length).toEqual(4);
            await waitFor(() => expect(getObjectsViewCardElements({ card: subobjectCards[3] }).placeholders.loading).toBeFalsy());
            const cardElements = getObjectsViewCardElements({ card: subobjectCards[3] });
            expect(store.getState().objects[cardElements.objectID].object_type).toEqual("composite");

            // Check if link to subobject standalone page is rendered and working
            fireEvent.click(cardElements.data.compositeSubobjectBasic.linkToViewPage);
            expect(history.entries[history.length - 1].pathname).toBe(`/objects/view/${cardElements.objectID}`);
            await waitFor(() => {});    // end page load to correctly end the test
        });
    });
});


describe("Composite object data, grouped links display mode", () => {
    test("Loading & error placeholders", async () => {
        // Add a fetch failure for grouped links on load fetch
        addCustomRouteResponse("/objects/view", "POST", { generator: body => {
            const parsedBody = JSON.parse(body);

            if ("object_ids" in parsedBody) {
                const sortedObjectIDs = parsedBody.object_ids.sort();
                const expectedSubobjectIDs = compositeWithGroupedLinksDisplayMode.subobjects.map(s => s.object_id).sort();
                if (!compareArrays(sortedObjectIDs, expectedSubobjectIDs)) return null;
                
                // Throw network error when fetching subobjects of `compositeWithGroupedLinksDisplayMode`
                throw TypeError("NetworkError");
            }
        }});

        // Render page
        let { container } = renderWithWrappers(<App />, {
            route: "/objects/view/3907"
        });

        // Wait for main object to load and check if grouped_links placeholder is displayed by default
        await waitFor(() => expect(getObjectsViewCardElements({ container }).data.compositeGroupedLinks.placeholders.loading).toBeTruthy());

        // Wait for fetch error to be displayed
        await waitFor(() => expect(getObjectsViewCardElements({ container }).data.compositeGroupedLinks.placeholders.loading).toBeFalsy());
        expect(getObjectsViewCardElements({ container }).data.compositeGroupedLinks.placeholders.fetchError).toBeTruthy();
    });


    test("Missing objects display", async () => {
        // Add a custom fetch response, which will filter some of the composite subobject links
        addCustomRouteResponse("/objects/view", "POST", { generator: body => {
            // Get default reponse and filter it
            const response = handleView(body);
            const filteredObjectIDs = [1, 1001];

            if ("objects" in response.body)
                response.body.objects = response.body.objects.filter(object => filteredObjectIDs.indexOf(parseInt(object.object_id)) === -1);

            if ("object_data" in response.body)                
                response.body.object_data = response.body.object_data.filter(object => filteredObjectIDs.indexOf(parseInt(object.object_id)) === -1);
            
            if (response.status === 200 && response.body.objects.length === 0 && response.body.object_data.length === 0)
                response.status === 404
            
            return response;
        }});

        // Render page
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/view/3907"
        });

        // Wait for subobjects to load
        await waitFor(() => expect(getObjectsViewCardElements({ container }).data.compositeGroupedLinks.placeholders.loading).toBeTruthy());
        await waitFor(() => expect(getObjectsViewCardElements({ container }).data.compositeGroupedLinks.placeholders.loading).toBeFalsy());

        // Check if loaded non-link objects are correctly displayed
        const objectsViewCardElements = getObjectsViewCardElements({ container });
        expect(objectsViewCardElements.data.compositeGroupedLinks.subobjectCards.length).toEqual(4 - 1);    // 4 returned by mock, 1 filtered out
        const displayedNonLinkIDs = objectsViewCardElements.data.compositeGroupedLinks.subobjectCards.map(card => parseInt(getObjectsViewCardElements({ card }).objectID));
        expect(compareArrays(displayedNonLinkIDs, [2001, 3001, 1002]));

        // Check links table
        expect(objectsViewCardElements.data.compositeGroupedLinks.linksCard.linkRows.length).toEqual(3 - 1);    // 3 returned by mock, 1 filtered out
        const state = store.getState();
        const expectedLinkIDs = [2, 3];
        for (let i = 0; i < expectedLinkIDs.length; i++) {
            const row = objectsViewCardElements.data.compositeGroupedLinks.linksCard.linkRows[i];
            expect(row.link.href.replace(/\/$/g, "")).toEqual(state.links[expectedLinkIDs[i]].link);
            expect(row.link.textContent).toEqual(state.objects[expectedLinkIDs[i]].object_name);
            expect(row.description.textContent).toEqual(state.objects[expectedLinkIDs[i]].object_descripiton);
        }
    });


    test("Correct display, object without link subobjects", async () => {
        // Render page
        let { container } = renderWithWrappers(<App />, {
            route: "/objects/view/3908"
        });

        // Wait for subobjects to load
        await waitFor(() => expect(getObjectsViewCardElements({ container }).data.compositeGroupedLinks.placeholders.loading).toBeTruthy());
        await waitFor(() => expect(getObjectsViewCardElements({ container }).data.compositeGroupedLinks.placeholders.loading).toBeFalsy());

        // Check non-link objects
        const objectsViewCardElements = getObjectsViewCardElements({ container });
        expect(objectsViewCardElements.data.compositeGroupedLinks.subobjectCards.length).toEqual(3);
        const expectedNonLinkIDs = compositeWithGroupedLinksDisplayModeAndNoLinkSubobjects.subobjects.map(subobject => subobject.object_id);
        const renderedNonLinkIDs = objectsViewCardElements.data.compositeGroupedLinks.subobjectCards.map(card => parseInt(getObjectsViewCardElements({ card }).objectID));
        expect(compareArrays(expectedNonLinkIDs, renderedNonLinkIDs)).toBeTruthy();

        // Check link subobjects
        expect(objectsViewCardElements.data.compositeGroupedLinks.linksCard.header).toBeFalsy();
        expect(objectsViewCardElements.data.compositeGroupedLinks.linksCard.linkRows.length).toEqual(0);
    });


    test("Correct display", async () => {
        // Render page
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/view/3907"
        });

        // Wait for subobjects to load
        await waitFor(() => expect(getObjectsViewCardElements({ container }).data.compositeGroupedLinks.placeholders.loading).toBeTruthy());
        await waitFor(() => expect(getObjectsViewCardElements({ container }).data.compositeGroupedLinks.placeholders.loading).toBeFalsy());

        // Check non-link objects
        const objectsViewCardElements = getObjectsViewCardElements({ container });
        expect(objectsViewCardElements.data.compositeGroupedLinks.subobjectCards.length).toEqual(4);
        const expectedNonLinkIDs = compositeWithGroupedLinksDisplayMode.subobjects.map(subobject => subobject.object_id).filter(id => id >= 1000);
        const renderedNonLinkIDs = objectsViewCardElements.data.compositeGroupedLinks.subobjectCards.map(card => parseInt(getObjectsViewCardElements({ card }).objectID));
        expect(compareArrays(expectedNonLinkIDs, renderedNonLinkIDs)).toBeTruthy();

        // Check link subobjects
        expect(objectsViewCardElements.data.compositeGroupedLinks.linksCard.header).toBeTruthy();
        expect(objectsViewCardElements.data.compositeGroupedLinks.linksCard.linkRows.length).toEqual(3);
        const expectedLinkIDs = compositeWithGroupedLinksDisplayMode.subobjects.map(subobject => subobject.object_id).filter(id => id < 1000);
        const state = store.getState();

        for (let i = 0; i < expectedLinkIDs.length; i++) {
            const row = objectsViewCardElements.data.compositeGroupedLinks.linksCard.linkRows[i];
            expect(row.link.href.replace(/\/$/g, "")).toEqual(state.links[expectedLinkIDs[i]].link);
            expect(row.link.textContent).toEqual(state.objects[expectedLinkIDs[i]].object_name);
            expect(row.description.textContent).toEqual(state.objects[expectedLinkIDs[i]].object_descripiton);
        }
    });
});


describe("Composite object data, multicolumn display mode", () => {
    test("Loading & error placeholders", async () => {
        // Add a fetch failure for grouped link on load fetch
        addCustomRouteResponse("/objects/view", "POST", { generator: body => {
            const parsedBody = JSON.parse(body);

            if ("object_ids" in parsedBody) {
                const queriedObjectIDs = parsedBody.object_ids;
                const expectedSubobjectIDs = compositeMulticolumnDisplayMode.subobjects.map(s => s.object_id);
                if (expectedSubobjectIDs.indexOf(queriedObjectIDs[0]) === -1) return null;
                
                // Throw network error when fetching any subobject of `compositeMulticolumnDisplayMode`
                throw TypeError("NetworkError");
            }
        }});

        // Render page
        let { container } = renderWithWrappers(<App />, {
            route: "/objects/view/3909"
        });

        // Wait for main object to load and check if subobject cards are rendered
        await waitFor(() => {
            const compositeMulticolumn = getObjectsViewCardElements({ container }).data.compositeMulticolumn;

            const expectedSubobjectCardCounts = [];
            compositeMulticolumnDisplayMode.subobjects.forEach(subobject => {
                const column = subobject.column;
                expectedSubobjectCardCounts[column] = expectedSubobjectCardCounts[column] ? expectedSubobjectCardCounts[column] + 1 : 1;
            });

            expect(compositeMulticolumn.subobjectCards.length).toEqual(expectedSubobjectCardCounts.length);

            for (let i = 0; i < expectedSubobjectCardCounts.length; i++)
                expect(compositeMulticolumn.subobjectCards[i].length).toEqual(expectedSubobjectCardCounts[i]);
        });

        // Wait for fetch errors in subobject cards to be displayed
        await waitFor(() => {
            const subobjectCard = getObjectsViewCardElements({ container }).data.compositeMulticolumn.subobjectCards[0][0];
            expect(getObjectsViewCardElements({ card: subobjectCard }).placeholders.fetchError).toBeTruthy();
        });
    });


    test("Missing subobject display", async () => {
        // Add a fetch failure for grouped link on load fetch
        addCustomRouteResponse("/objects/view", "POST", { generator: body => {
            const parsedBody = JSON.parse(body);

            if ("object_ids" in parsedBody) {
                const queriedObjectIDs = parsedBody.object_ids;
                const missingSubobjectID = compositeMulticolumnDisplayMode.subobjects.filter(s => s.column === 0 && s.row === 0)[0].object_id;
                if (queriedObjectIDs[0] !== missingSubobjectID) return null;
                
                // Return 404 for a particular subboject
                return { status: 404 };
            }
        }});

        // Render page
        let { store, container } = renderWithWrappers(<App />, {
            route: "/objects/view/3909"
        });

        // Wait for main object to load and check if subobject cards are rendered
        await waitFor(() => {
            const compositeMulticolumn = getObjectsViewCardElements({ container }).data.compositeMulticolumn;

            const expectedSubobjectCardCounts = [];
            compositeMulticolumnDisplayMode.subobjects.forEach(subobject => {
                const column = subobject.column;
                expectedSubobjectCardCounts[column] = expectedSubobjectCardCounts[column] ? expectedSubobjectCardCounts[column] + 1 : 1;
            });

            expect(compositeMulticolumn.subobjectCards.length).toEqual(expectedSubobjectCardCounts.length);

            for (let i = 0; i < expectedSubobjectCardCounts.length; i++)
                expect(compositeMulticolumn.subobjectCards[i].length).toEqual(expectedSubobjectCardCounts[i]);
        });

        // Wait for error to be displayed in the first card
        await waitFor(() => {
            const subobjectCard = getObjectsViewCardElements({ container }).data.compositeMulticolumn.subobjectCards[0][0];
            expect(getObjectsViewCardElements({ card: subobjectCard }).placeholders.fetchError).toBeTruthy();
        });

        // Wait for another subobject to be correctly displayed
        await waitFor(() => {
            const subobjectCard = getObjectsViewCardElements({ container }).data.compositeMulticolumn.subobjectCards[0][1];
            const cardElements = getObjectsViewCardElements({ card: subobjectCard });
            expect(cardElements.placeholders.loading).toBeFalsy();
            const subobjectID = cardElements.objectID;
            expect(cardElements.attributes.header.headerText.textContent).toEqual(store.getState().objects[subobjectID].object_name);
        });
    });


    test("Correct display", async () => {
        // Render page
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/view/3909"
        });

        await waitFor(() => {
            // Wait for subobjects to load
            const subobjectCards = getObjectsViewCardElements({ container }).data.compositeMulticolumn.subobjectCards;
            subobjectCards.forEach(column => {
                column.forEach(card => {
                    const cardElements = getObjectsViewCardElements({ card });
                    expect(cardElements.placeholders.loading).toBeFalsy();
                    const subobjectID = cardElements.objectID;
                    expect(cardElements.attributes.header.headerText.textContent).toEqual(store.getState().objects[subobjectID].object_name);
                });
            });

            // Check if subobjects are displayed in the correct order
            compositeMulticolumnDisplayMode.subobjects.forEach(subobject => {
                const subobjectID = subobject.object_id.toString();
                expect(getObjectsViewCardElements({ card: subobjectCards[subobject.column][subobject.row] }).objectID).toEqual(subobjectID);
            })
        });
    });
});
