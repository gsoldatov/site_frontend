import { fireEvent } from "@testing-library/react";
import { getByText, getByTitle, queryByText, waitFor } from "@testing-library/dom";

import { getInlineInputField, getDropdownOptionsContainer, getTagInlineItem } from "../test-utils/ui-objects-tags";


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
    const toDoListOption = getByText(dropdownOptionsContainer, "To-Do List").parentNode;
    const compositeOption = (queryByText(dropdownOptionsContainer, "Composite") || {}).parentNode;
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
    return { generalTabButton, dataTabButton };
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
 * Click reset object button and accept a confirmation dialog in the side menu.
 * 
 * If `resetSubobjects` is true, checks the "Reset subobjects" checkbox before accepting.
 */
export const resetObject = (container, resetSubobjects) => {
    const resetButton = getByText(container, "Reset");
    fireEvent.click(resetButton);
    if (resetSubobjects) fireEvent.click(container.querySelector(".side-menu-dialog-checkbox-container").querySelector("input"));
    const confimationDialogButtonYes = getByText(container, "Yes");
    fireEvent.click(confimationDialogButtonYes);
};


/**
 * For the /objects page tag update (expects container to be an /objects/:id page)
 */
export const addAndRemoveTags = async (container, store) => {
    let inputToggle = getByTitle(container, "Click to add tags");
    expect(inputToggle).toBeTruthy();
    fireEvent.click(inputToggle);
    let input = getInlineInputField({ container });

    // Remove an "existing" tag
    const tagOne = getTagInlineItem({ container, text: "tag #1" });
    fireEvent.click(tagOne);

    // Add a new tag
    fireEvent.change(input, { target: { value: "new tag" } });
    await waitFor(() => expect(store.getState().objectUI.tagsInput.matchingIDs.length).toEqual(10));
    let dropdown = getDropdownOptionsContainer({ container, currentQueryText: "new tag" });
    expect(dropdown).toBeTruthy();
    fireEvent.click(dropdown.childNodes[0]);    // click on "Add new tag" option
};
