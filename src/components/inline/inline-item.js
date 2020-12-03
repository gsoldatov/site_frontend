import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "semantic-ui-react";


// Basic inline item component. Should be wrapped in a component which passes list-specific props to it.
export const InlineItem = ({ text, itemClassName, onClick, itemLink }) => {
    const _itemClassName = itemClassName || "inline-item";

    const [isHovered, setIsHovered] = useState(false);
    const onHoverLink = isHovered && itemLink && (
        <Link to={itemLink}>
            <Icon className="inline-item-link-icon" name="chain" color="black" />
        </Link>
    );

    return (
        <span className={_itemClassName} onMouseOver={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
            <span className="inline-item-text" onClick={onClick}>{text}</span>
            {onHoverLink}
        </span>
    );
};
