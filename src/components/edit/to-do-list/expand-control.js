import React from "react";
import { Icon } from "semantic-ui-react";


/*
    To-do list expand/collapse control.
*/
export const ExpandControl = ({ id, is_expanded, updateCallback }) => {
    const name = is_expanded ? "triangle down" : "triangle right";
    const onClick = () => updateCallback({ toDoListItemUpdate: { command: "update", id, is_expanded: !is_expanded }});
    return <Icon name={name} className="to-do-list-item-button" onClick={onClick} />;
};
