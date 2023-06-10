import { parseComputedPropSize } from "./element-styles";


// /**
//  * Returns the caret position in the contenteditable node `element`.
//  * 
//  * Returns -1 if there is no cursor placed or a range of text is selected.
//  */
// export const getCaretPosition = element => {
//     let position = -1;
//     const isSupported = typeof window.getSelection !== "undefined";
//     if (isSupported) {
//       const selection = window.getSelection();
//       // Check if there is a selection (i.e. cursor in place)
//       if (selection.rangeCount !== 0) {
//         const range = window.getSelection().getRangeAt(0);          // Store the original range
//         if (range.startOffset === range.endOffset) {                // Return caret position only if there is no active selection in the node.
//             const preCaretRange = range.cloneRange();                   // Clone the range
//             preCaretRange.selectNodeContents(element);                  // Select all textual contents from the contenteditable element
//             preCaretRange.setEnd(range.endContainer, range.endOffset);  // And set the range end to the original clicked position
//             position = preCaretRange.toString().length;                 // Return the text length from contenteditable start to the range end
//         }
//       }
//     }
//     return position;
// };


/**
 * Returns the caret position or selected range's end in the contenteditable node `element`.
 * Returns -1 if there is selection does not end inside the `element`.
 * 
 * @param {Element} element - DOM element.
 * @returns {number} caret position or -1.
 */
export const getCaretPosition = element => {
    const isSupported = typeof window.getSelection !== "undefined";
    if (!isSupported) return -1;
    
    const selection = window.getSelection();
    if (selection.focusNode !== element && !element.contains(selection.focusNode)) return -1;

    return selection.focusOffset;
};


/**
 * Returns text before and after caret position in the `element`.
 */
export const getSplitText = element => {
    const position = getCaretPosition(element);
    if (position === -1) return null;
    return {
        before: element.textContent.slice(0, position),
        after: element.textContent.slice(position)
    };
};


/**
 * Returns the current line number of the caret in an `element`.
 * If a caret is not set inside the current element, returns -1.
 * @param {Element} element - DOM element to calculate the line number for.
 * @returns {Array[number]} - list with line number and offset of the caret or [-1, 0].
 */
export const getCaretPositionData = element => {
    // Get caret position
    const caretPosition = getCaretPosition(element);
    if (caretPosition === -1) return [-1, 0];

    // Get max line width in px
    // const maxLineWidth = parseComputedPropSize(element, "width") - parseComputedPropSize(element, "paddingLeft") - parseComputedPropSize(element, "paddingRight");
    const maxLineWidth = parseComputedPropSize(element, "width");   // include paddings both here & when getting clone width

    // Get a copy of the element
    const clone = element.cloneNode(true);
    clone.style.visibility = "hidden";
    clone.style.position = "absolute";
    clone.style.top = 0;
    clone.style.left = 0;
    clone.style.paddingLeft = getComputedStyle(element).paddingLeft;
    clone.style.paddingRight = getComputedStyle(element).paddingRight;
    document.body.appendChild(clone);   // appending is required in order to calculate styles

    const text = element.textContent;

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
