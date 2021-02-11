// Returns true if data in provided items is equal
export const compareItemData = (firstItemData, secondItemData) => {
    const attrs = ["item_data", "item_state", "commentary"];
    for (let attr of attrs)
        if (firstItemData[attr] !== secondItemData[attr]) return false;
    return true;
    // const firstItemText = firstItemData.item_text, firstItemState = firstItemData.item_state, firstItemCommentary = firstItemData.commentary;
    // const secondItemText = secondItemData.item_text, secondItemState = secondItemData.item_state, secondItemCommentary = secondItemData.commentary;
    // return firstItemText === secondItemText && firstItemState === secondItemState && firstItemCommentary === secondItemCommentary;
};