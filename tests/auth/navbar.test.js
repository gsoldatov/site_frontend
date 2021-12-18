import React from "react";
import ReactDOM from "react-dom";
import { fireEvent, waitFor, getByText } from "@testing-library/dom";

import { createTestStore } from "../_util/create-test-store";
import { renderWithWrappers } from "../_util/render";
import { getNavigationBarElements } from "../_util/ui-navbar";
import { getUserPageViewModeElements } from "../_util/ui-user";

import { App } from "../../src/components/top-level/app";

import { getDefaultAuthState } from "../../src/store/state-templates/auth";


/*
    /auth/login page tests.
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


describe("Conditional rendering of navigation bar's elements", () => {
    test("Render a page without an access token", async () => {
        // Render login page
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
        expect(secondaryMenu).toBeTruthy();
    });


    test("Render auth pages", async () => {
        // Get auth route paths
        const replaceRouteParams = route => route.replace(":id", 1);
        let routes = App().props.children.filter(child => typeof(child.props.path) === "string" && child.props.path.startsWith("/auth/"))  // string paths
            .map(child => replaceRouteParams(child.props.path));
        
        for (let child of App().props.children) // Add paths from array `path` props
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
            expect(secondaryMenu).toBeFalsy();
            
            ReactDOM.unmountComponentAtNode(container);
        }
    });


    test("Render object edit page with an access token", async () => {
        // Render login page
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
        expect(secondaryMenu).toBeTruthy();
    });
});


describe("Secondary menu logged out state", () => {
    test("Registration button disabled", async () => {
        // Disable registration in mock fetch
        addFixedRouteResponse("/settings/view", "POST", 200, { settings: { non_admin_registration_allowed: false }});

        // Render login page
        const store = createTestStore({ addAdminToken: false });
        let { container, history } = renderWithWrappers(<App />, {
            route: "/non/existing/route", store     // render a non-existing route to avoid non-auth related fetches
        });

        // Wait for registration status to be fetched from backend
        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

        const { secondaryMenu } = getNavigationBarElements(container);
        expect(secondaryMenu).toBeTruthy();
        expect(secondaryMenu.profileLink).toBeFalsy();
        expect(secondaryMenu.logoutButton).toBeFalsy();
        expect(secondaryMenu.loginButton).toBeTruthy();
        expect(secondaryMenu.registerButton).toBeTruthy();
        
        expect(secondaryMenu.registerButton.classList.contains("is-disabled")).toBeTruthy();
        fireEvent.click(secondaryMenu.registerButton);
        expect(history.entries[history.length - 1].pathname).toBe("/non/existing/route");
    });


    test("Registration button enabled", async () => {
        // Render login page
        const store = createTestStore({ addAdminToken: false });
        let { container, history } = renderWithWrappers(<App />, {
            route: "/non/existing/route", store     // render a non-existing route to avoid non-auth related fetches
        });

        // Wait for registration status to be fetched from backend
        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

        const { secondaryMenu } = getNavigationBarElements(container);
        expect(secondaryMenu).toBeTruthy();
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
        // Render login page
        const store = createTestStore({ addAdminToken: false });
        let { container, history } = renderWithWrappers(<App />, {
            route: "/non/existing/route", store     // render a non-existing route to avoid non-auth related fetches
        });

        // Wait for registration status to be fetched from backend
        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

        const { secondaryMenu } = getNavigationBarElements(container);
        expect(secondaryMenu).toBeTruthy();
        expect(secondaryMenu.loginButton).toBeTruthy();
        
        fireEvent.click(secondaryMenu.loginButton);
        expect(history.entries[history.length - 1].pathname).toBe("/auth/login");
    });
});


describe("Secondary menu logged in state", () => {
    test("Elements rendering", async () => {
        // Render login page
        const store = createTestStore({ addAdminToken: true });
        let { container, history } = renderWithWrappers(<App />, {
            route: "/objects/edit/new", store
        });

        // Wait for user information to be loaded into state
        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

        const { secondaryMenu } = getNavigationBarElements(container);
        expect(secondaryMenu).toBeTruthy();
        expect(secondaryMenu.profileLink).toBeTruthy();
        expect(secondaryMenu.logoutButton).toBeTruthy();
        expect(secondaryMenu.loginButton).toBeFalsy();
        expect(secondaryMenu.registerButton).toBeFalsy();
    });


    test("User page link", async () => {
        // Render login page
        const store = createTestStore({ addAdminToken: true });
        let { container, history } = renderWithWrappers(<App />, {
            route: "/objects/edit/new", store
        });

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
        // Render login page
        const store = createTestStore({ addAdminToken: true });
        let { container, history } = renderWithWrappers(<App />, {
            route: "/objects/edit/new", store
        });

        // Wait for user information to be loaded into state
        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

        const { secondaryMenu } = getNavigationBarElements(container);
        fireEvent.click(secondaryMenu.logoutButton);
        await waitFor(() => expect(store.getState().auth).toEqual(getDefaultAuthState()));
        expect(history.entries[history.length - 1].pathname).toBe("/");

        /* Wait for all fetches to end:
            - before logout button click:
                - load current user information;
            - after logout button click:
                - logout fetch;
                - registration status fetch;
                - index feed fetches:
                    - current page object IDs;
                    - objects' attributes;
                    - objects' tags' attributes;
        */
        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(6));
    });
});
