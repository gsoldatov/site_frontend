import { waitFor } from "@testing-library/react";


/**
 * Helper class for common operations with DOM nodes.
 * 
 * Accepts:
 * - a CSS `selector`;
 * - `parent` object, which can contain a reference to a parent `node` or `locator` (if omitted, container will be set to `document.body`);
 * - `options` object with additional locator configuration options:
 *      - `minDepth`: min distance between node & its parent in DOM tree (defaults to 1);
 *      - `maxDepth`: max distance between node & its parent in DOM tree (defaults to 100);
 */
export class Locator {
    constructor(selector, parent = {}, options = {}) {
        // Selector & parent node or locator
        this.selector = selector;
        this.parentNode = parent.node;
        this.parentLocator = parent.locator;

        // Options
        this.minDepth = "minDepth" in options ? options.minDepth : 1;
        this.maxDepth = "maxDepth" in options ? options.maxDepth : 100;

        if(this.parentLocator) this.parentLocator.childLocators.push(this);
        this.childLocators = [];

        this.macthingNodes = null;
    }

    /**
     * Updates macthing nodes for this locator and its children.
     */
    refresh() {
        try {
            // Try to get parent node (might fail, if `parentLocator` can't find the parent node)
            const parentNode = this.parentNode ? this.parentNode :
                            this.parentLocator ? this.parentLocator.node : document.body;
            
            // Find all matching nodes & filter them by min & max depths
            let macthingNodes = parentNode.querySelectorAll(this.selector);
            if (macthingNodes !== null) macthingNodes = [...macthingNodes].filter(node => {
                let depth = 0, curr = node;
                while (curr !== parentNode) {
                    curr = curr.parentNode;
                    depth += 1;
                }
                return depth >= this.minDepth && depth <= this.maxDepth;
            });

            this.macthingNodes = macthingNodes;
        } catch (e) {
            // If`SingleNodeNotFound` is thrown, parent node can't be accessed via parent locator,
            // which means that current locator can't find matches
            if (e instanceof SingleNodeNotFound) this.macthingNodes = null;
            else throw e;
        }

        // Refresh child locators, if a single node if found, otherwise reset to null
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
        const macthingNodesLength = this.macthingNodes === null ? 0 : this.macthingNodes.length;
        if (macthingNodesLength  !== 1)
            throw new SingleNodeNotFound(`Can't access a node via locator: found ${macthingNodesLength} matches for selector '${this.selector}'.`);
        return this.macthingNodes[0];
    }

    /**
     * Refreshes macthing nodes, if `refresh` is true, or matching nodes weren't refreshed before.
     * Returns true, if at least one match was found, and the first matching node is present in DOM, or false otherwise.
     */
    isOnPage(refresh) {
        if (refresh || this.macthingNodes === null) this.refresh();
        return this.macthingNodes !== null && this.macthingNodes.length > 0 && document.body.contains(this.macthingNodes[0]);
    }

    /**
     * Tries to wait for a matching node to appear on the page.
     */
    async waitFor() {
        await waitFor((function() {
            expect(this.isOnPage(true)).toBeTruthy();
        }).bind(this));
    }

    /**
     * Tries to wait for matching nodes to disappear from the page.
     */
    async waitForAbsence() {
        await waitFor((function() {
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


class SingleNodeNotFound extends Error {};
