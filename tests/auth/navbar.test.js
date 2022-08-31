import React from "react";
import ReactDOM from "react-dom";
import { fireEvent, waitFor, getByText } from "@testing-library/dom";

import { createTestStore } from "../_util/create-test-store";
import { renderWithWrappers } from "../_util/render";

import { App } from "../../src/components/top-level/app";

import { getDefaultAuthState } from "../../src/store/state-templates/auth";
import { getAdminPageElements } from "../_util/ui-admin";
import { getObjectsViewCardElements } from "../_util/ui-objects-view";
import { getSearchPageElements } from "../_util/ui-search";
import { getNavigationBarElements } from "../_util/ui-navbar";
import { getUserPageViewModeElements } from "../_util/ui-user";
import { getFeedElements } from "../_util/ui-index";


/*
    /auth/login page tests.
*/
beforeEach(() => {
    // isolate fetch mock to avoid tests state collision because of cached data in fetch
    jest.isolateModules(() => {
        const { mockFetch, setFetchFail, addCustomRouteResponse } = require("../_mocks/mock-fetch");
        // reset fetch mocks
        jest.resetAllMocks();
        global.fetch = jest.fn(mockFetch);
        global.setFetchFail = jest.fn(setFetchFail);
        global.addCustomRouteResponse = jest.fn(addCustomRouteResponse);
    });
});


describe("Conditional rendering of navigation bar's elements", () => {
    test("Render a page without an access token", async () => {
        const store = createTestStore({ addAdminToken: false });
        let { container } = renderWithWrappers(<App />, {
            route: "/non/existing/route", store     // render a non-existing route to avoid non-auth related fetches
        });

        // Wait for registration status to be fetched from backend
        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

        // Check navbar elements rendering
        const { indexLink, objectsLink, editedObjectsLink, tagsLink, secondaryMenu } = getNavigationBarElements(container);

        expect(indexLink).toBeTruthy();
        expect(objectsLink).toBeFalsy();
        expect(editedObjectsLink).toBeFalsy();
        expect(tagsLink).toBeFalsy();
        expect(secondaryMenu.container).toBeTruthy();
    });


    test("Render auth pages", async () => {
        // Get auth route paths
        const replaceRouteParams = route => route.replace(":id", 1);
        let routes = App().props.children.props.children.filter(child => typeof(child.props.path) === "string" && child.props.path.startsWith("/auth/"))  // string paths
            .map(child => replaceRouteParams(child.props.path));
        
        for (let child of App().props.children.props.children) // Add paths from array `path` props
            if (typeof(child.props.path) === "object" && child.props.path instanceof Array)
                for (let route of child.props.path)
                    if (route.startsWith("/auth/")) routes.push(replaceRouteParams(route));
        
        expect(routes.length).toEqual(2);

        // Render auth routes
        for (let route of routes) {
            const store = createTestStore({ addAdminToken: false });
            let { container } = renderWithWrappers(<App />, { route, store });
            
            // Wait for registration status to be fetched from backend (on /auth/register page only)
            if (route === "/auth/register") await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

            // Check navbar elements rendering
            const { indexLink, objectsLink, editedObjectsLink, tagsLink, secondaryMenu } = getNavigationBarElements(container);
            expect(indexLink).toBeTruthy();
            expect(objectsLink).toBeFalsy();
            expect(editedObjectsLink).toBeFalsy();
            expect(tagsLink).toBeFalsy();
            expect(secondaryMenu.container).toBeFalsy();
            
            ReactDOM.unmountComponentAtNode(container);
        }
    });


    test("Render object edit page with an access token", async () => {
        const store = createTestStore({ addAdminToken: true });
        let { container } = renderWithWrappers(<App />, {
            route: "/objects/edit/1", store
        });

        // Wait for page to load
        await waitFor(() => getByText(container, "Object Information"));

        const { indexLink, objectsLink, editedObjectsLink, tagsLink, secondaryMenu } = getNavigationBarElements(container);
        expect(indexLink).toBeTruthy();
        expect(objectsLink).toBeTruthy();
        expect(editedObjectsLink).toBeTruthy();
        expect(tagsLink).toBeTruthy();
        expect(secondaryMenu.container).toBeTruthy();
    });
});


describe("Secondary menu logged out state", () => {
    test("Registration button disabled", async () => {
        // Disable registration in mock fetch
        addCustomRouteResponse("/settings/view", "POST", { status: 200, body: { settings: { non_admin_registration_allowed: false }}});

        // Render login page
        const store = createTestStore({ addAdminToken: false });
        let { container, history } = renderWithWrappers(<App />, {
            route: "/non/existing/route", store     // render a non-existing route to avoid non-auth related fetches
        });

        // Wait for registration status to be fetched from backend
        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

        const { secondaryMenu } = getNavigationBarElements(container);
        expect(secondaryMenu.profileLink).toBeFalsy();
        expect(secondaryMenu.logoutButton).toBeFalsy();
        expect(secondaryMenu.loginButton).toBeTruthy();
        expect(secondaryMenu.registerButton).toBeTruthy();
        
        expect(secondaryMenu.registerButton.classList.contains("is-disabled")).toBeTruthy();
        fireEvent.click(secondaryMenu.registerButton);
        expect(history.entries[history.length - 1].pathname).toBe("/non/existing/route");
    });


    test("Registration button enabled", async () => {
        const store = createTestStore({ addAdminToken: false });
        let { container, history } = renderWithWrappers(<App />, {
            route: "/non/existing/route", store     // render a non-existing route to avoid non-auth related fetches
        });

        // Wait for registration status to be fetched from backend
        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

        const { secondaryMenu } = getNavigationBarElements(container);
        expect(secondaryMenu.profileLink).toBeFalsy();
        expect(secondaryMenu.logoutButton).toBeFalsy();
        expect(secondaryMenu.loginButton).toBeTruthy();
        expect(secondaryMenu.registerButton).toBeTruthy();
        
        expect(secondaryMenu.registerButton.classList.contains("is-disabled")).toBeFalsy();
        fireEvent.click(secondaryMenu.registerButton);
        expect(history.entries[history.length - 1].pathname).toBe("/auth/register");

        // Wait for registration status to be fetched from backend (to prevent error message)
        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    });


    test("Login button", async () => {
        const store = createTestStore({ addAdminToken: false });
        let { container, history } = renderWithWrappers(<App />, {
            route: "/non/existing/route", store     // render a non-existing route to avoid non-auth related fetches
        });

        // Wait for registration status to be fetched from backend
        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

        const { secondaryMenu } = getNavigationBarElements(container);
        expect(secondaryMenu.loginButton).toBeTruthy();
        
        fireEvent.click(secondaryMenu.loginButton);
        expect(history.entries[history.length - 1].pathname).toBe("/auth/login");
    });
});


describe("Secondary menu logged in state", () => {
    test("Elements rendering", async () => {
        const store = createTestStore({ addAdminToken: true });
        let { container, history } = renderWithWrappers(<App />, {
            route: "/objects/edit/new", store
        });

        // Wait for user information to be loaded into state
        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

        const { secondaryMenu } = getNavigationBarElements(container);
        expect(secondaryMenu.profileLink).toBeTruthy();
        expect(secondaryMenu.logoutButton).toBeTruthy();
        expect(secondaryMenu.loginButton).toBeFalsy();
        expect(secondaryMenu.registerButton).toBeFalsy();
    });


    test("User page link", async () => {
        const store = createTestStore({ addAdminToken: true });
        let { container, history } = renderWithWrappers(<App />, {
            route: "/objects/edit/new", store
        });

        // Wait for the page to load
        await waitFor(() => getByText(container, "Add a New Object"));

        // Wait for user information to be loaded into state
        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

        const { secondaryMenu } = getNavigationBarElements(container);
        const state = store.getState();
        const username = state.users[state.auth.user_id].username;
        expect(secondaryMenu.profileLink.textContent).toEqual(username);
        
        fireEvent.click(secondaryMenu.profileLink);
        expect(history.entries[history.length - 1].pathname).toBe("/users/1");

        // Wait for user data fetch to end
        await waitFor(() => expect(getUserPageViewModeElements(container).loader).toBeFalsy());
    });


    test("Logout button", async () => {
        // Route load awaiting functions
        const loadWaiters = {
            "/": async container => await waitFor(() => expect(getFeedElements(container).placeholders.loading).toBeFalsy()),
            "/feed/2": async container => await waitFor(() => expect(getFeedElements(container).placeholders.loading).toBeFalsy()),

            "/search": async container => await waitFor(() => expect(getSearchPageElements(container).feed.placeholders.loading).toBeFalsy()),

            "/admin": async container => await waitFor(() => expect(getAdminPageElements(container).settingsTab.settingControls).toBeTruthy()),
            
            "/objects/edit/new": async container => await waitFor(() => getByText(container, "Add a New Object")),
            "/objects/edit/2": async container => await waitFor(() => getByText(container, "Object Information")),
            "/objects/edited": null,
            "/objects/list": async container => await waitFor(() => getByText(container, "object #1")),
            "/objects/view/2": async container => await waitFor(() => expect(getObjectsViewCardElements({ container }).placeholders.loading).toBeFalsy()),

            "/tags/list": async container => await waitFor(() => getByText(container, "tag #1")),
            "/tags/edit/new": null,
            "/tags/edit/2": async container => await waitFor(() => getByText(container, "Tag Information")),

            "/users/2": async container => await waitFor(() => expect(getUserPageViewModeElements(container).header).toBeTruthy())
        } 
        
        // Get all non-auth routes
        const replaceRouteParams = route => route.replace(":id", 2).replace(":page", 2);
        let routes = App().props.children.props.children.filter(child => typeof(child.props.path) === "string" && !child.props.path.startsWith("/auth/"))  // string paths
            .map(child => replaceRouteParams(child.props.path));
        
        for (let child of App().props.children.props.children) // Add paths from array `path` props
            if (typeof(child.props.path) === "object" && child.props.path instanceof Array)
                for (let route of child.props.path)
                    if (!route.startsWith("/auth/")) routes.push(replaceRouteParams(route));
        
        expect(routes.length).toEqual(13);

        // Render each route and logout
        for (let route of routes) {
            const store = createTestStore({ addAdminToken: true });
            let { container, history } = renderWithWrappers(<App />, {
                route, store
            });

            // Wait for page to load (throw error if route waiter is not defined or explicitly skipped)
            if (!(route in loadWaiters)) throw Error(`Waiter not found for route '${route}'`);
            if (typeof(loadWaiters[route]) === "function") await loadWaiters[route](container);

            // Wait for user info to load in state
            await waitFor(() => {
                const state = store.getState();
                expect(state.users[state.auth.user_id]).toBeTruthy();
            });

            // Click logout button
            const { secondaryMenu } = getNavigationBarElements(container);
            fireEvent.click(secondaryMenu.logoutButton);
            
            // Check if auth state is reset, redirect to index page is triggered & index on load fetch is started
            await waitFor(() => {
                expect(store.getState().auth).toEqual(getDefaultAuthState());
                expect(history.entries[history.length - 1].pathname).toBe("/")
                expect(getFeedElements(container).placeholders.loading).toBeTruthy();
            });

            // Check if index on load fetch is ended
            await waitFor(() => expect(getFeedElements(container).placeholders.loading).toBeFalsy());

            ReactDOM.unmountComponentAtNode(container);
        }
    });
});
