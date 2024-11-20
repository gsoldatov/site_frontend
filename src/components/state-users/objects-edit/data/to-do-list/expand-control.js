import React from "react";
import { Icon } from "semantic-ui-react";


/**
 * To-do list item's expand/collapse control.
 */
export const ExpandControl = ({ id, is_expanded, updateCallback }) => {
    const name = is_expanded ? "triangle down" : "triangle right";
    const title = is_expanded ? "Collapse item" : "Expand item";
    const onClick = () => updateCallback({ toDoListItemUpdate: { command: "updateItem", itemID: id, is_expanded: !is_expanded }});
    return <Icon name={name} className="to-do-list-item-button" title={title} onClick={onClick} />;
};
