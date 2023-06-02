import React from "react";

import { fireEvent } from "@testing-library/react";
import { getByPlaceholderText, waitFor } from "@testing-library/dom";

import { createTestStore } from "../../_util/create-test-store";
import { renderWithWrappers } from "../../_util/render";
import { getObjectsViewCardElements } from "../../_util/ui-objects-view";
import { waitForMarkdownHeaderRender } from "../../_util/ui-markdown-editor";

import { resetEditedObjects } from "../../../src/actions/objects-edit";
import { addObjectData, addObjects } from "../../../src/actions/data-objects";

import { App } from "../../../src/components/top-level/app";
import { deepCopy } from "../../../src/util/copy";


/*
    /objects/view/:id page tests, composite object data display in `basic` display mode.
*/
beforeEach(() => {
    // isolate fetch mock to avoid tests state collision because of cached data in fetch
    jest.isolateModules(() => {
        const { mockFetch, setFetchFail, addCustomRouteResponse } = require("../../_mocks/mock-fetch");
        // reset fetch mocks
        jest.resetAllMocks();
        global.fetch = jest.fn(mockFetch);
        global.setFetchFail = jest.fn(setFetchFail);
        global.addCustomRouteResponse = jest.fn(addCustomRouteResponse);
    });
});


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

        await waitFor(() => expect(getObjectsViewCardElements({ card: subobjectCards[0] }).attributes.description.element).toBeTruthy());

        // Description Markdown is rendered
        let objectAttributes = { ...store.getState().objects[cardElements.objectID], object_description: "# Some text" };
        store.dispatch(addObjects([ objectAttributes ]));
        await waitForMarkdownHeaderRender({ renderedMarkdown: getObjectsViewCardElements({ card: subobjectCards[0] }).attributes.description.element, text: "Some text" });
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

        await waitFor(() => expect(getObjectsViewCardElements({ card: subobjectCards[0] }).attributes.description.element).toBeTruthy());

        // show_description_composite = inherit & !show_description;
        compositeData = deepCopy(store.getState().composite[3901]);
        compositeData.subobjects[cardElements.objectID].show_description_composite = "inherit";
        compositeData.subobjects = Object.keys(compositeData.subobjects).map(subobjectID => ({ ...compositeData.subobjects[subobjectID], object_id: subobjectID }));
        store.dispatch(addObjectData([{ object_id: 3901, object_type: "composite", object_data: compositeData }]));

        await waitFor(() => expect(getObjectsViewCardElements({ card: subobjectCards[0] }).attributes.description.element).toBeFalsy());

        // show_description_composite = inherit & show_description;
        objectAttributes = { ...store.getState().objects[cardElements.objectID], show_description: true };
        store.dispatch(addObjects([ objectAttributes ]));

        await waitFor(() => expect(getObjectsViewCardElements({ card: subobjectCards[0] }).attributes.description.element).toBeTruthy());

        // show_description_composite = no & show_description;
        compositeData = deepCopy(store.getState().composite[3901]);
        compositeData.subobjects[cardElements.objectID].show_description_composite = "no";
        compositeData.subobjects = Object.keys(compositeData.subobjects).map(subobjectID => ({ ...compositeData.subobjects[subobjectID], object_id: subobjectID }));
        store.dispatch(addObjectData([{ object_id: 3901, object_type: "composite", object_data: compositeData }]));

        await waitFor(() => expect(getObjectsViewCardElements({ card: subobjectCards[0] }).attributes.description.element).toBeFalsy());
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
        let { link, renderedMarkdown } = cardElements.data.link;

        // show_description_as_link_composite = yes & !show_description_as_link
        let compositeData = deepCopy(store.getState().composite[3901]);
        compositeData.subobjects[cardElements.objectID].show_description_as_link_composite = "yes";
        compositeData.subobjects = Object.keys(compositeData.subobjects).map(subobjectID => ({ ...compositeData.subobjects[subobjectID], object_id: subobjectID }));
        store.dispatch(addObjectData([{ object_id: 3901, object_type: "composite", object_data: compositeData }]));

        let linkData = { ...store.getState().links[cardElements.objectID], show_description_as_link: false };
        store.dispatch(addObjectData([{ object_id: cardElements.objectID, object_type: "link", object_data: linkData }]));

        expect(link.getAttribute("href")).toEqual(linkURL);
        await waitFor(() => {
            const renderedMarkdown = getObjectsViewCardElements({ card: subobjectCards[0] }).data.link.renderedMarkdown;
            const paragraph = renderedMarkdown.querySelector("p");
            expect(paragraph).toBeTruthy();
            expect(paragraph.textContent).toEqual(store.getState().objects[cardElements.objectID].object_description); 
        });

        // show_description_as_link_composite = inherit & !show_description_as_link
        compositeData = deepCopy(store.getState().composite[3901]);
        compositeData.subobjects[cardElements.objectID].show_description_as_link_composite = "inherit";
        compositeData.subobjects = Object.keys(compositeData.subobjects).map(subobjectID => ({ ...compositeData.subobjects[subobjectID], object_id: subobjectID }));
        store.dispatch(addObjectData([{ object_id: 3901, object_type: "composite", object_data: compositeData }]));

        await waitFor(() => { expect(renderedMarkdown.textContent).toEqual(linkURL); });

        // show_description_as_link_composite = inherit & show_description_as_link
        linkData = { ...store.getState().links[cardElements.objectID], show_description_as_link: true };
        store.dispatch(addObjectData([{ object_id: cardElements.objectID, object_type: "link", object_data: linkData }]));

        await waitFor(() => {
            const renderedMarkdown = getObjectsViewCardElements({ card: subobjectCards[0] }).data.link.renderedMarkdown;
            const paragraph = renderedMarkdown.querySelector("p");
            expect(paragraph).toBeTruthy();
            expect(paragraph.textContent).toEqual(store.getState().objects[cardElements.objectID].object_description); 
        });

        // show_description_as_link_composite = no & show_description_as_link
        compositeData = deepCopy(store.getState().composite[3901]);
        compositeData.subobjects[cardElements.objectID].show_description_as_link_composite = "no";
        compositeData.subobjects = Object.keys(compositeData.subobjects).map(subobjectID => ({ ...compositeData.subobjects[subobjectID], object_id: subobjectID }));
        store.dispatch(addObjectData([{ object_id: 3901, object_type: "composite", object_data: compositeData }]));

        await waitFor(() => { expect(renderedMarkdown.textContent).toEqual(linkURL); });
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
        
        await waitFor(() => expect(Object.keys(store.getState().toDoLists[cardElements.objectID].items).length).toEqual(9), { timeout: 2000 });
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
