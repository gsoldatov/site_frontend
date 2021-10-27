import { fireEvent } from "@testing-library/react";
import { getByText, queryByText, waitFor } from "@testing-library/dom";

import { getSideMenuItem, getSideMenuDialogControls } from "./ui-common";


export const getCurrentObject = state => state.editedObjects[state.objectUI.currentObjectID];


/**
 * Wait for existing page to be loaded
 */
export const waitForEditObjectPageLoad = async (container, store) => {
    await waitFor(() => expect(store.getState().objectUI.objectOnLoadFetch.isFetching).toBeTruthy());
    await waitFor(() => expect(store.getState().objectUI.objectOnLoadFetch.isFetching).toBeFalsy());
    await waitFor(() => getByText(container, "Object Information"));
};


/**
 * Returns object type switch container and selecting elements
 */
export const getObjectTypeSwitchElements = container => {
    const switchContainer = container.querySelector("div.ui.dropdown.object-type-dropdown-switch");
    if (!switchContainer) return {};

    const selectedObjectType = switchContainer.querySelector("span.selected-object-type");
    
    const dropdownOptionsContainer = switchContainer.querySelector("div.menu.transition");
    const linkOption = getByText(dropdownOptionsContainer, "Link").parentNode;
    const markdownOption = getByText(dropdownOptionsContainer, "Markdown").parentNode;
    const toDoListOption = getByText(dropdownOptionsContainer, "To-do list").parentNode;
    const compositeOption = (queryByText(dropdownOptionsContainer, "Composite object") || {}).parentNode;
    return { switchContainer, selectedObjectType, dropdownOptionsContainer, linkOption, markdownOption, toDoListOption, compositeOption };
};


/**
 * Get general and data tab panes
 */
const getObjectTabMenuButtons = container => {
    const tabMenu = container.querySelector(".ui.attached.tabular.menu");
    expect(tabMenu).toBeTruthy();
    const generalTabButton = getByText(tabMenu, "General");
    const dataTabButton = getByText(tabMenu, "Data");
    const displayTabButton = getByText(tabMenu, "Display");
    return { generalTabButton, dataTabButton, displayTabButton };
};


/**
 * Click on general tab pane
 */
export const clickGeneralTabButton = container => {
    const { generalTabButton } = getObjectTabMenuButtons(container);
    fireEvent.click(generalTabButton);
};


/**
 * Click on data tab pane
 */
export const clickDataTabButton = container => {
    const { dataTabButton } = getObjectTabMenuButtons(container);
    fireEvent.click(dataTabButton);
};


/**
 * Click on display tab pane
 */
 export const clickDisplayTabButton = container => {
    const { displayTabButton } = getObjectTabMenuButtons(container);
    fireEvent.click(displayTabButton);
};


/**
 * Click reset object button and accept a confirmation dialog in the side menu.
 * 
 * If `resetSubobjects` is true, checks the "Reset subobjects" checkbox before accepting.
 */
export const resetObject = (container, resetSubobjects) => {
    const resetButton = getSideMenuItem(container, "Reset");
    fireEvent.click(resetButton);
    const sideMenuControls = getSideMenuDialogControls(container);
    if (resetSubobjects) fireEvent.click(sideMenuControls.checkbox);
    fireEvent.click(sideMenuControls.buttons["Yes"]);
};


/**
 * Clicks on 'Publish Object' checkbox
 */
export const clickPublishObjectCheckbox = container => {
    const checkbox = getByText(container, "Publish Object").parentNode.querySelector("input");
    fireEvent.click(checkbox);
};
