import React from "react";
import { Button, Container, Header, Menu } from "semantic-ui-react";

import { useDispatch, useSelector } from "react-redux";

import StyleSideMenu from "../../styles/side-menu.css";


/* Side menu component with customizable items. */
export default ({ items }) => {
    let k = 0;
    const itemComponents = items.map(item => <SideMenuElement key={k++} {...item} />);

    return (
        <Menu vertical fluid>
            {itemComponents}
        </Menu>
    );
}


// Component for switching between different types of side menu items
const SideMenuElement = props => {
    const isVisible = typeof(props.isVisibleSelector) === "function" ? useSelector(props.isVisibleSelector) : true;    
    if (!isVisible) {
        return null;
    }

    switch(props.type) {
        case "item":
            return <SideMenuItem {...props} />;
        case "dialog":
            return <SideMenuDialog {...props} />;
        default:
            throw Error(`Received incorrect 'type' property for <SideMenuElement> component: ${props.type}`);
    }
};


// Basic side menu item
const SideMenuItem = ({ text, isActiveSelector, onClick }) => {
    const dispatch = useDispatch();
    const isActive = typeof(isActiveSelector) === "function" ? useSelector(isActiveSelector) : true;
    const _onClick = isActive ? () => dispatch(onClick) : undefined;
    
    return <Menu.Item as="div" className="side-menu-item" disabled={!isActive} onClick={_onClick}>{text}</Menu.Item>;
};


// Dialog (header + clickable buttons)
const SideMenuDialog = ({ text, buttons }) => {
    const dispatch = useDispatch();
    let k = 0;
    const _buttons = buttons.map(btn => <Button key={k++} onClick={() => dispatch(btn.onClick)}>{btn.text}</Button>);
    
    return (
        <Menu.Item className="side-menu-dialog">
            <Header as="h5" textAlign="center">{text}</Header>
            <Container className="side-menu-dialog-buttons">{_buttons}</Container>
        </Menu.Item>
    );
}
