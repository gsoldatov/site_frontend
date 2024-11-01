import { fireEvent, queryByText } from "@testing-library/react";


/**
 * Common actions & checks for DOM elements.
 */
export class Actions {
    static click(element: HTMLElement) {
        fireEvent.click(element);
    }

    /**
     * Checks if `element` is a DOM element and its text equals to `expected`.
     */
    static hasText(element: any, expected: string) {
        if (!(element instanceof HTMLElement)) return false;
        return element.textContent === expected;
    }

    /**
     * Checks if `element` is a DOM element and its text contains `expected`.
     */
    static containsText(element: any, expected: string) {
        if (!(element instanceof HTMLElement)) return false;
        return (element.textContent || "").includes(expected);
    }

    /**
     * Checks if `element` is a DOM element and any of its child element's text equals to `expected`.
     */
    static hasTextInChildren(element: any, expected: string) {
        if (!(element instanceof HTMLElement)) return false;
        return queryByText(element, expected) !== null;
    }

    /**
     * Checks if `element` is a DOM element and any of its child element's text contains `expected`.
     */
    static containsTextInChildren(element: any, expected: string) {
        if (!(element instanceof HTMLElement)) return false;
        return queryByText(element, expected, { exact: false }) !== null;
    }

    /**
     * Checks if `img` is an image DOM element and its src matches to `expected`.
     */
    static hasSrc(img: any, expected: string) {
        if (!(img instanceof HTMLImageElement)) return false;
        return img.src === expected;
    }

    /**
     * Returns all child elements inside `container` matching `selector`.
     * If `expectedCount` is provided, ensures it's equal to the total number matches.
     */
    static getMatchingChildren(container: HTMLElement, selector: string, expectedCount: number) {
        const result = [...container.querySelectorAll(selector)];
        if (expectedCount !== undefined && result.length !== expectedCount) fail(`Expected ${expectedCount} matches for '${selector}', found ${result.length}`);
        return result;
    }
}
