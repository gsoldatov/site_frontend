import React from "react";
import { Button, Icon, Menu } from "semantic-ui-react";

import { useSideMenuState } from "./side-menu";


/**
 * Basic side menu item.
 */
export const SideMenuItem = ({ text, icon, iconColor, iconFlipped, isActive = true, onClick }) => {
    const isItemStacked = useSideMenuState(state => state.isItemStacked);

    onClick = isActive ? onClick : undefined;

    // Icon
    icon = icon && <Icon name={icon} color={iconColor} flipped={iconFlipped} />;

    // Text
    text = isItemStacked ? undefined : text;
    
    return (
        <Menu.Item className="side-menu-item-container" disabled={!isActive}> 
            <Button icon={isItemStacked} className="side-menu-item" onClick={onClick} disabled={!isActive} title={text}>
                {icon}
                {text}
            </Button>
        </Menu.Item>
    );
};
