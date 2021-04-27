import { fireEvent } from "@testing-library/react";
import { getByText } from "@testing-library/dom";


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
