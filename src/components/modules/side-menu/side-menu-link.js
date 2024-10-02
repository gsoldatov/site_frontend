import React, { useContext } from "react";
import { Button, Icon, Menu } from "semantic-ui-react";
import { Link } from "react-router-dom";

import { SideMenuContext } from "./side-menu";


/**
 * Side menu item, which redirects on click.
 */
export const SideMenuLink = ({ text, icon, iconColor, iconFlipped, isActive = true, URL }) => {
    const { isItemStacked } = useContext(SideMenuContext);

    // Icon
    icon = icon && <Icon name={icon} color={iconColor} flipped={iconFlipped} />;

    // Text
    text = isItemStacked ? undefined : text;

    // Result, wrapped into a <Link>, when element is active
    let result = (
        <Button icon={isItemStacked} className="side-menu-item" disabled={!isActive} title={text}>
            {icon}
            {text}
        </Button>
    );

    if (isActive) result = (
        <Link to={URL}>
            {result}
        </Link>
    );
    
    return (
        <Menu.Item className="side-menu-item-container" disabled={!isActive}>
            {result}
        </Menu.Item>
    );
};
