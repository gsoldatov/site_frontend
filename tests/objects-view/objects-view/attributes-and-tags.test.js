import React from "react";

import { fireEvent } from "@testing-library/react";
import { waitFor } from "@testing-library/dom";

import { createTestStore } from "../../_util/create-test-store";
import { renderWithWrappers } from "../../_util/render";
import { getObjectsViewCardElements } from "../../_util/ui-objects-view";
import { getFeedElements } from "../../_util/ui-index";
import { getInlineItem } from "../../_util/ui-inline";

import { resetEditedObjects } from "../../../src/actions/objects-edit";
import { addObjectData, addObjects } from "../../../src/actions/data-objects";

import { App } from "../../../src/components/top-level/app";


/*
    /objects/view/:id page tests, attributes and tags.
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
    await waitFor(() => expect(getObjectsViewCardElements({ container }).attributes.description.element).toBeTruthy());
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
    await waitFor(() => expect(getObjectsViewCardElements({ container }).attributes.description.element).toBeTruthy());
});


test("Object tags", async () => {
    let { history, container, store } = renderWithWrappers(<App />, {
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

    // Check redireact to /tags/view page
    fireEvent.click(getInlineItem({ item: cardElements.tags.tagElements[0] }).link);
    expect(history.entries[history.entries.length - 1].pathname).toEqual("/tags/view");
    expect(history.entries[history.entries.length - 1].search).toEqual(`?tagIDs=1`);
    await waitFor(() => expect(getFeedElements(container).placeholders.loading).toBeFalsy());
});
