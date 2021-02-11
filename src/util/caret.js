// Returns the caret position in the contenteditable node.
// Returns -1 if a range of text is selected.
export const getCaretPosition = element => {
    let position = -1;
    const isSupported = typeof window.getSelection !== "undefined";
    if (isSupported) {
      const selection = window.getSelection();
      // Check if there is a selection (i.e. cursor in place)
      if (selection.rangeCount !== 0) {
        const range = window.getSelection().getRangeAt(0);          // Store the original range
        if (range.startOffset === range.endOffset) {                // Return caret position only if there is no active selection in the node.
            const preCaretRange = range.cloneRange();                   // Clone the range
            preCaretRange.selectNodeContents(element);                  // Select all textual contents from the contenteditable element
            preCaretRange.setEnd(range.endContainer, range.endOffset);  // And set the range end to the original clicked position
            position = preCaretRange.toString().length;                 // Return the text length from contenteditable start to the range end
        }
      }
    }
    return position;
};


// Returns text before and after caret position in the element
export const getSplitText = element => {
    const position = getCaretPosition(element);
    if (position === -1) return null;
    return {
        before: element.textContent.slice(0, position),
        after: element.textContent.slice(position)
    };
};
