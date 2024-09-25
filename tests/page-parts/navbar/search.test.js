import React from "react";
import { fireEvent, waitFor } from "@testing-library/dom";

import { getNavigationBarElements } from "../../_util/ui-navbar";
import { getSearchPageElements, submitSearchQueryWithNavbar } from "../../_util/ui-search";
import { resetTestConfig } from "../../_mocks/config";
import { renderWithWrappers } from "../../_util/render";
import { getFeedElements } from "../../_util/ui-index";

import { App } from "../../../src/components/top-level/app";


/*
    Navigation bar search tests.
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


test("Submit correct query with Enter keypress", async () => {
    let { container, historyManager } = renderWithWrappers(<App />, {
        route: "/"
    });

    // Wait for the page to load
    await waitFor(() => expect(getFeedElements(container).placeholders.loading).toBeFalsy());

    // Enter and submit query
    await submitSearchQueryWithNavbar(container, historyManager, "some text");
});


test("Submit correct query with button click", async () => {
    let { container, historyManager } = renderWithWrappers(<App />, {
        route: "/"
    });

    // Wait for the page to load
    await waitFor(() => expect(getFeedElements(container).placeholders.loading).toBeFalsy());

    // Enter and submit query
    const query = "some text";
    const { search } = getNavigationBarElements(container);
    fireEvent.change(search.input, { target: { value: query } });
    fireEvent.click(search.button);

    // Check if redirect occured
    historyManager.ensureCurrentURL("/search");
    expect(historyManager.getCurrentURLSeachParam("q")).toEqual(query);

    // Wait for search fetch to end
    await waitFor(() => expect(getSearchPageElements(container).feed.placeholders.loading).toBeFalsy());
});


test("Submit an empty query", async () => {
    let { container, historyManager } = renderWithWrappers(<App />, {
        route: "/"
    });

    // Wait for the page to load
    await waitFor(() => expect(getFeedElements(container).placeholders.loading).toBeFalsy());

    // Enter and submit query
    const { search } = getNavigationBarElements(container);
    fireEvent.keyDown(search.input, { key: "Enter", code: "Enter" });

    // Check if redirect did not occur
    historyManager.ensureCurrentURL("/");
});
