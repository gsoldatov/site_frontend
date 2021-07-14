import React from "react";
import { Menu } from "semantic-ui-react";
import { NavLink } from "react-router-dom";
import { useLocation } from "react-router-dom";

import StyleNavigation from "../../styles/navigation.css";


/**
 * Navigation bar.
 */
export default () => {
    const location = useLocation();
    return (
        <Menu inverted fluid size="huge" className="navigation-bar"
            activeIndex={location.pathname}
        >
            <Menu.Item as={NavLink} exact to="/">Index</Menu.Item>
            <Menu.Item as={NavLink} exact to="/objects">Objects</Menu.Item>
            <Menu.Item as={NavLink} exact to="/tags">Tags</Menu.Item>
        </Menu>
    );
};
