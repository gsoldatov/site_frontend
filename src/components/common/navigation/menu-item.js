import React, { memo } from "react";
import { Label, Menu } from "semantic-ui-react";
import { NavLink } from "react-router-dom";


/**
 * Basic navbar item with a link to another page.
 */
export const NavbarItem = memo(({ isDisplayed, text, url, labelText, labelColor }) => {
    if (!isDisplayed) return null;

    const label = labelText && <Label size="tiny" circular color={labelColor}>{labelText}</Label>;

    return (
        <Menu.Item as={NavLink} exact to={url}>
            {text}
            {label}
        </Menu.Item>
    );
});
