import { queryByText, queryAllByText, screen, getByText } from "@testing-library/dom";


/**
 * Returns the input node of the InlineInput component inside the container
 */
export const getInlineInputField = ({ container, currentQueryText }) => {
    let placeholder = queryByText(container, "Enter tag name...");
    if (!placeholder && currentQueryText) queryAllByText(container, currentQueryText).forEach(node => {
        if (node.parentNode.className.indexOf("default") > -1 && node.parentNode.className.indexOf("text") > -1) placeholder = node.parentNode;
    });
    if (!placeholder) return null;
    return placeholder.parentNode.querySelector("input");
};


/**
 * Returns the dropdown list node of the InlineInput component inside the container
 */
export const getDropdownOptionsContainer = ({ container, currentQueryText }) => {
    const input = getInlineInputField({ container, currentQueryText });
    if (!input) return null;
    return input.parentNode.querySelector(".menu.transition");
};


/**
 * Returns the node of the dropdown list with the matching text
 */
export const getTagInlineItem = ({ container, text }) => {
    let tag;
    queryAllByText(container, text).forEach(node => {
        if (node.className.indexOf("inline-text") > -1) tag = node;
    });
    return tag;
};
