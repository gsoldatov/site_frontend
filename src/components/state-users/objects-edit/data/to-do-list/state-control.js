import React, { memo } from "react";
import { Icon } from "semantic-ui-react";

import { ToDoListSelectors } from "../../../../../store/selectors/data/objects/to-do-list";


export const stateControlParams = {
    active: { icon: "square outline", title: "Set item as optional", iconColor: "black", inputCSSClass: "to-do-list-item-input" },
    optional: { icon: "question circle outline", title: "Set item as completed", iconColor: "blue", inputCSSClass: "to-do-list-item-input optional" },
    completed: { icon: "check square outline", title: "Set item as cancelled", iconColor: "green", inputCSSClass: "to-do-list-item-input completed" },
    cancelled: { icon: "ban", title: "Set item as active", iconColor: "red", inputCSSClass: "to-do-list-item-input cancelled" }
};


/**
 * To-do list item state control menu.
 */
export const StateControl = memo(({ id, state, updateCallback }) => {
    const { icon, title, iconColor } = stateControlParams[state];

    const onClick = e => {
        updateCallback({ toDoListItemUpdate: { command: "update", id, item_state: ToDoListSelectors.nextItemState(state) }});
    };
    
    return (
        <div className="to-do-list-item-state-menu">
            <Icon className="to-do-list-item-button" color={iconColor} name={icon} title={title} onClick={onClick} />
        </div>
    );    
});
