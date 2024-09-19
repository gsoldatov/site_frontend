import { waitFor } from "@testing-library/react";


/**
 * Helper class for common operations with DOM nodes.
 * 
 * Accepts a CSS `selector` and an optional `parent` object, which can contain a reference to a parent `node` or `locator`.
 */
export class Locator {
    constructor(selector, parent = {}) {
        this.selector = selector;
        this.parentNode = parent.node;
        this.parentLocator = parent.locator;

        if(this.parentLocator) this.parentLocator.childLocators.push(this);

        this.childLocators = [];
        this.macthingNodes = null;
    }

    /**
     * Updates macthing nodes for this locator and its children.
     */
    refresh() {
        const parentNode = this.parentNode ? this.parentNode :
                           this.parentLocator ? this.parentLocator.node : document.body;

        if (parentNode) this.macthingNodes = parentNode.querySelectorAll(this.selector);
        else  this.macthingNodes = null;

        // Refresh, if a single node if found, otherwise reset to null
        if(this.macthingNodes !== null && this.macthingNodes.length === 1) this.childLocators.forEach(child => { child.refresh() });
        else this.childLocators.forEach(child => { child._resetMatchingNodes() });
    }

    /**
     * Refreshes macthing nodes, if they weren't refreshed before, then returns them.
     */
    get nodes() {
        if (this.macthingNodes === null) this.refresh();
        return this.macthingNodes;
    }

    /**
     * Refreshes macthing nodes, if they weren't refreshed before, throws 0 or more than 1 matches found or returns the only matching node.
     */
    get node() {
        if (this.macthingNodes === null) this.refresh();
        if (this.macthingNodes.length !== 1) throw Error(`Can't access a node via locator: found ${this.macthingNodes.length} matches for selector '${this.selector}'.`);
        return this.macthingNodes[0];
    }

    /**
     * Refreshes macthing nodes, if `refresh` is true, or matching nodes weren't refreshed before.
     * Returns true, if at least one match was found, and the first matching node is present in DOM, or false otherwise.
     */
    isOnPage(refresh) {
        if (refresh || this.macthingNodes === null) this.refresh();
        return this.macthingNodes.length > 0 && document.body.contains(this.macthingNodes[0]);
    }

    /**
     * Tries to wait for a matching node to appear on the page.
     */
    async waitFor() {
        await waitFor((() => {
            expect(this.isOnPage(true)).toBeTruthy();
        }).bind(this));
    }

    /**
     * Tries to wait for matching nodes to disappear from the page.
     */
    async waitForAbsence() {
        await waitFor((() => {
            expect(this.isOnPage(true)).toBeFalsy();
        }).bind(this));
    }

    /**
     * Resets `matchingNodes` of locator and its children to an empty `NodeList`.
     */
    _resetMatchingNodes() {
        this.macthingNodes = null;
        this.childLocators.forEach(child => { child._resetMatchingNodes() });
    }
}
