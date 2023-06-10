/**
 * Gets a computed style value of an `attr` of the `node` and parses it into a number.
 * 
 * @param {Node} node - an existing DOM Node.
 * @param {string} attr - name of the computed attribute
 */
export const parseComputedPropSize = (node, attr) => parseFloat(getComputedStyle(node)[attr].replace("px", ""));

/**
 * Calculates height of a `node` in lines of its text.
 * 
 * NOTE: this function will return 1 as a fallback value if element styles can't be computed (for example, in tests)
 * 
 * @param {Node} node - an existing DOM Node.
 * @returns {number} current number of text lines element's content takes.
 */
export const getElementHeightInLines = node => {
    const height = parseComputedPropSize(node, "height");
    const paddingTop = parseComputedPropSize(node, "paddingTop");
    const paddingBottom = parseComputedPropSize(node, "paddingBottom");
    const lineHeight = parseComputedPropSize(node, "lineHeight");

    // Round results
    let result = Math.round((height - paddingTop - paddingBottom) / lineHeight);

    // Add a fallback if styles could not computed (needed for running tests)
    return isNaN(result) ? 1 : result;
};
