import { fireEvent } from "@testing-library/react";
import { getByText, getByTitle, waitFor } from "@testing-library/dom";

import { getInlineInputField, getDropdownOptionsContainer, getTagInlineItem } from "../test-utils/ui-objects-tags";


export const getCurrentObject = state => state.editedObjects[state.objectUI.currentObjectID];


export const getObjectTypeSelectingElements = container => {
    // Check if object types selector is rendered and enabled
    const objectTypeSelector = container.querySelector(".object-type-menu");
    const mainContentContainer = container.querySelector("div.twelve.wide.column");
    const objectNameDescriptionInput = container.querySelector(".edit-page-textarea").parentNode.parentNode;  // name + descr form
    expect(objectTypeSelector).toBeTruthy();
    expect(mainContentContainer).toBeTruthy();
    expect(objectNameDescriptionInput).toBeTruthy();

    // Get link, markdown and to-do selecting elements
    let linkButton, markdownButton, TDLButton;
    objectTypeSelector.querySelectorAll(".object-type").forEach(node => {
        const innerHTML = node.innerHTML;
        if (innerHTML.includes("Link")) linkButton = node;
        else if (innerHTML.includes("Markdown")) markdownButton = node;
        else if (innerHTML.includes("To-Do List")) TDLButton = node;
    });
    expect(linkButton).toBeTruthy();
    expect(markdownButton).toBeTruthy();
    expect(TDLButton).toBeTruthy();
    return { linkButton, markdownButton, TDLButton };
};


const getObjectTabMenuButtons = container => {
    // Get general and data tab panes
    const tabMenu = container.querySelector(".ui.attached.tabular.menu");
    expect(tabMenu).toBeTruthy();
    const generalTabButton = getByText(tabMenu, "General");
    const dataTabButton = getByText(tabMenu, "Data");
    return { generalTabButton, dataTabButton };
}


export const clickGeneralTabButton = container => {
    const { generalTabButton } = getObjectTabMenuButtons(container);
    fireEvent.click(generalTabButton);
}


export const clickDataTabButton = container => {
    const { dataTabButton } = getObjectTabMenuButtons(container);
    fireEvent.click(dataTabButton);
}


export const resetObject = container => {
    const resetButton = getByText(container, "Reset");
    fireEvent.click(resetButton);
    const confimationDialogButtonYes = getByText(container, "Yes");
    fireEvent.click(confimationDialogButtonYes);
}


// For the /objects page tag update (expects container to be an /objects/:id page)
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
