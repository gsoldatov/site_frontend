import React from "react";

import { waitFor } from "@testing-library/dom";

import { resetTestConfig } from "../../_mocks/config";
import { renderWithWrappers } from "../../_util/render";
import { getObjectsViewCardElements } from "../../_util/ui-objects-view";
import { compositeMulticolumnDisplayMode } from "../../_mocks/data-composite";

import { App } from "../../../src/components/top-level/app";


/*
    /objects/view/:id page tests, composite object data display in `multicolumn` display mode.
*/
beforeEach(() => {
    // isolate fetch mock to avoid tests state collision because of cached data in fetch
    jest.isolateModules(() => {
        const { mockFetch, setFetchFail, addCustomRouteResponse } = require("../../_mocks/mock-fetch");
        
        // Set test app configuration
        resetTestConfig();
        
        // reset fetch mocks
        jest.resetAllMocks();
        global.fetch = jest.fn(mockFetch);
        global.setFetchFail = jest.fn(setFetchFail);
        global.addCustomRouteResponse = jest.fn(addCustomRouteResponse);
    });
});


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
