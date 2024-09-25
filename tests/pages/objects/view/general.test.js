import React from "react";

import { waitFor } from "@testing-library/dom";

import { resetTestConfig } from "../../../_mocks/config";
import { renderWithWrappers } from "../../../_util/render";
import { getObjectsViewCardElements } from "../../../_util/ui-objects-view";

import { App } from "../../../../src/components/app";


/*
    /objects/view/:id page tests, general.
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
