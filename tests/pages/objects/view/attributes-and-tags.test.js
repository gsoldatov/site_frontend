import React from "react";

import { fireEvent } from "@testing-library/react";
import { waitFor } from "@testing-library/dom";

import { resetTestConfig } from "../../../_mocks/config";
import { createTestStore } from "../../../_util/create-test-store";
import { renderWithWrappers } from "../../../_util/render";
import { getObjectsViewCardElements } from "../../../_util/ui-objects-view";
import { getFeedElements } from "../../../_util/ui-index";
import { getInlineItem } from "../../../_util/ui-inline";
import { compareDates } from "../../../_util/data-checks";

import { resetEditedObjects } from "../../../../src/actions/objects-edit";

import { App } from "../../../../src/components/app";


/*
    /objects/view/:id page tests, attributes and tags.
*/
beforeEach(() => {
    // isolate fetch mock to avoid tests state collision because of cached data in fetch
    jest.isolateModules(() => {
        const { mockFetch, setFetchFail, addCustomRouteResponse } = require("../../../_mocks/mock-fetch");
        
        // Set test app configuration
        resetTestConfig();
        
        // reset fetch mocks
        jest.resetAllMocks();
        global.fetch = jest.fn(mockFetch);
        global.setFetchFail = jest.fn(setFetchFail);
        global.addCustomRouteResponse = jest.fn(addCustomRouteResponse);
    });
});


test("Timestamp", async () => {
    let { container, storeManager } = renderWithWrappers(<App />, {
        route: "/objects/view/1"
    });

    // Wait for the page to load
    await waitFor(() => expect(getObjectsViewCardElements({ container }).placeholders.loading).toBeFalsy());

    // Check if feed timestamp is displayed
    let cardElements = getObjectsViewCardElements({ container });
    let ed = new Date(storeManager.store.getState().objects[1].feed_timestamp), dd = new Date(cardElements.attributes.timestamp.element.textContent);
    compareDates(ed, dd);

    // Check if modified at is used as a fallback for missing feed timestamp
    storeManager.objects.updateAttributes({ object_id: 1, feed_timestamp: "" });
    cardElements = getObjectsViewCardElements({ container });
    ed = new Date(storeManager.store.getState().objects[1].modified_at), dd = new Date(cardElements.attributes.timestamp.element.textContent);
    compareDates(ed, dd);
});


test("Header (logged as admin)", async () => {
    let { container, store, historyManager } = renderWithWrappers(<App />, {
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
    historyManager.ensureCurrentURL("/objects/edit/1");
});


test("Header (anonymous)", async () => {
    const { store } = createTestStore({ addAdminToken: false });
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
    let { container, storeManager } = renderWithWrappers(<App />, {
        route: "/objects/view/1"
    });

    // Wait for the page to load
    await waitFor(() => expect(getObjectsViewCardElements({ container }).placeholders.loading).toBeFalsy());

    // !show_description && !show_description_as_link
    expect(storeManager.store.getState().objects[1].show_description).toBeFalsy();
    expect(storeManager.store.getState().links[1].show_description_as_link).toBeFalsy();
    expect(getObjectsViewCardElements({ container }).attributes.description.element).toBeFalsy();

    // !show_description && show_description_as_link
    storeManager.objects.updateData(1, "link", { show_description_as_link: true });
    expect(getObjectsViewCardElements({ container }).attributes.description.element).toBeFalsy();

    // show_description && show_description_as_link
    storeManager.objects.updateAttributes({ object_id: 1, show_description: true });
    expect(getObjectsViewCardElements({ container }).attributes.description.element).toBeFalsy();

    // show_description && !show_description_as_link
    storeManager.objects.updateAttributes({ object_id: 1, show_description: true });
    storeManager.objects.updateData(1, "link", { show_description_as_link: false });
    await waitFor(() => expect(getObjectsViewCardElements({ container }).attributes.description.element).toBeTruthy());
});


test("Object description (non-link)", async () => {
    let { container, storeManager } = renderWithWrappers(<App />, {
        route: "/objects/view/1001"
    });

    // Wait for the page to load
    await waitFor(() => expect(getObjectsViewCardElements({ container }).placeholders.loading).toBeFalsy());

    // !show_description
    expect(storeManager.store.getState().objects[1001].show_description).toBeFalsy();
    expect(getObjectsViewCardElements({ container }).attributes.description.element).toBeFalsy();

    // show_description
    storeManager.objects.updateAttributes({ object_id: 1001, show_description: true });
    await waitFor(() => expect(getObjectsViewCardElements({ container }).attributes.description.element).toBeTruthy());
});


test("Object tags", async () => {
    let { container, store, historyManager } = renderWithWrappers(<App />, {
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
    historyManager.ensureCurrentURL("/tags/view");
    historyManager.ensureCurrentURLParams("?tagIDs=1");
    await waitFor(() => expect(getFeedElements(container).placeholders.loading).toBeFalsy());
});
