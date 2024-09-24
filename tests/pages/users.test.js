import React from "react";
import ReactDOM from "react-dom";
import { fireEvent, getByText, waitFor } from "@testing-library/dom";

import { createTestStore } from "../_util/create-test-store";
import { resetTestConfig } from "../_mocks/config";
import { renderWithWrappers } from "../_util/render";
import { getUserPageViewModeElements, getUserPageEditModeElements, checkValidInputErrorDisplay, 
    clearFormData, waitForFormMessage } from "../_util/ui-user";
import { getMockUserData } from "../_mocks/data-users";

import { App } from "../../src/components/top-level/app";


/*
    /users/:id page tests.
*/
beforeEach(() => {
    // isolate fetch mock to avoid tests state collision because of cached data in fetch
    jest.isolateModules(() => {
        const { mockFetch, setFetchFail, addCustomRouteResponse } = require("../_mocks/mock-fetch");
        
        // Set test app configuration
        resetTestConfig();
        
        // reset fetch mocks
        jest.resetAllMocks();
        global.fetch = jest.fn(mockFetch);
        global.setFetchFail = jest.fn(setFetchFail);
        global.addCustomRouteResponse = jest.fn(addCustomRouteResponse);
    });
});


describe("View mode", () => {
    describe("As anonymous", () => {
        test("Load with fetch error", async () => {
            // Set fetch failure & render page
            setFetchFail(true);
            const { store } = createTestStore({ addAdminToken: false });
            let { container } = renderWithWrappers(<App />, {
                route: "/users/1", store
            });

            // Check if loader is rendered by default
            expect(getUserPageViewModeElements(container).loader).toBeTruthy();

            // Check if error message is displayed after fetch end
            await waitFor(() => {
                const { loader, error, header } = getUserPageViewModeElements(container);
                expect(error.textContent).toEqual("Failed to fetch data.");
                expect(loader).toBeFalsy();
                expect(header).toBeFalsy();
            });
        });


        test("Load page with invalid user ID", async () => {
            for (let invalidID of ["0", "asd"]) {
                const { store } = createTestStore({ addAdminToken: false });
                let { container } = renderWithWrappers(<App />, {
                    route: `/users/${invalidID}`, store
                });

                // Check if error message is displayed
                await waitFor(() => {
                    const { loader, error, editModeButton } = getUserPageViewModeElements(container);
                    expect(error.textContent).toEqual("User not found.");
                    expect(loader).toBeFalsy();
                    expect(editModeButton).toBeFalsy();
                });

                ReactDOM.unmountComponentAtNode(container);
            }
        });


        test("Load a valid user", async () => {
            // Set mock response & render user page
            const userData = getMockUserData({ user_id: 2, full_view_mode: false });
            addCustomRouteResponse("/users/view", "POST", { status: 200, body: { users: [userData] }});
            const { store } = createTestStore({ addAdminToken: false });
            let { container } = renderWithWrappers(<App />, {
                route: `/users/2`, store
            });
            
            // Wait for user data to load
            await waitFor(() => expect(getUserPageViewModeElements(container).loader).toBeFalsy());

            // Check rendered data
            const { header, registeredAt, userLevel, canLogin, canEditObjects, editModeButton } = getUserPageViewModeElements(container);
            expect(header.textContent).toEqual(userData.username);
            expect(registeredAt.textContent).toEqual((new Date(userData.registered_at)).toLocaleString());
            expect(userLevel).toBeFalsy();
            expect(canLogin).toBeFalsy();
            expect(canEditObjects).toBeFalsy();
            expect(editModeButton).toBeFalsy();
        });
    });


    describe("As admin", () => {
        test("Load valid users", async () => {
            const userData = [
                getMockUserData({ user_id: 2, user_level: "admin", can_login: true, can_edit_objects: false, full_view_mode: true }),
                getMockUserData({ user_id: 3, user_level: "user", can_login: false, can_edit_objects: true, full_view_mode: true })
            ];

            for (let ud of userData) {
                // Set mock response & render user page
                addCustomRouteResponse("/users/view", "POST", {status: 200, body: { users: [ud] }});
                var { container } = renderWithWrappers(<App />, {
                    route: `/users/${ud.user_id}`
                });
                
                // Wait for user data to load
                await waitFor(() => expect(getUserPageViewModeElements(container).loader).toBeFalsy());

                // Check rendered data
                const { header, registeredAt, userLevel, canLogin, canEditObjects, editModeButton } = getUserPageViewModeElements(container);
                expect(header.textContent).toEqual(ud.username);
                expect(registeredAt.textContent).toEqual((new Date(ud.registered_at)).toLocaleString());
                expect(userLevel.textContent).toEqual(ud.user_level);
                expect(canLogin.textContent).toEqual(ud.can_login ? "yes" : "no");
                expect(canEditObjects.textContent).toEqual(ud.can_edit_objects ? "yes" : "no");
                expect(editModeButton).toBeTruthy();

                ReactDOM.unmountComponentAtNode(container);
            }
        });
    });
});


describe("Edit mode", () => {
    test("Toggle edit mode", async () => {
        // Create mock store, set mock response & render user page
        const userData = getMockUserData({ user_id: 2, full_view_mode: true });
        const { store } = createTestStore({ addAdminUser: true });
        addCustomRouteResponse("/users/view", "POST", { status: 200, body: { users: [userData] }});
        let { container } = renderWithWrappers(<App />, {
            route: `/users/2`, store
        });
        
        // Wait for user data to load and enable edit mode
        await waitFor(() => expect(getUserPageViewModeElements(container).loader).toBeFalsy());
        fireEvent.click(getUserPageViewModeElements(container).editModeButton);

        // Check header
        const { header, inputs, cancelButton } = getUserPageEditModeElements(container);
        getByText(header, userData.username, { exact: false });

        fireEvent.change(inputs.username, { target: { value: "Some new username" } });

        // Exit edit mode
        fireEvent.click(cancelButton);
        await waitFor(() => expect(getUserPageViewModeElements(container).loader).toBeFalsy());
        expect(store.getState().users[2].username).toEqual(userData.username);
    });


    test("Try updating with incorrect data", async () => {
        // Create mock store, set mock response & render user page
        const userData = getMockUserData({ user_id: 2, full_view_mode: true });
        const { store } = createTestStore({ addAdminUser: true });
        addCustomRouteResponse("/users/view", "POST", { status: 200, body: { users: [userData] }});
        let { container } = renderWithWrappers(<App />, {
            route: `/users/2`, store
        });
        
        // Wait for user data to load and enable edit mode
        await waitFor(() => expect(getUserPageViewModeElements(container).loader).toBeFalsy());
        fireEvent.click(getUserPageViewModeElements(container).editModeButton);
        const { inputs, updateButton } = getUserPageEditModeElements(container);

        // Enter & submit form data with a too long login
        fireEvent.change(inputs.login, { target: { value: "a".repeat(256) } });
        fireEvent.change(inputs.tokenOwnerPassword, { target: { value: "Correct password" } });
        fireEvent.click(updateButton);
        await checkValidInputErrorDisplay(container, "login", "Login is too long.");
        clearFormData(container);

        // Enter & sumit form data with a too short password
        fireEvent.change(inputs.password, { target: { value: "a".repeat(7) } });
        fireEvent.change(inputs.passwordRepeat, { target: { value: "a".repeat(7) } });
        fireEvent.change(inputs.tokenOwnerPassword, { target: { value: "Correct password" } });
        fireEvent.click(updateButton);
        await checkValidInputErrorDisplay(container, "password", "Password is too short.");
        clearFormData(container);

        // Enter & submit form data with a too long password
        fireEvent.change(inputs.password, { target: { value: "a".repeat(73) } });
        fireEvent.change(inputs.passwordRepeat, { target: { value: "a".repeat(73) } });
        fireEvent.change(inputs.tokenOwnerPassword, { target: { value: "Correct password" } });
        fireEvent.click(updateButton);
        await checkValidInputErrorDisplay(container, "password", "Password is too long.");
        clearFormData(container);

        // Enter & submit form data with a password not repeated correctly
        fireEvent.change(inputs.password, { target: { value: "Some password" } });
        fireEvent.change(inputs.passwordRepeat, { target: { value: "Another password" } });
        fireEvent.change(inputs.tokenOwnerPassword, { target: { value: "Correct password" } });
        fireEvent.click(updateButton);
        await checkValidInputErrorDisplay(container, "passwordRepeat", "Password must be repeated correctly.");
        clearFormData(container);

        // Enter & submit form data with a too long username
        fireEvent.change(inputs.username, { target: { value: "a".repeat(256) } });
        fireEvent.change(inputs.tokenOwnerPassword, { target: { value: "Correct password" } });
        fireEvent.click(updateButton);
        await checkValidInputErrorDisplay(container, "username", "Username is too long.");
        clearFormData(container);

        // Submit form data with an omitted token owner password
        fireEvent.click(updateButton);
        await checkValidInputErrorDisplay(container, "tokenOwnerPassword", "Password is too short.");
    });


    test("Handle fetch errors during correct update", async () => {
        // Create mock store, set mock response & render user page
        const userData = getMockUserData({ user_id: 2, full_view_mode: true });
        const { store } = createTestStore({ addAdminUser: true });
        addCustomRouteResponse("/users/view", "POST", { status: 200, body: { users: [userData] }});
        let { container } = renderWithWrappers(<App />, {
            route: `/users/2`, store
        });
        
        // Wait for user data to load and enable edit mode
        await waitFor(() => expect(getUserPageViewModeElements(container).loader).toBeFalsy());
        fireEvent.click(getUserPageViewModeElements(container).editModeButton);
        const { inputs, updateButton } = getUserPageEditModeElements(container);

        // Set fetch fail & submit correct update
        setFetchFail(true);
        fireEvent.change(inputs.login, { target: { value: "New login" } });
        fireEvent.change(inputs.username, { target: { value: "New username" } });
        fireEvent.change(inputs.tokenOwnerPassword, { target: { value: "Some password" } });
        fireEvent.click(updateButton);
        await waitForFormMessage(container, "error", "Failed to fetch data.");
        setFetchFail();

        // Set mock non-unique login error & submit correct update
        addCustomRouteResponse("/users/update", "PUT", { status: 400, body: { _error: "Submitted login already exists." }});
        fireEvent.click(updateButton);
        expect(getUserPageEditModeElements(container).message).toBeFalsy();
        await checkValidInputErrorDisplay(container, "login", "Submitted login already exists.");

        // Set mock non-unique username error & submit correct update
        addCustomRouteResponse("/users/update", "PUT", { status: 400, body: { _error: "Submitted username already exists." }});
        fireEvent.click(updateButton);
        expect(getUserPageEditModeElements(container).message).toBeFalsy();
        await checkValidInputErrorDisplay(container, "username", "Submitted username already exists.");

        // Set mock non-unique username error & submit correct update
        addCustomRouteResponse("/users/update", "PUT", { status: 400, body: { _error: "Token owner password is incorrect." }});
        fireEvent.click(updateButton);
        expect(getUserPageEditModeElements(container).message).toBeFalsy();
        await checkValidInputErrorDisplay(container, "tokenOwnerPassword", "Incorrect password.");
    });


    test("Correct update", async () => {
        // Create mock store, set mock response & render user page
        const userData = getMockUserData({ user_id: 2, user_level: "admin", can_login: true, can_edit_objects: true, full_view_mode: true });
        const { store } = createTestStore({ addAdminUser: true });
        addCustomRouteResponse("/users/view", "POST", { status: 200, body: { users: [userData] }});
        addCustomRouteResponse("/users/update", "PUT", { generator: (body, handler) => {
            const body_ = JSON.parse(body);

            // Check if password and password repeat are both present or absent
            if ("password" in body_.user && !("password_repeat" in body_.user)) return { status: 400, body: { _error: "password_repeat missing in user data" }};
            if (!("password" in body_.user) && "password_repeat" in body_.user) return { status: 400, body: { _error: "password_repeat missing in user data" }};
            if (body_.user.password !== body_.user.password_repeat) return { status: 400, body: { _error: "password and password_repeat do not match" }};

            return handler(body);
        }});

        let { container } = renderWithWrappers(<App />, {
            route: `/users/2`, store
        });
        
        // Wait for user data to load and enable edit mode
        await waitFor(() => expect(getUserPageViewModeElements(container).loader).toBeFalsy());
        fireEvent.click(getUserPageViewModeElements(container).editModeButton);
        const { inputs, updateButton } = getUserPageEditModeElements(container);

        // Set fetch fail & submit correct update
        setFetchFail(true);
        fireEvent.change(inputs.login, { target: { value: "New login" } });
        fireEvent.change(inputs.tokenOwnerPassword, { target: { value: "Some password" } });
        fireEvent.click(updateButton);
        await waitForFormMessage(container, "error", "Failed to fetch data.");
        setFetchFail();
        clearFormData(container);

        // Run update without any modified fields
        fireEvent.change(inputs.tokenOwnerPassword, { target: { value: "Some password" } });
        fireEvent.click(updateButton);
        await waitForFormMessage(container, "info", "Nothing was updated.");

        // Update all attributes & run update
        fireEvent.change(inputs.login, { target: { value: "New login" } });
        fireEvent.change(inputs.username, { target: { value: "New username" } });
        fireEvent.change(inputs.password, { target: { value: "New password" } });
        fireEvent.change(inputs.passwordRepeat, { target: { value: "New password" } });

        fireEvent.click(inputs.userLevel);
        fireEvent.click(getByText(inputs.userLevel, "User").parentNode);

        fireEvent.click(inputs.canLogin);
        fireEvent.click(inputs.canEditObjects);

        fireEvent.click(updateButton);

        // Check state updates
        await waitForFormMessage(container, "success", "User data was successfully updated.");
        const user = store.getState().users[2];
        expect(user.username).toEqual("New username");
        expect(user.user_level).toEqual("user");
        expect(user.can_login).toEqual(false);
        expect(user.can_edit_objects).toEqual(false);
    });
});
