import { fireEvent } from "@testing-library/react";
import { getByText, getByPlaceholderText, queryByText, waitFor, screen } from "@testing-library/dom";

import { getSideMenuItem, getSideMenuDialogControls } from "./ui-common";
import { selectDate } from "./ui-react-datetime";
import { addAnExistingSubobject } from "./ui-composite";


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


const _objectTypeSwitchOptions = {
    link: "linkOption",
    markdown: "markdownOption",
    to_do_list: "toDoListOption",
    composite: "compositeOption"
};


/**
 * Opens 'General' tab and selects the provided `objectType` in object type switch inside `container`.
 */
export const setObjectType = (container, objectType) => {
    if (_objectTypeSwitchOptions[objectType] === undefined) throw Error(`Incorrect objectType value: '${objectType}'.`);

    clickGeneralTabButton(container);
    const otSwitch = getObjectTypeSwitchElements(container);
    fireEvent.click(otSwitch.switchContainer);
    fireEvent.click(otSwitch[_objectTypeSwitchOptions[objectType]]);
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

    const displayInFeedTooltip = queryByText(displayTabContainer, "Display in Feed");
    if (displayInFeedTooltip) result.displayInFeed = displayInFeedTooltip.parentNode.querySelector("input");

    const feedTimestampTooltip = queryByText(displayTabContainer, "Feed Timestamp");
    if (feedTimestampTooltip) result.feedTimestampContainer = feedTimestampTooltip.parentNode;

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
                basic: (queryByText(switchContainer.querySelector(".menu.transition"), "Basic") || {}).parentNode,
                grouped_links: (queryByText(switchContainer.querySelector(".menu.transition"), "Grouped Links") || {}).parentNode,
                multicolumn: (queryByText(switchContainer.querySelector(".menu.transition"), "Multicolumn") || {}).parentNode,
                chapters: (queryByText(switchContainer.querySelector(".menu.transition"), "Chapters") || {}).parentNode
            }
        };
    }
    else result.displayMode = { selected: undefined, options: {}};

    const numerateChaptersTooltip = queryByText(displayTabContainer, "Numerate Chapters");
    if (numerateChaptersTooltip) result.numerateChapters = numerateChaptersTooltip.parentNode.querySelector("input");

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
 * Clicks on 'Display in Feed' checkbox
 */
export const clickDisplayInFeedCheckbox = container => {
    const checkbox = getObjectDisplayControls(container).displayInFeed;
    fireEvent.click(checkbox);
};


/**
 * Selects a date in `Feed Timestamp` control.
 */
export const setFeedTimestampDate = async (container, date) => {
    const { feedTimestampContainer } = getObjectDisplayControls(container);
    await selectDate(feedTimestampContainer, date);
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


/**
 * Clicks on 'Numerate Chapters' checkbox
 */
 export const clickNumerateChaptersCheckbox = container => {
    const checkbox = getObjectDisplayControls(container).numerateChapters;
    fireEvent.click(checkbox);
};

/**
 * Sets attributes and object data on the /objects/edit/:id page (and, optionally sets provided `objectType`) required for adding/updating object data.
 */
export const fillRequiredAttributesAndData = async (container, store, { objectType }) => {
    // Set object type
    if (objectType) {
        if (_objectTypeSwitchOptions[objectType] === undefined) throw Error(`Incorrect objectType value: '${objectType}'`);

        const otSwitch = getObjectTypeSwitchElements(container);
        fireEvent.click(otSwitch.switchContainer);
        fireEvent.click(otSwitch[_objectTypeSwitchOptions[objectType]]);
    }

    // Set object attributes
    clickGeneralTabButton(container);

    let objectNameInput = getByPlaceholderText(container, "Object name");
    fireEvent.change(objectNameInput, { target: { value: "new object" } });

    // Set object data
    clickDataTabButton(container);

    const ot = getCurrentObject(store.getState()).object_type;
    switch (ot) {
        case "link":
            let linkInput = getByPlaceholderText(container, "Link");
            fireEvent.change(linkInput, { target: { value: "https://google.com" } });
            break;
        
        case "composite":
            await addAnExistingSubobject(container, 0, "first subobject", store, { waitForObjectLoad: true });
            await addAnExistingSubobject(container, 0, "second subobject", store, { waitForObjectLoad: true });
            break;
        
        default:
            throw Error(`Setting object data not implemented for object type '${ot}'.`);
    }
};
