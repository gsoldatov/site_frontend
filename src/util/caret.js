// Returns the caret position in the contenteditable node ()
export const getCaretPosition = element => {
    let position = -1;
    const isSupported = typeof window.getSelection !== "undefined";
    if (isSupported) {
      const selection = window.getSelection();
      // Check if there is a selection (i.e. cursor in place)
      if (selection.rangeCount !== 0) {
        const range = window.getSelection().getRangeAt(0);          // Store the original range
        const preCaretRange = range.cloneRange();                   // Clone the range
        preCaretRange.selectNodeContents(element);                  // Select all textual contents from the contenteditable element
        preCaretRange.setEnd(range.endContainer, range.endOffset);  // And set the range end to the original clicked position
        position = preCaretRange.toString().length;                 // Return the text length from contenteditable start to the range end
      }
    }
    console.log(`IN getCaretPosition, position = ${position}`)
    return position;
  }