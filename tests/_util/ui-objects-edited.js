import { fireEvent } from "@testing-library/react";
import { getByText, getByTitle } from "@testing-library/dom";


/**
 * Returns the header cells from from edited objects page table.
 */
export const getEditedObjectsHeaderCells = container => {
    const table = container.querySelector(".edited-objects-table");
    if (!table) return {};

    const cells = table.querySelectorAll("thead th");

    return {
        checkboxCell: cells[0],
        controlsCell: cells[6]
    };
};

/**
 * Returns the cells from the row in the edited objects table for the object with the specified `objectName`.
 */
export const getEditedObjectItemRow = (container, objectName) => {
    const table = container.querySelector(".edited-objects-table");
    if (!table) return {};

    const rows = table.querySelectorAll("tbody > tr");

    for (let row of rows) {
        const cells = row.querySelectorAll("td");
        const rowObjectName = cells[3].childNodes[0].textContent;
        if (rowObjectName === objectName)
            return {
                checkboxCell: cells[0],
                newIndicatorCell: cells[1],
                objectTypeCell: cells[2],
                objectNameCell: cells[3],
                parentLinksCell: cells[4],
                subobjectsIndicatorCell: cells[5],
                controlsCell: cells[6]
            };
    }

    return {};
};


/**
 * Clicks a delete control element in the provided `cell`.
 * 
 * If `withSubobjects` is true, click on delete with subobjects control.
 * 
 * If `selected` is true, clicks on a corresponding header control (assuming header cell is provided).
 */
export const clickDeleteControl = ({cell, withSubobjects = false, selected = false }) => {
    const title = deleteControlTitles[withSubobjects][selected];
    fireEvent.click(getByTitle(cell, title));
};


/**
 * Possible delete control titles. First level is `withSubobjects`, second is `selected`.
 */
const deleteControlTitles = {
    [true]: {
        [true]: "Remove selected edited objects with subobjects",
        [false]: "Remove edited object with subobjects"
    },
    [false]: {
        [true]: "Remove selected edited objects",
        [false]: "Remove edited object"
    }
};


/**
 * Clicks on a confirm button in the provided `body` (confirm is render as a child of <body> tag).
 * 
 * If `confirm` is true, clicks on confirm button, otherwise - on cancel button.
 */
export const clickConfirmButton = ({ body, confirm = false }) => {
    const confirmContainer = body.querySelector(".modal.transition.visible");
    expect(confirmContainer).toBeTruthy();
    const text = confirm ? "OK" : "Cancel";
    fireEvent.click(getByText(confirmContainer, text));
};


/**
 * Clicks a checkbox in a provided `cell`.
 */
export const clickCheckbox = cell => {
    const checkbox = cell.querySelector("div.checkbox");
    expect(checkbox).toBeTruthy();
    fireEvent.click(checkbox);
};