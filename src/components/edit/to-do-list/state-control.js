import React, { useState } from "react";
import { Icon } from "semantic-ui-react";


/*
    To-do list item state control menu & buttons.
*/
export const stateControlParams = {
    completed: { icon: "check square outline", title: "Set item as complete", iconColor: "green", inputCSSClass: "to-do-list-item-input completed" },
    active: { icon: "square outline", title: "Set item as active", iconColor: "black", inputCSSClass: "to-do-list-item-input" },
    optional: { icon: "question circle outline", title: "Set item as opitonal", iconColor: "blue", inputCSSClass: "to-do-list-item-input optional" },
    cancelled: { icon: "ban", title: "Set item as cancelled", iconColor: "red", inputCSSClass: "to-do-list-item-input cancelled" }
};


export const StateControl = ({ id, state, updateCallback }) => {
    const [isHovered, setIsHovered] = useState(false);
    const buttonOnClick = state => {
        setIsHovered(false);
        updateCallback({ toDoListItemUpdate: { command: "update", id, item_state: state }});
    };

    let k = 0;
    return (
        <div className="to-do-list-item-state-menu" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
            <StateControlButton state={state} onClick={buttonOnClick} />
            {isHovered && Object.keys(stateControlParams).filter(s => s !== state).map(s => <StateControlButton key={k++} state={s} onClick={buttonOnClick} />)}
        </div>
    );    
};


export const StateControlButton = ({ state, onClick }) => {
    const { icon, title, iconColor } = stateControlParams[state];
    return <Icon className="to-do-list-item-button" color={iconColor} name={icon} title={title} onClick={() => onClick(state)} />;
};
