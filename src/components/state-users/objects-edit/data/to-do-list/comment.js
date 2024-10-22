import React, { useState, useEffect, useMemo } from "react";
import { Icon, Popup } from "semantic-ui-react";


/**
 * To-do list item comment button & edit window.
 */
export const Comment = ({ id, commentary, updateCallback, updateInnerHTMLRequired }) => {
    const [initialCommentary, setInitialCommentary] = useState(commentary);

    // Reset innerHTML of an open commentary (it shouldn't be open, but in case it is) after edited object was reset
    // If the comment becomes displayable during reset button click, it may be needed to pass a random `key` prop into contentEditable <div> to force rerender (see <TDLItem> component)
    useEffect(() => {
        if (updateInnerHTMLRequired) setInitialCommentary(commentary);
    }, [updateInnerHTMLRequired]);

    const handleKeyDown = useMemo(
        () => e => { if (e.key === "Enter") e.preventDefault(); }
    , []);

    const handleInputChange = useMemo(
        () => e => updateCallback({ toDoListItemUpdate: { command: "update", id, commentary: e.currentTarget.textContent }})
    , []);

    const iconClassName = "to-do-list-item-button comment" + (commentary.length > 0 ? " has-comment" : "");
    const trigger = <Icon className={iconClassName} name="comment" title="Item comment" />;
    
    return (
        <Popup position="top center"
            trigger={trigger}
            hoverable
            onOpen={() => setInitialCommentary(commentary)}     // inner HTML value must be updated on every open
        >
            <div className="to-do-list-item-comment-input" contentEditable suppressContentEditableWarning 
                onKeyDown={handleKeyDown} onInput={handleInputChange} dangerouslySetInnerHTML={{ __html: initialCommentary }} />
        </Popup>
    );
};
