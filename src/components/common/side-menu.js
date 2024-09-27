import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Button, Checkbox, Container, Header, Icon, Menu } from "semantic-ui-react";
import { Link } from "react-router-dom";

import { OnResizeWrapper } from "../modules/wrappers/on-resize-wrapper";

import StyleSideMenu from "../../styles/modules/side-menu.css";


/**
 * Side menu component with customizable items. 
 */
export default ({ items, usePlaceholderWhenStacked = false }) => {
    if (!items || items.length === 0) return null;

    // Fullscreen style state & on resize update
    const [isStacked, setIsStacked] = useState(window.innerWidth < 768);    // Toggles side menu mobile styling
    const [placeholderHeight, setPlaceholderHeight] = useState(0);
    const [itemFullscreenStyle, setItemFullscreenStyle] = useState(false);                  // Toggles icon only side menu items on small widths
    const [dialogButtonsFullscreenStyle, setDialogButtonsFullscreenStyle] = useState(false);    // Toggles icon only confirmation dialog on small widths
    const onResizeCallback = useMemo(() => sideMenuRef => {
        const width = parseInt(getComputedStyle(sideMenuRef).width.replace("px", ""));
        const height = parseInt(getComputedStyle(sideMenuRef).height.replace("px", ""));
        
        setIsStacked(window.innerWidth < 768);       // 768 = SUIR @media threshold
        setPlaceholderHeight(height);
        setItemFullscreenStyle(width >= 100);
        setDialogButtonsFullscreenStyle(width >= 170);
    }, []);

    // Stacked side menu placeholder
    const placeholderStyle = { height: placeholderHeight };
    const placeholder = usePlaceholderWhenStacked && isStacked && (
        <div className="side-menu-placeholder" style={placeholderStyle} />
    );

    // Stacked menu expand/collaps control display
    const [sideMenuIsExpanded, setSideMenuIsExpanded] = useState(false);

    const expandToggle = useMemo(() => {
        const icon = sideMenuIsExpanded ? "close" : "options";
        return (
            !isStacked ? null : (
                <Menu.Item className="side-menu-expand-container">
                    <Icon className="side-menu-expand-toggle" name={icon} onClick={() => setSideMenuIsExpanded(!sideMenuIsExpanded)}/>
                </Menu.Item>
            )
        );
    }, [sideMenuIsExpanded, isStacked]);

    // Items
    let itemComponents;
    if (!isStacked || sideMenuIsExpanded) {
        itemComponents = items.map((item, k) => <SideMenuElement key={k} {...item} 
            itemFullscreenStyle={itemFullscreenStyle} dialogButtonsFullscreenStyle={dialogButtonsFullscreenStyle} />);
    }

    const sideMenuClassName = "side-menu" + (isStacked ? " is-stacked" : "");

    return (
        <>
            <OnResizeWrapper callback={onResizeCallback}>
                <Menu vertical fluid className={sideMenuClassName}>
                    {expandToggle}
                    {itemComponents}
                </Menu>
            </OnResizeWrapper>
            {placeholder}
        </>
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
const SideMenuItem = ({ text, icon, iconColor, iconFlipped, isActiveSelector, onClick, itemFullscreenStyle }) => {
    const isActive = typeof(isActiveSelector) === "function" ? useSelector(isActiveSelector) : true;
    const _onClick = isActive ? () => onClick() : undefined;

    // Icon
    const _icon = icon && <Icon name={icon} color={iconColor} flipped={iconFlipped} />;

    // Text
    const _text = itemFullscreenStyle && text;
    
    return (
        <Menu.Item className="side-menu-item-container" disabled={!isActive}> 
            <Button icon={!itemFullscreenStyle} className="side-menu-item" onClick={_onClick} disabled={!isActive} title={text}>
                {_icon}
                {_text}
            </Button>
        </Menu.Item>
    );
};


/**
 * Side menu item wrapped in a link and without a button.
 */
 const SideMenuLinkItem = ({ text, icon, iconColor, iconFlipped, isActiveSelector, linkURL, linkURLSelector, onClick, itemFullscreenStyle }) => {
    const _linkURL = typeof(linkURLSelector) === "function" ? useSelector(linkURLSelector) : linkURL;
    const isActive = typeof(isActiveSelector) === "function" ? useSelector(isActiveSelector) : true;

    // Icon
    const _icon = icon && <Icon name={icon} color={iconColor} flipped={iconFlipped} />;

    // Text
    const _text = itemFullscreenStyle && text;

    let result = (
        <Button icon={!itemFullscreenStyle} className="side-menu-item" disabled={!isActive} title={text}>
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
const SideMenuDialog = ({ text, buttons, isCheckboxDisplayedSelector, checkboxText, itemFullscreenStyle, dialogButtonsFullscreenStyle }) => {
    // Header
    const header = itemFullscreenStyle ? (
        <Header className="side-menu-dialog-header" as="h5" textAlign="center" title={text}>{text}</Header>
    )
    : (
        <Icon className="side-menu-dialog-header" name="question circle outline" color="blue" title={text} />
    );

    // Checkbox
    const [isChecked, setIsChecked] = useState(false);
    const isCheckboxDisplayed = useSelector(isCheckboxDisplayedSelector || (state => false));
    const _checkboxText = itemFullscreenStyle && checkboxText;
    const checkboxIcon = isCheckboxDisplayed && !itemFullscreenStyle && (
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
