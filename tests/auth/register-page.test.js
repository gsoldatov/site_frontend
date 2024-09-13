import React from "react";
import { fireEvent } from "@testing-library/dom";

import { createTestStore } from "../_util/create-test-store";
import { renderWithWrappers } from "../_util/render";
import { getRegistrationFormElements, waitForEnabledRegistationForm, waitForFormErrorMessage, enterValidFormData, 
    checkValidInputErrorDisplay, waitForLoginFormSuccessMessage } from "../_util/ui-auth";

import { App } from "../../src/components/top-level/app";


/*
    /auth/register page tests.
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


test("Load register page with disabled admin registration", async () => {
    // Disable registration in mock fetch
    addCustomRouteResponse("/settings/view", "POST", { status: 200, body: { settings: { non_admin_registration_allowed: false }}});

    // Render register page
    const { store } = createTestStore({ addAdminToken: false });
    let { container } = renderWithWrappers(<App />, {
        route: "/auth/register", store
    });

    // Check if a message about registration is disabled & form is disabled
    await waitForFormErrorMessage(container, "register", "Registration is currently unavailable.");
    
    const { inputs, submitButton } = getRegistrationFormElements(container);
    expect(inputs.login.disabled).toBeTruthy();
    expect(inputs.password.disabled).toBeTruthy();
    expect(inputs.passwordRepeat.disabled).toBeTruthy();
    expect(inputs.username.disabled).toBeTruthy();
    expect(submitButton.disabled).toBeTruthy();
});


test("Check validation error display", async () => {
    // Render register page
    const { store } = createTestStore({ addAdminToken: false });
    let { container } = renderWithWrappers(<App />, {
        route: "/auth/register", store
    });

    // Wait for form to become enabled
    await waitForEnabledRegistationForm(container);

    const { inputs, submitButton } = getRegistrationFormElements(container);

    // Enter & submit form data with omitted login
    enterValidFormData(container, "register");
    fireEvent.change(inputs.login, { target: { value: "" } });
    fireEvent.click(submitButton);
    await checkValidInputErrorDisplay(container, "register", "login", "Login is required.");

    // Enter & submit form data with a too long login
    enterValidFormData(container, "register");
    fireEvent.change(inputs.login, { target: { value: "a".repeat(256) } });
    fireEvent.click(submitButton);
    await checkValidInputErrorDisplay(container, "register", "login", "Login is too long.");

    // Enter & sumit form data with a too short password
    enterValidFormData(container, "register");
    fireEvent.change(inputs.password, { target: { value: "a".repeat(7) } });
    fireEvent.change(inputs.passwordRepeat, { target: { value: "a".repeat(7) } });
    fireEvent.click(submitButton);
    await checkValidInputErrorDisplay(container, "register", "password", "Password is too short.");

    // Enter & submit form data with a too long password
    enterValidFormData(container, "register");
    fireEvent.change(inputs.password, { target: { value: "a".repeat(73) } });
    fireEvent.change(inputs.passwordRepeat, { target: { value: "a".repeat(73) } });
    fireEvent.click(submitButton);
    await checkValidInputErrorDisplay(container, "register", "password", "Password is too long.");

    // Enter & submit form data with a password not repeated correctly
    enterValidFormData(container, "register");
    fireEvent.change(inputs.passwordRepeat, { target: { value: "Another password" } });
    fireEvent.click(submitButton);
    await checkValidInputErrorDisplay(container, "register", "passwordRepeat", "Password must be repeated correctly.");

    // Enter & submit form data with omitted username
    enterValidFormData(container, "register");
    fireEvent.change(inputs.username, { target: { value: "" } });
    fireEvent.click(submitButton);
    await checkValidInputErrorDisplay(container, "register", "username", "Username is required.");

    // Enter & submit form data with a too long username
    enterValidFormData(container, "register");
    fireEvent.change(inputs.username, { target: { value: "a".repeat(256) } });
    fireEvent.click(submitButton);
    await checkValidInputErrorDisplay(container, "register", "username", "Username is too long.");
});


test("Check fetch error display", async () => {
    // Render register page
    const { store } = createTestStore({ addAdminToken: false });
    let { container } = renderWithWrappers(<App />, {
        route: "/auth/register", store
    });

    // Wait for form to become enabled
    await waitForEnabledRegistationForm(container);

    // Add a mock network error
    setFetchFail(true);

    // Enter valid data & submit
    enterValidFormData(container, "register");
    fireEvent.click(getRegistrationFormElements(container).submitButton);

    // Wait for form error message to be displayed
    await waitForFormErrorMessage(container, "register", "Failed to fetch data.");
});


test("Fetch error display for existing data & form disabling during fetch", async () => {
    // Render register page
    const { store } = createTestStore({ addAdminToken: false });
    let { container } = renderWithWrappers(<App />, {
        route: "/auth/register", store
    });

    // Wait for form to become enabled
    await waitForEnabledRegistationForm(container);

    // Add a mock error for non-unique login
    addCustomRouteResponse("/auth/register", "POST", { status: 400, body: { _error: "Submitted login already exists." }});

    // Enter valid data & submit
    enterValidFormData(container, "register");
    fireEvent.click(getRegistrationFormElements(container).submitButton);

    // Check if form is disabled during fetch
    expect(getRegistrationFormElements(container).submitButton.disabled).toBeTruthy();

    // Wait for input error message to be displayed
    await checkValidInputErrorDisplay(container, "register", "login", "Submitted login already exists.");

    // Check if form is enabled after fetch which ended with an error
    expect(getRegistrationFormElements(container).submitButton.disabled).toBeFalsy();

    // Add a mock error for non-unique username
    addCustomRouteResponse("/auth/register", "POST", { status: 400, body: { _error: "Submitted username already exists." }});

    // Submit data again
    fireEvent.click(getRegistrationFormElements(container).submitButton);

    // Wait for input error message to be displayed
    await checkValidInputErrorDisplay(container, "register", "username", "Submitted username already exists.");
});


test("Correct registration & form error clearing", async () => {
    // Render register page
    const { store } = createTestStore({ addAdminToken: false });
    let { container, historyManager } = renderWithWrappers(<App />, {
        route: "/auth/register", store
    });

    // Wait for form to become enabled
    await waitForEnabledRegistationForm(container);

    // Add a mock network error
    setFetchFail(true);

    // Enter valid data & submit
    enterValidFormData(container, "register");
    fireEvent.click(getRegistrationFormElements(container).submitButton);

    // Wait for form error message to be displayed
    await waitForFormErrorMessage(container, "register", "Failed to fetch data.");

    // Remove the mock network error & submit data again
    setFetchFail();
    fireEvent.click(getRegistrationFormElements(container).submitButton);

    // Check if form error was reset
    let formElements = getRegistrationFormElements(container);
    expect(formElements.errors.form.textContent).toEqual("");
    expect(formElements.formContainer.classList.contains("error")).toBeFalsy();

    // Wait for redirect to login page
    await historyManager.waitForCurrentURLToBe("/auth/login");

    // Check if success message if displayed
    await waitForLoginFormSuccessMessage(container, "You have successfully registered. Login to continue.");
});
