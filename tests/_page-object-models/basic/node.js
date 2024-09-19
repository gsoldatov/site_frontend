import { fireEvent, queryByText } from "@testing-library/react";


/**
 * Generic object model for a DOM node.
 * 
 * Can working with a `Locator` instance or a DOM Node object.
 */
export class NodeModel {
    constructor(locator, node) {
        this.locator = locator;
        this._node = node;
    }

    get node() {
        return this._node || this.locator.node;
    }

    async waitFor() {
        if (this._node) throw Error("Can't use method without a locator")
        await this.locator.waitFor();
    }

    async waitForAbsence() {
        if (this._node) throw Error("Can't use method without a locator")
        await this.locator.waitForAbsence();
    }

    click() {
        fireEvent.click(this.node);
    }

    /**
     * Returns true if text of node equals to `expected`.
     */
    hasText(expected) {
        return this.node.textContent === expected;
    }

    /**
     * Returns true if text of node contains `expected`.
     */
    containsText(expected) {
        return this.node.textContent.includes(expected);
    }

    /**
     * Returns true if any child of node has text content equal to `expected`.
     */
    hasTextInChildren(expected) {
        return queryByText(this.node, expected) !== null;
    }

    /**
     * Returns true if any child of node contains `expected` in its text.
     */
    containsTextInChildren(expected) {
        return queryByText(this.node, expected, { exact: false }) !== null;
    }

    /**
     * Returns a `NodeList` with child nodes matching the `selector`.
     */
    getChildNodes(selector) {
        return this.node.querySelectorAll(selector);
    }

    getChildImages() {
        return this.getChildNodes("img");
    }
}
