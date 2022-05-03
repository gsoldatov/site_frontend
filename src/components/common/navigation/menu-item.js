import React from "react";
import { useSelector } from "react-redux";
import { Label, Menu } from "semantic-ui-react";
import { NavLink } from "react-router-dom";


/**
 * Navigation bar's item component.
 */
export const NavbarItem = ({ item }) => {
    const isDisplayed = useSelector(item.isDisplayedSelector || (state => true));
    const labelText = useSelector(item.labelTextSelector || (state => undefined));
    const labelColor = useSelector(item.labelColorSelector || (state => "grey"));
    if (!isDisplayed) return null;

    const label = labelText !== undefined ? <Label size="tiny" circular color={labelColor}>{labelText}</Label> : null;

    return (
        <Menu.Item as={NavLink} exact to={item.to}>
            {item.text}
            {label}
        </Menu.Item>
    );
};
