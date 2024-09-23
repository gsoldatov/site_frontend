import React from "react";

import { resetTestConfig } from "../_mocks/config";
import { renderWithWrappers } from "../_util/render";
import { getTagsViewElements } from "../_util/ui-tags-view";

import { App } from "../../src/components/top-level/app";
import { waitFor } from "@testing-library/react";


/*
    /tags/view select tags prompt tests.
*/
beforeEach(() => {
    // isolate fetch mock to avoid tests state collision because of cached data in fetch
    jest.isolateModules(() => {
        const { mockFetch, setFetchFail } = require("../_mocks/mock-fetch");
        
        // Set test app configuration
        resetTestConfig();
        
        // reset fetch mocks
        jest.resetAllMocks();
        global.fetch = jest.fn(mockFetch);
        global.setFetchFail = jest.fn(setFetchFail);
    });
});


test("No selected tags", async () => {
    let { container } = renderWithWrappers(<App />, {
        route: "/tags/view"
    });

    const elements = getTagsViewElements(container);
    expect(elements.selectPrompt).toBeTruthy();
});


test("No valid tags", async () => {
    let { container } = renderWithWrappers(<App />, {
        route: "/tags/view?tagIDs=0,-1,asd"
    });

    const elements = getTagsViewElements(container);
    expect(elements.selectPrompt).toBeTruthy();
});


test("Valid selected tags", async () => {
    let { container } = renderWithWrappers(<App />, {
        route: "/tags/view?tagIDs=0,-1,1,2"
    });

    await waitFor(() => expect(getTagsViewElements(container).feed.placeholders.loading).toBeFalsy());

    const elements = getTagsViewElements(container);
    expect(elements.selectPrompt).toBeFalsy();
});
