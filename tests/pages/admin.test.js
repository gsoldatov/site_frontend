import React from "react";
import { fireEvent, waitFor } from "@testing-library/dom";

import { resetTestConfig } from "../_mocks/config";
import { renderWithWrappers } from "../_util/render";
import { getAdminPageElements } from "../_util/ui-admin";

import { App } from "../../src/components/app";


/*
    /admin page tests.
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


test("Load with fetch error", async () => {
    // Set fetch failure & render page
    setFetchFail(true);
    let { container } = renderWithWrappers(<App />, {
        route: "/admin"
    });

    // Check if loader is rendered by default
    expect(getAdminPageElements(container).settingsTab.loader).toBeTruthy();

    // Check if error message is displayed after fetch end
    await waitFor(() => {
        const { settingsTab } = getAdminPageElements(container);
        expect(settingsTab.errorMessage.textContent).toEqual("Failed to fetch data.");
        expect(settingsTab.loader).toBeFalsy();
        expect(settingsTab.updateButton).toBeFalsy();
    });
});


test("Correct update", async () => {
    // Render page
    let { container } = renderWithWrappers(<App />, {
        route: "/admin"
    });

    await waitFor(() => expect(getAdminPageElements(container).settingsTab.updateButton).toBeTruthy());

    // Update non-admin registration allowed value
    const { settingsTab } = getAdminPageElements(container);
    expect(settingsTab.settingControls.nonAdminRegistrationAllowed.parentNode.classList.contains("checked")).toBeTruthy();
    fireEvent.click(settingsTab.settingControls.nonAdminRegistrationAllowed);
    expect(settingsTab.settingControls.nonAdminRegistrationAllowed.parentNode.classList.contains("checked")).toBeFalsy();

    // Update with fetch error
    setFetchFail(true);
    fireEvent.click(settingsTab.updateButton);

    // Check if form is disabled during fetch
    expect(settingsTab.settingControls.nonAdminRegistrationAllowed.parentNode.classList.contains("disabled")).toBeTruthy();
    expect(settingsTab.updateButton.classList.contains("disabled")).toBeTruthy();

    // Check if error is displayed
    await waitFor(() => expect(getAdminPageElements(container).settingsTab.errorMessage.textContent).toEqual("Failed to fetch data."));

    // Update non-admin registration allowed value (check if form is enabled again)
    fireEvent.click(settingsTab.settingControls.nonAdminRegistrationAllowed);
    expect(settingsTab.settingControls.nonAdminRegistrationAllowed.parentNode.classList.contains("checked")).toBeTruthy();

    // Update successfully
    setFetchFail(false);
    fireEvent.click(settingsTab.updateButton);

    await waitFor(() => expect(getAdminPageElements(container).settingsTab.successMessage.textContent).toEqual("Settings were successfully updated."));
});
