import React from "react";
import { Route } from "react-router-dom";

import { fireEvent, screen } from "@testing-library/react";
import { getByText, getByPlaceholderText, waitFor } from "@testing-library/dom";

import { createTestStore } from "../_util/create-test-store";
import { renderWithWrappers } from "../_util/render";
import { getSideMenuItem } from "../_util/ui-common";

import { NewTag, EditTag } from "../../src/components/top-level/tag";
import { addTags } from "../../src/actions/data-tags";


/*
    /tags/new page tests.
*/
beforeEach(() => {
    // isolate fetch mock to avoid tests state collision because of cached data in fetch
    jest.isolateModules(() => {
        const { mockFetch, setFetchFail } = require("../_mocks/mock-fetch");
        // reset fetch mocks
        jest.resetAllMocks();
        global.fetch = jest.fn(mockFetch);
        global.setFetchFail = jest.fn(setFetchFail);
    });
});


test("Render authenticated-only route without a token", async () => {
    const store = createTestStore({ addAdminToken: false });
    let { container, history } = renderWithWrappers(<Route exact path="/tags/:id"><NewTag /></Route>, {
        route: "/tags/new",
        store
    });

    await waitFor(() => expect(history.entries[history.length - 1].pathname).toBe(`/auth/login`));
});

// - protected routes:
//     - render protected routes which require admin token without token;
//     - render protected routes which require no token with an admin token;
//     - render a protected route with an expired token (mock 401 fetch response);
//     - fetch with an expired token results in token clear & redirect to login page;