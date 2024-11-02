import { parseComputedPropSize } from "./element-styles";


/**
 * Returns text before and after caret position in the `element`.
 */
export const getSplitText = (element: HTMLElement) => {
    const position = getElementCaretPosition(element);
    if (position === -1) return null;

    return {
        before: (element.textContent as string).slice(0, position),
        after: (element.textContent as string).slice(position)
    };
};


/**
 * Returns the current line number and offset from line start of the caret in an `element`.
 * 
 * If `element` is a text node, calculates line number relative to the whole text content of its parent
 * (NOTE: might require rechecking if text nodes are actually provided into the function, and the function processes them as described above;
 * at the moment typing is done for HTML elements only).
 * 
 * If a caret is not set inside the current element, returns [-1, 0].
 * 
 * NOTE: this function will return [-1, 0] as a fallback value if element styles can't be computed (for example, in tests).
 */
export const getCaretPositionData = (element: HTMLElement): [number, number] => {
    // Get caret position
    const caretPosition = getElementCaretPosition(element);
    if (caretPosition === -1) return [-1, 0];

    // Get max line width in px
    // const maxLineWidth = parseComputedPropSize(element, "width") - parseComputedPropSize(element, "paddingLeft") - parseComputedPropSize(element, "paddingRight");
    const maxLineWidth = parseComputedPropSize(element, "width");   // include paddings both here & when getting clone width
    if (isNaN(maxLineWidth)) return [-1, 0];    // Fallback exit if element's computed styles are not calculated to avoid endless loop
                                                // (required for running tests without adding a mock on `getComputedStyle`)

    // Get a copy of the element
    const clone = element.cloneNode(true) as HTMLElement;
    clone.style.visibility = "hidden";
    clone.style.position = "absolute";      // setting position is required for function to work
    clone.style.paddingLeft = getComputedStyle(element).paddingLeft;
    clone.style.paddingRight = getComputedStyle(element).paddingRight;
    document.body.appendChild(clone);   // appending is required in order to calculate styles

    const text = element.textContent as string;

    let i = 0, line = 0, lineStart = 0;

    // Insert lines of text into clone, until line with caret position is reached
    while (i < caretPosition && i < text.length) {
        clone.textContent = text.slice(i);
        lineStart = i;

        // Exit, if the remaining part of text fits into a single line
        if (parseComputedPropSize(clone, "width") <= maxLineWidth) {
            clone.remove();
            return [line, caretPosition - lineStart];
        }
        
        // Calculate the number of chars which fit the line by decomposing it into a sum of 2 ^ pow terms
        //
        // number = Sum(Cpow * 2^pow),
        // where 1 <= 2^pow < remainingChars,
        // Cpow = {0, 1}
        const remainingChars = text.length - i;
        let pow = Math.log(remainingChars) / Math.log(2);   // ln(x) / ln(2) = log2(x)
        pow = pow === Math.floor(pow) ? pow - 1 : Math.floor(pow);  // set `pow` to highest integer power, for which 2^power < remainingChars

        let lineText = "";

        while (pow >= 0) {
            const numOfChars = 2 ** pow;
            const tempText = lineText + text.slice(i, i + numOfChars);
            clone.textContent = tempText;

            if (parseComputedPropSize(clone, "width") <= maxLineWidth) {
                lineText = tempText;
                i += numOfChars;
            }

            pow -= 1;
        }
        
        if (i >= caretPosition) break;
        line += 1;
    }

    clone.remove();
    return [line, caretPosition - lineStart];
};


/**
 * Places caret inside the `element` at the specified `position`.
 * If the `element` contains text node children, places caret into one of them at the corresponding position.
 * 
 * If `position` can't be found in the `element`, caret is placed at its end (or at the end of its last text child).
 */
export const setCaret = (element: HTMLElement, position: number) => {
    const totalTextContentLength = (element.textContent as string).length;

    // Update `position` value to fit into the element, 
    // if it could not be calculated or is greater than `totalTextContentLength`
    if (position === -1) position = totalTextContentLength;
    position = Math.min(position, totalTextContentLength);
    
    // Get nodes into which a caret can be inserted;
    // These can be any child text nodes, or,
    // if an element has no child nodes (e.g., an empty contenteditable <div>), the element itself
    let nodes: Node[] = [...element.childNodes].filter(n => n.constructor === Text);
    if (nodes.length === 0) nodes = [element];
    
    // Calculate the target element and a position in it to place caret into
    let target, targetPosition;

    // If there's 1 or 0 child nodes, insert into the child/element at the `position`
    if (nodes.length === 1) {
        target = nodes[0], targetPosition = position;
    } 
    // If there's more than 1 child, insert into the child, which contains the caret `position` relative to its parent's textContent
    else {
        let number = 0, nodeStartPosition = 0;

        while (nodeStartPosition < totalTextContentLength) {
            const nodeLength = (nodes[number].textContent as string).length;
            
            // Current child contains the caret position
            if (position < nodeStartPosition + nodeLength) {
                target = nodes[number];
                targetPosition = position - nodeStartPosition;
                break;
            }

            // Target position is after the last char of the current element
            else if (position === nodeStartPosition + nodeLength) {
                // If there is another element after the current, place caret in its start
                if (number < nodes.length - 1) {
                    target = nodes[number + 1];
                    targetPosition = 0;
                    break;
                } 

                // If current element is last, place caret in its end
                else {
                    target = nodes[number];
                    targetPosition = (target.textContent as string).length;
                    break;
                }
            }

            // Current node does not contain the position
            else {
                number += 1;
                nodeStartPosition += nodeLength;
            }
        }
    }

    // Place caret in the target position
    if (target !== undefined && targetPosition !== undefined) {
    const range = document.createRange();
    range.setStart(target, targetPosition);
    // range.collapse = true;
    range.collapse(true);

    const selection = window.getSelection() as Selection;
    selection.removeAllRanges();
    selection.addRange(range);
    }
};


/** Returns true if a selection currently exists or false otherwise. */
export const isRangeSelected = () => {
    const selection = window.getSelection();
    if (!selection) return false;
    return !selection.isCollapsed;
};


/**
 * Returns the caret position or selection range's end inside the `node`.
 * 
 * If caret position is outside of `node`, returns -1.
 */
const getElementCaretPosition = (node: Node) => {
    const isSupported = typeof window.getSelection !== "undefined";
    if (!isSupported) return -1;
    
    const selection = window.getSelection();
    if (!selection) return -1;
    if (selection.focusNode !== node && !node.contains(selection.focusNode)) return -1;

    let position = selection.focusOffset;

    // If caret is placed inside a text node, which is a direct child of `element`, add preceding children's length to the result
    if (selection.focusNode instanceof Text) {
        if (selection.focusNode.parentNode !== node) return -1;    // nested children are not supported
        for (let child of node.childNodes) {
            if (child === selection.focusNode) break;
            position += (child.textContent as string).length;
        }
    }

    return position;
};