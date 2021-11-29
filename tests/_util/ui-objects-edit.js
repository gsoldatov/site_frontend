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
 * Returns all controls on the display tab of an object or subobject card.
 */
export const getObjectDisplayControls = container => {
    const displayTabContainer = container.querySelector(".objects-edit-display-tab-container");
    if (!displayTabContainer) return {};

    const result = {};

    // Common
    const publishObjectTooltip = queryByText(displayTabContainer, "Publish Object");
    if (publishObjectTooltip) result.publishObject = publishObjectTooltip.parentNode.querySelector("input");

    // Non-subobject card only
    const publishSubobjectsTooltip = queryByText(displayTabContainer, "Publish Subobjects");
    if (publishSubobjectsTooltip) result.publishSubobjects = publishSubobjectsTooltip.parentNode.querySelector("input");

    const showDescriptionTooltip = queryByText(displayTabContainer, "Show Description");
    if (showDescriptionTooltip) result.showDescription = showDescriptionTooltip.parentNode.querySelector("input");

    const showDescriptionAsLinkTooltip = queryByText(displayTabContainer, "Show Description as Link");
    if (showDescriptionAsLinkTooltip) result.showDescriptionAsLink = showDescriptionAsLinkTooltip.parentNode.querySelector("input");

    const displayModeTooltip = queryByText(displayTabContainer, "Composite Object Display Mode");
    if (displayModeTooltip) {
        const switchContainer = displayModeTooltip.parentNode.querySelector(".ui.dropdown.objects-edit-display-dropdown");
        result.displayMode = {
            selected: switchContainer.querySelector("div.divider"),
            options: {
                basic: queryByText(switchContainer.querySelector(".menu.transition"), "Basic").parentNode
            }
        };
    }
    else result.displayMode = { selectedMode: undefined, options: {}};

    // Subobject card only
    const showDescriptionCompositeTooltip = queryByText(displayTabContainer, "Show Description in Parent Object");
    if (showDescriptionCompositeTooltip) {
        const switchContainer = showDescriptionCompositeTooltip.parentNode.querySelector(".ui.dropdown.objects-edit-display-dropdown");
        result.showDescriptionComposite = {
            selected: switchContainer.querySelector("div.divider"),
            options: {
                yes: queryByText(switchContainer.querySelector(".menu.transition"), "Yes").parentNode,
                no: queryByText(switchContainer.querySelector(".menu.transition"), "No").parentNode,
                inherit: queryByText(switchContainer.querySelector(".menu.transition"), "Inherit").parentNode
            }
        };
    }
    else result.showDescriptionComposite = { selected: undefined, options: {}};

    const showDescriptionAsLinkCompositeTooltip = queryByText(displayTabContainer, "Show Description as Link in Parent Object");
    if (showDescriptionAsLinkCompositeTooltip) {
        const switchContainer = showDescriptionAsLinkCompositeTooltip.parentNode.querySelector(".ui.dropdown.objects-edit-display-dropdown");
        result.showDescriptionAsLinkComposite = {
            selected: switchContainer.querySelector("div.divider"),
            options: {
                yes: queryByText(switchContainer.querySelector(".menu.transition"), "Yes").parentNode,
                no: queryByText(switchContainer.querySelector(".menu.transition"), "No").parentNode,
                inherit: queryByText(switchContainer.querySelector(".menu.transition"), "Inherit").parentNode
            }
        };
    }
    else result.showDescriptionAsLinkComposite = { selected: undefined, options: {}};

    return result;
};


/**
 * Clicks on 'Publish Object' checkbox
 */
export const clickPublishObjectCheckbox = container => {
    const checkbox = getObjectDisplayControls(container).publishObject;
    fireEvent.click(checkbox);
};


/**
 * Clicks on 'Publish Subbjects' checkbox
 */
 export const clickPublishSubbjectsCheckbox = container => {
    const checkbox = getObjectDisplayControls(container).publishSubobjects;
    fireEvent.click(checkbox);
};


/**
 * Clicks on 'Show description' checkbox
 */
export const clickShowDescriptionCheckbox = container => {
    const checkbox = getObjectDisplayControls(container).showDescription;
    fireEvent.click(checkbox);
};


/**
 * Clicks on 'Show description as link' checkbox
 */
export const clickShowDescriptionAsLinkCheckbox = container => {
    const checkbox = getObjectDisplayControls(container).showDescriptionAsLink;
    fireEvent.click(checkbox);
};
