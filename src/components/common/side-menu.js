import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Button, Checkbox, Container, Header, Icon, Menu } from "semantic-ui-react";
import { Link } from "react-router-dom";

import { OnResizeWrapper } from "./on-resize-wrapper";

import StyleSideMenu from "../../styles/side-menu.css";


/**
 * Side menu component with customizable items. 
 */
export default ({ items }) => {
    if (!items) return null;

    // Fullscreen style & on resize update
    const [isFullscreenStyle, setIsFullscreenStyle] = useState(false);
    const [dialogButtonsFullscreenStyle, setDialogButtonsFullscreenStyle] = useState(false);
    const onResizeCallback = useMemo(() => computedStyle => {
        const width = parseInt(computedStyle.width.replace("px", ""));
        setIsFullscreenStyle(width >= 100);
        setDialogButtonsFullscreenStyle(width >= 221);
    });

    // Items
    let k = 0;
    const itemComponents = items.map(item => <SideMenuElement key={k++} {...item} 
        isFullscreenStyle={isFullscreenStyle} dialogButtonsFullscreenStyle={dialogButtonsFullscreenStyle} />);

    return (
        <OnResizeWrapper callback={onResizeCallback}>
            <Menu vertical fluid className="side-menu">
                {itemComponents}
            </Menu>
        </OnResizeWrapper>
    );
}


/**
 * Component for switching between different types of side menu items.
 */
const SideMenuElement = props => {
    const isVisible = typeof(props.isVisibleSelector) === "function" ? useSelector(props.isVisibleSelector) : true;    
    if (!isVisible) {
        return null;
    }

    switch(props.type) {
        case "item":
            return <SideMenuItem {...props} />;
        case "linkItem":
            return <SideMenuLinkItem {...props} />;
        case "dialog":
            return <SideMenuDialog {...props} />;
        default:
            throw Error(`Received incorrect 'type' property for <SideMenuElement> component: ${props.type}`);
    }
};


/**
 * Basic side menu item.
 */
const SideMenuItem = ({ text, icon, iconColor, iconFlipped, isActiveSelector, onClick, isFullscreenStyle }) => {
    const isActive = typeof(isActiveSelector) === "function" ? useSelector(isActiveSelector) : true;
    const _onClick = isActive ? () => onClick() : undefined;

    // Icon
    const _icon = icon && <Icon name={icon} color={iconColor} flipped={iconFlipped} />;

    // Text
    const _text = isFullscreenStyle && text;
    
    return (
        <Menu.Item className="side-menu-item-container" disabled={!isActive}> 
            <Button icon={!isFullscreenStyle} className="side-menu-item" onClick={_onClick} disabled={!isActive} title={text}>
                {_icon}
                {_text}
            </Button>
        </Menu.Item>
    );
};


/**
 * Side menu item wrapped in a link and without a button.
 */
 const SideMenuLinkItem = ({ text, icon, iconColor, iconFlipped, isActiveSelector, linkURL, linkURLSelector, onClick, isFullscreenStyle }) => {
    const _linkURL = typeof(linkURLSelector) === "function" ? useSelector(linkURLSelector) : linkURL;
    const isActive = typeof(isActiveSelector) === "function" ? useSelector(isActiveSelector) : true;

    // Icon
    const _icon = icon && <Icon name={icon} color={iconColor} flipped={iconFlipped} />;

    // Text
    const _text = isFullscreenStyle && text;

    let result = (
        <Button icon={!isFullscreenStyle} className="side-menu-item" disabled={!isActive} title={text}>
            {_icon}
            {_text}
        </Button>
    );

    if (isActive) result = (
        <Link to={_linkURL} onClick={onClick}>
            {result}
        </Link>
    );
    
    return (
        <Menu.Item className="side-menu-item-container" disabled={!isActive}>
            {result}
        </Menu.Item>
    );
};


/** 
 * Side menu dialog (header, checkbox and clickable buttons).
 */
const SideMenuDialog = ({ text, buttons, isCheckboxDisplayedSelector, checkboxText, isFullscreenStyle, dialogButtonsFullscreenStyle }) => {
    // Header
    const header = isFullscreenStyle ? (
        <Header className="side-menu-dialog-header" as="h5" textAlign="center" title={text}>{text}</Header>
    )
    : (
        <Icon className="side-menu-dialog-header" name="question circle outline" color="blue" title={text} />
    );

    // Checkbox
    const [isChecked, setIsChecked] = useState(false);
    const isCheckboxDisplayed = useSelector(isCheckboxDisplayedSelector || (state => false));
    const _checkboxText = isFullscreenStyle && checkboxText;
    const checkboxIcon = isCheckboxDisplayed && !isFullscreenStyle && (
        <Icon name="asterisk" size="small" color="grey" title={checkboxText} />
    );
    const checkbox = isCheckboxDisplayed && (
        <div className="side-menu-dialog-checkbox-container">
            <Checkbox label={_checkboxText} checked={isChecked} onChange={() => setIsChecked(!isChecked)} />
            {checkboxIcon}
        </div>
    );
    
    // Reset isChecked when isCheckboxDisplayed changes
    useEffect(() => {
        setIsChecked(false);
    }, [isCheckboxDisplayed]);

    // Buttons
    let k = 0;
    const _buttons = buttons.map(btn => {
        const icon = btn.icon && <Icon name={btn.icon} />;
        const _text = dialogButtonsFullscreenStyle && btn.text;

        return (
            <Button key={k++} className="side-menu-dialog-button" size="small" icon={!dialogButtonsFullscreenStyle} color={btn.color} onClick={() => btn.onClick(isChecked)} title={btn.text}>
                {icon}
                {_text}
            </Button>
        );
    });
    
    return (
        <Menu.Item className="side-menu-dialog">
            {header}
            {checkbox}
            <Container className="side-menu-dialog-buttons">{_buttons}</Container>
        </Menu.Item>
    );
};
