import { queryByTitle } from "@testing-library/dom";


/**
 * Returns a side menu item from `container` with the provided `text`.
 */
export const getSideMenuItem = (container, text) => {
    const sideMenu = container.querySelector(".side-menu");
    if (!sideMenu) return null;
    return queryByTitle(sideMenu, text);
};


/**
 * Returns header, checkbox and buttons of the first found in the `container` side menu dialog.
 */
export const getSideMenuDialogControls = container => {
    const sideMenu = container.querySelector(".side-menu");
    if (!sideMenu) return null;
    const dialogContainer = container.querySelector(".side-menu-dialog");
    if (!dialogContainer) return null;

    const result = {};

    // Header
    result["header"] = dialogContainer.querySelector(".side-menu-dialog-header");

    // Checkbox
    const checkboxContainer = dialogContainer.querySelector("div.ui.checkbox");
    if (checkboxContainer) result["checkbox"] = checkboxContainer.querySelector("input");

    // Buttons
    const buttons = {};
    dialogContainer.querySelector(".side-menu-dialog-buttons").querySelectorAll(".side-menu-dialog-button").forEach(button => {
        buttons[button.title] = button;
    });
    result["buttons"] = buttons;

    return result;
};
