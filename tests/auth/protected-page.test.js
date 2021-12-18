import React from "react";
import ReactDOM from "react-dom";
import { waitFor } from "@testing-library/dom";

import { createTestStore } from "../_util/create-test-store";
import { renderWithWrappers } from "../_util/render";

import { App, isAnonymousCondition, isAuthenticatedCondition } from "../../src/components/top-level/app";
import { ProtectedRoute } from "../../src/components/common/protected-route";
import { setAuthInformation } from "../../src/actions/auth";

import { deepEqual } from "../../src/util/equality-checks";
import { getDefaultAuthState } from "../../src/store/state-templates/auth";


/*
    Tests for protected pages display.
*/
beforeEach(() => {
    // isolate fetch mock to avoid tests state collision because of cached data in fetch
    jest.isolateModules(() => {
        const { mockFetch, setFetchFail, addFixedRouteResponse } = require("../_mocks/mock-fetch");
        // reset fetch mocks
        jest.resetAllMocks();
        global.fetch = jest.fn(mockFetch);
        global.setFetchFail = jest.fn(setFetchFail);
        global.addFixedRouteResponse = jest.fn(addFixedRouteResponse);
    });
});


test("Render authenticated-only routes without a token", async () => {
    // // Get authenticated-only routes
    // const routes = App().props.children.filter(child => child.props.childrenRenderedSelector === isAuthenticatedCondition)
    //     .map(child => child.props.path.replace(":id", "1"));
    // expect(routes.length).toEqual(7);

    // Get authenticated-only routes
    let routes = [];
    let children = App().props.children.props.children;     // children of <Switch> component
    while (children.length > 0) {   // <ProtectedRoute> components may nest another <ProtectedRoute>, 
        const newChildren = [];

        children.forEach(child => {
            if (child.props.children.type === ProtectedRoute) newChildren.push(child.props.children);
            if (child.props.childrenRenderedSelector === isAuthenticatedCondition) routes.push(child.props.path.replace(":id", "1"));
        });

        children = newChildren;
    }

    expect(routes.length).toEqual(8);

    // Render each protected route without a token in store & check if it's redirected to login page
    for (let route of routes) {
        const store = createTestStore({ addAdminToken: false });
        let { container, history } = renderWithWrappers(<App />, { route, store });
        await waitFor(() => expect(history.entries[history.length - 1].pathname).toBe(`/auth/login`));
        ReactDOM.unmountComponentAtNode(container);
    }
});


test("Render anonymous-only routes with a token", async () => {
    // // Get anonymous-only routes
    // const routes = App().props.children.filter(child => child.props.childrenRenderedSelector === isAnonymousCondition)
    //     .map(child => child.props.path.replace(":id", "1"));
    // expect(routes.length).toEqual(2);

    // Get anonymous-only routes
    let routes = [];
    let children = App().props.children.props.children;     // children of <Switch> component
    while (children.length > 0) {   // <ProtectedRoute> components may nest another <ProtectedRoute>, 
        const newChildren = [];

        children.forEach(child => {
            if (child.props.children.type === ProtectedRoute) newChildren.push(child.props.children);
            if (child.props.childrenRenderedSelector === isAnonymousCondition) routes.push(child.props.path.replace(":id", "1"));
        });

        children = newChildren;
    }

    expect(routes.length).toEqual(2);

    // Render each protected route with a token in store & check if it's redirected to index page
    for (let route of routes) {
        const store = createTestStore({ addAdminToken: true });
        let { container, history } = renderWithWrappers(<App />, { route, store });
        await waitFor(() => expect(history.entries[history.length - 1].pathname).toBe(`/`));
        ReactDOM.unmountComponentAtNode(container);
    }
});


test("Render authenticated-only route with an expired token", async () => {
    const store = createTestStore({ addAdminToken: true });
    const expirationTime = new Date();
    expirationTime.setDate(expirationTime.getDate() - 1);
    store.dispatch(setAuthInformation({ access_token_expiration_time: expirationTime.toISOString() }));
    let { container, history } = renderWithWrappers(<App />, {
        route: "/objects/edit/1", store
    });
    
    await waitFor(() => expect(history.entries[history.length - 1].pathname).toBe(`/auth/login`));
});


test("Fetch backend with an invalid token", async () => {
    // Set mock fetch to return 401 error when fetching an object
    addFixedRouteResponse("/objects/view", "POST", 401, { _error: "Invalid token." });
    addFixedRouteResponse("/users/view", "POST", 401, { _error: "Invalid token." });

    // Render object's edit page
    const store = createTestStore({ addAdminToken: true });
    let { container, history } = renderWithWrappers(<App />, {
        route: "/objects/edit/1", store
    });
    
    // Check if a redirect occured & token was cleared
    await waitFor(() => expect(history.entries[history.length - 1].pathname).toBe(`/auth/login`));
    expect(deepEqual(store.getState().auth, getDefaultAuthState())).toBeTruthy();
});
