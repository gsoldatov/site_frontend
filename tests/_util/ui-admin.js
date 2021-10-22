import { queryByText } from "@testing-library/dom";

/**
 * Returns elements of a /admin page in the provided `container`.
 */
export const getAdminPageElements = container => {
    let result = { tabSelectors: {}, settingsTab: {} };
    const pageContainer = container.querySelector(".admin-page-tabs-container");
    if (!pageContainer) return {};

    // Tab selectors
    const tabSelectorContainer = pageContainer.querySelector(".ui.tabular.menu");
    result.tabSelectors.settings = queryByText(tabSelectorContainer, "Settings");

    // Settings tab
    const tabContainer = pageContainer.querySelector(".ui.tab");
    result.settingsTab.errorMessage = tabContainer.querySelector(".ui.error.message.user-page-edit-message p");
    result.settingsTab.successMessage = tabContainer.querySelector(".ui.info.message.user-page-edit-message p");
    result.settingsTab.loader = tabContainer.querySelector(".ui.loader");

    result.settingsTab.settingControls = {};
    
    const nonAdminRegistrationLabel = queryByText(tabContainer, "Non-admin registration allowed");
    if (nonAdminRegistrationLabel) result.settingsTab.settingControls.nonAdminRegistrationAllowed = nonAdminRegistrationLabel.parentNode.querySelector("input");

    result.settingsTab.updateButton = queryByText(tabContainer, "Update");

    return result;
};