import { fireEvent, queryByText } from "@testing-library/react";


/**
 * Common actions & checks for DOM nodes.
 */
export class Actions {
    static click(node) {
        fireEvent.click(node);
    }

    /**
     * Checks if `node` is a DOM node and its text equals to `expected`.
     */
    static hasText(node, expected) {
        if (!(node instanceof Node)) return false;
        return node.textContent === expected;
    }

    /**
     * Checks if `node` is a DOM node and its text contains `expected`.
     */
    static containsText(node, expected) {
        if (!(node instanceof Node)) return false;
        return node.textContent.includes(expected);
    }

    /**
     * Checks if `node` is a DOM node and any of its child node's text equals to `expected`.
     */
    static hasTextInChildren(node, expected) {
        if (!(node instanceof Node)) return false;
        return queryByText(node, expected) !== null;
    }

    /**
     * Checks if `node` is a DOM node and any of its child node's text contains `expected`.
     */
    static containsTextInChildren(node, expected) {
        if (!(node instanceof Node)) return false;
        return queryByText(node, expected, { exact: false }) !== null;
    }

    /**
     * Checks if `img` is an image DOM node and its src matches to `expected`.
     */
    static hasSrc(img, expected) {
        if (!(img instanceof Node)) return false;
        if (img.tagName !== "IMG") return false;
        return img.src === expected;
    }

    /**
     * Returns all child nodes inside `container` matching `selector`.
     * If `expectedCount` is provided, ensures it's equal to the total number matches.
     */
    static getMatchingChildren(container, selector, expectedCount) {
        const result = [...container.querySelectorAll(selector)];
        if (expectedCount !== undefined && result.length !== expectedCount) fail(`Expected ${expectedCount} matches for '${selector}', found ${result.length}`);
        return result;
    }
}
