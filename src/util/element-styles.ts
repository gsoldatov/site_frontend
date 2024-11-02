/**
 * Gets a computed style value of an `prop` of the `element` and parses it into a number.
 */
export const parseComputedPropSize = (element: HTMLElement, prop: string) => {
    const computedStyle = getComputedStyle(element) as Record<string, any>;
    if (!(prop in computedStyle)) throw Error(`Failed to get computed style for prop '${prop.toString()}' of ${element}.`);
    return parseFloat(computedStyle[prop].replace("px", ""));
};


/**
 * Calculates height of an `element` in lines of its text.
 * 
 * NOTE: this function will return 1 as a fallback value if element styles can't be computed (for example, in tests)
 */
export const getElementHeightInLines = (element: HTMLElement) => {
    const height = parseComputedPropSize(element, "height");
    const paddingTop = parseComputedPropSize(element, "paddingTop");
    const paddingBottom = parseComputedPropSize(element, "paddingBottom");
    const lineHeight = parseComputedPropSize(element, "lineHeight");

    // Round results
    let result = Math.round((height - paddingTop - paddingBottom) / lineHeight);

    // Add a fallback if styles could not computed (needed for running tests)
    return isNaN(result) ? 1 : result;
};
