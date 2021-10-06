import React from "react";
import ReactDOM from "react-dom";
import { fireEvent, waitFor, getByText } from "@testing-library/dom";

import { createTestStore } from "../_util/create-test-store";
import { renderWithWrappers } from "../_util/render";
import { getNavigationBarElements } from "../_util/ui-navbar";

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
    test("Render index page without an access token", async () => {
        // Render login page
        const store = createTestStore({ addAdminToken: false });
        let { container } = renderWithWrappers(<App />, {
            route: "/", store
        });

        // Wait for /auth/get_registration_status to be called
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
        const routes = App().props.children.filter(child => child.props.path !== undefined && child.props.path.startsWith("/auth/"))
            .map(child => child.props.path.replace(":id", "1"));
        expect(routes.length).toEqual(2);

        for (let route of routes) {
            const store = createTestStore({ addAdminToken: false });
            let { container } = renderWithWrappers(<App />, { route, store });
            
            // Wait for /auth/get_registration_status to be called (on /auth/register page only)
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
            route: "/objects/1", store
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
        addFixedRouteResponse("/auth/get_registration_status", "GET", 200, { registration_allowed: false });

        // Render login page
        const store = createTestStore({ addAdminToken: false });
        let { container, history } = renderWithWrappers(<App />, {
            route: "/", store
        });

        // Wait for /auth/get_registration_status to be called
        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

        const { secondaryMenu } = getNavigationBarElements(container);
        expect(secondaryMenu).toBeTruthy();
        expect(secondaryMenu.profileLink).toBeFalsy();
        expect(secondaryMenu.logoutButton).toBeFalsy();
        expect(secondaryMenu.loginButton).toBeTruthy();
        expect(secondaryMenu.registerButton).toBeTruthy();
        
        expect(secondaryMenu.registerButton.classList.contains("is-disabled")).toBeTruthy();
        fireEvent.click(secondaryMenu.registerButton);
        expect(history.entries[history.length - 1].pathname).toBe("/");
    });


    test("Registration button enabled", async () => {
        // Render login page
        const store = createTestStore({ addAdminToken: false });
        let { container, history } = renderWithWrappers(<App />, {
            route: "/", store
        });

        // Wait for /auth/get_registration_status to be called
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

        // Wait for /auth/get_registration_status to be called (to prevent error message)
        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    });


    test("Login button", async () => {
        // Render login page
        const store = createTestStore({ addAdminToken: false });
        let { container, history } = renderWithWrappers(<App />, {
            route: "/", store
        });

        // Wait for /auth/get_registration_status to be called
        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

        const { secondaryMenu } = getNavigationBarElements(container);
        expect(secondaryMenu).toBeTruthy();
        expect(secondaryMenu.loginButton).toBeTruthy();
        
        fireEvent.click(secondaryMenu.loginButton);
        expect(history.entries[history.length - 1].pathname).toBe("/auth/login");
    });
});


describe("Secondary menu logged in state", () => {
    test("Username & logout button", async () => {
        // Render login page
        const store = createTestStore({ addAdminToken: true });
        let { container, history } = renderWithWrappers(<App />, {
            route: "/objects/add", store
        });

        // Wait for user information to be loaded into state
        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

        const { secondaryMenu } = getNavigationBarElements(container);
        expect(secondaryMenu).toBeTruthy();
        expect(secondaryMenu.profileLink).toBeTruthy();
        expect(secondaryMenu.logoutButton).toBeTruthy();
        expect(secondaryMenu.loginButton).toBeFalsy();
        expect(secondaryMenu.registerButton).toBeFalsy();

        const state = store.getState();
        const username = state.users[state.auth.user_id].username;
        expect(secondaryMenu.profileLink.textContent).toEqual(username);
        
        fireEvent.click(secondaryMenu.logoutButton);
        await waitFor(() => expect(store.getState().auth).toEqual(getDefaultAuthState()));
        expect(history.entries[history.length - 1].pathname).toBe("/");

        // Wait for /auth/get_registration_status to be called (to prevent error message);
        // /auth/logout was also called when "Logout" button was clicked
        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(3));
    });
});