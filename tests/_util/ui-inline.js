import { queryAllByText, screen } from "@testing-library/react";


/**
 * Returns elements of an inline item inside the provided `container`, `item` ifself or looks for an inline item with the provided `text`.
 */
export const getInlineItem = ({ container, item, text }) => {
    let result = {
        item: null,
        textSpan: null,

        link: null,
        linkTagID: null,

        icons: []
    };

    // Get `item` for the provided `text`
    if (text) {
        item = null;
        const nodes = queryAllByText(container, text);
        if (nodes.length === 0) return result;

        for (let node of nodes)
            if (node.className.indexOf("inline-text") > -1) {
                if (node.parentNode.tagName.toLowerCase() === "span")
                    item = node.parentNode;  // no link is set
                else item = node.parentNode.parentNode;  // link is set
                break;
            }
    }

    // Get `item` inside the `container` if it's set
    if (!item) item = container.querySelector(".inline-item");

    if (item) {
        result.item = item;
        result.textSpan = item.querySelector(".inline-text");
        result.link = item.querySelector(".inline-text-link");
        if (result.link) {
            const tagIDMatch = result.link.href.match(/\/tags\/view\?tagIDs=(?<id>\d+)$/);
            if (tagIDMatch) result.linkTagID = parseInt(tagIDMatch.groups["id"]);
        }

        const icons = item.querySelectorAll(".inline-item-icon");
        if (icons) result.icons = [...icons];
    }

    return result;
};