import React, { memo } from "react";
import { Label, Menu } from "semantic-ui-react";
import { NavLink } from "react-router-dom";


/**
 * Basic navbar item with a link to another page.
 * 
 * `renderAs` prop can be used to override the container component (defaults to <Menu.Item>).
 */
export const NavbarItem = memo(({ isDisplayed = true, text, url, labelText, labelColor, renderAs }) => {
    if (!isDisplayed) return null;

    const Container = renderAs || Menu.Item;

    const label = labelText && <Label size="tiny" circular color={labelColor}>{labelText}</Label>;

    return (
        <Container as={NavLink} exact to={url}>
            {text}
            {label}
        </Container>
    );
});
