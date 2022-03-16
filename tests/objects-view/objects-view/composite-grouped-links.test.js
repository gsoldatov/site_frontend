import React from "react";

import { waitFor } from "@testing-library/dom";

import { renderWithWrappers } from "../../_util/render";
import { getObjectsViewCardElements } from "../../_util/ui-objects-view";
import { compositeWithGroupedLinksDisplayMode, compositeWithGroupedLinksDisplayModeAndNoLinkSubobjects, compositeMulticolumnDisplayMode } from "../../_mocks/data-composite";
import { handleView } from "../../_mocks/mock-fetch-handlers-objects";
import { compareArrays } from "../../_util/data-checks";

import { App } from "../../../src/components/top-level/app";


/*
    /objects/view/:id page tests, composite object data display in `grouped_links` display mode.
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
        const filteredObjectIDs = [201, 1201];

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
    const expectedLinkIDs = [202, 203];
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
