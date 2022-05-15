import React from "react";
import { fireEvent, waitFor } from "@testing-library/dom";

import { createTestStore } from "../_util/create-test-store";
import { renderWithWrappers } from "../_util/render";
import { getLoginFormElements, waitForFormErrorMessage, enterValidFormData, checkValidInputErrorDisplay } from "../_util/ui-auth";
import { getMockLoginResponse } from "../_mocks/data-auth";

import { App } from "../../src/components/top-level/app";

import { deepEqual } from "../../src/util/equality-checks";
import { getDefaultAuthState } from "../../src/store/state-templates/auth";
import { enumUserLevels } from "../../src/util/enum-user-levels";


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


test("Check validation error display", async () => {
    // Render login page
    const store = createTestStore({ addAdminToken: false });
    let { container } = renderWithWrappers(<App />, {
        route: "/auth/login", store
    });

    const { inputs, submitButton } = getLoginFormElements(container);

    // Enter & submit form data with omitted login
    enterValidFormData(container, "login");
    fireEvent.change(inputs.login, { target: { value: "" } });
    fireEvent.click(submitButton);
    await checkValidInputErrorDisplay(container, "login", "login", "Login is required.");

    // Enter & submit form data with a too long login
    enterValidFormData(container, "login");
    fireEvent.change(inputs.login, { target: { value: "a".repeat(256) } });
    fireEvent.click(submitButton);
    await checkValidInputErrorDisplay(container, "login", "login", "Login is too long.");

    // Enter & sumit form data with a too short password
    enterValidFormData(container, "login");
    fireEvent.change(inputs.password, { target: { value: "a".repeat(7) } });
    fireEvent.click(submitButton);
    await checkValidInputErrorDisplay(container, "login", "password", "Submitted password is too short.");

    // Enter & submit form data with a too long password
    enterValidFormData(container, "login");
    fireEvent.change(inputs.password, { target: { value: "a".repeat(73) } });
    fireEvent.click(submitButton);
    await checkValidInputErrorDisplay(container, "login", "password", "Submitted password is too long.");
});


test("Check fetch error display & form disabling during fetch", async () => {
    // Render login page
    const store = createTestStore({ addAdminToken: false });
    let { container } = renderWithWrappers(<App />, {
        route: "/auth/login", store
    });

    // Add a mock network error
    setFetchFail(true);

    // Enter valid data & submit
    enterValidFormData(container, "login");
    fireEvent.click(getLoginFormElements(container).submitButton);

    // Check if form is disabled during fetch
    expect(getLoginFormElements(container).submitButton.disabled).toBeTruthy();

    // Wait for form error message to be displayed
    await waitForFormErrorMessage(container, "login", "Failed to fetch data.");

    // Check if form is enabled after fetch which ended with an error
    expect(getLoginFormElements(container).submitButton.disabled).toBeFalsy();
});


test("Correct login", async () => {
    // Render login page
    const store = createTestStore({ addAdminToken: false });
    let { container, history } = renderWithWrappers(<App />, {
        route: "/auth/login", store
    });

    expect(deepEqual(store.getState().auth, getDefaultAuthState())).toBeTruthy();

    // Add a mock network error
    setFetchFail(true);

    // Enter valid data & submit
    enterValidFormData(container, "login");
    fireEvent.click(getLoginFormElements(container).submitButton);

    // Wait for form error message to be displayed
    await waitForFormErrorMessage(container, "login", "Failed to fetch data.");

    // Remove the mock network error, set mock login response & submit data again
    setFetchFail();
    const body = getMockLoginResponse();
    addCustomRouteResponse("/auth/login", "POST", { status: 200, body });
    fireEvent.click(getLoginFormElements(container).submitButton);

    // Check if form error was reset
    let formElements = getLoginFormElements(container);
    expect(formElements.errors.form.textContent).toEqual("");
    expect(formElements.formContainer.classList.contains("error")).toBeFalsy();

    // Wait for the auth info to be added to the state
    await waitFor(() => {
        const expectedAuth = { ...body.auth, numeric_user_level: enumUserLevels[body.auth.user_level] };   // replace string user level with numeric
        delete expectedAuth["user_level"];
        expect(deepEqual(store.getState().auth, expectedAuth)).toBeTruthy();
    });

    // Wait for redirect to index page and index page fetches to end
    await waitFor(() => expect(history.entries[history.length - 1].pathname).toBe(`/`));
    await waitFor(() => expect(container.querySelector(".feed-card")).toBeTruthy());
});


test("Correct login with URL query params", async () => {
    // Render login page
    const params = new URLSearchParams();
    const redirectPath = "/objects/edit/1";
    params.append("from", redirectPath);
    params.append("message", "registrationComplete");
    const store = createTestStore({ addAdminToken: false });
    let { container, history } = renderWithWrappers(<App />, {
        route: "/auth/login?" + params.toString(), store
    });

    expect(deepEqual(store.getState().auth, getDefaultAuthState())).toBeTruthy();

    // Set mock login response
    const body = getMockLoginResponse();
    addCustomRouteResponse("/auth/login", "POST", { status: 200, body });

    // Enter valid data & submit
    enterValidFormData(container, "login");
    fireEvent.click(getLoginFormElements(container).submitButton);

    // Check if form message was reset
    let formElements = getLoginFormElements(container);
    expect(formElements.formMessage.textContent).toEqual("");
    expect(formElements.formContainer.classList.contains("success")).toBeFalsy();

    // Wait for the auth info to be added to the state
    await waitFor(() => {
        const expectedAuth = { ...body.auth, numeric_user_level: enumUserLevels[body.auth.user_level] };   // replace string user level with numeric
        delete expectedAuth["user_level"];
        expect(deepEqual(store.getState().auth, expectedAuth)).toBeTruthy();
    });

    // Wait for redirect to the specified page
    await waitFor(() => expect(history.entries[history.length - 1].pathname).toBe(redirectPath));
});
