import React, { createContext, useContext, useMemo, useState } from "react";
import { Button, Checkbox, Container, Header, Icon, Menu } from "semantic-ui-react";

import { SideMenuContext } from "./side-menu";


const SideMenuDialogCheckboxContext = createContext({});

/** 
 * Container for other side menu dialog components. Renders dialog header with provided `text`.
 */
export const SideMenuDialog = ({ text, children }) => {
    // Store side menu checkbox state in container to make it accessible by other components
    const [isChecked, setIsChecked] = useState(false);
    const context = { isChecked, setIsChecked };

    const header = text && <SideMenuDialogHeader text={text} />;
    
    return (
        <Menu.Item className="side-menu-dialog">
            <SideMenuDialogCheckboxContext.Provider value={context}>
                {header}
                {children}
            </SideMenuDialogCheckboxContext.Provider>
        </Menu.Item>
    );
};


/**
 * Side menu dialog header text/icon component.
 */
const SideMenuDialogHeader = ({ text }) => {
    const { isItemStacked } = useContext(SideMenuContext);

    if (isItemStacked) return <Icon className="side-menu-dialog-header" name="question circle outline" color="blue" title={text} />

    return <Header className="side-menu-dialog-header" as="h5" textAlign="center" title={text}>{text}</Header>;
};


/**
 * Side menu dialog checkbox component.
 */
export const SideMenuDialogCheckbox = ({ label }) => {
    const { isItemStacked } = useContext(SideMenuContext);
    const { isChecked, setIsChecked } = useContext(SideMenuDialogCheckboxContext);

    const _label = !isItemStacked ? label : undefined;
    const icon = isItemStacked && <Icon name="asterisk" size="small" color="grey" title={label} />;

    return (
        <div className="side-menu-dialog-checkbox-container">
            <Checkbox label={_label} checked={isChecked} onChange={() => setIsChecked(!isChecked)} />
            {icon}
        </div>
    );
};


/**
 * Container for side menu dialog buttons.
 */
export const SideMenuDialogButtonsContainer = ({ children }) => {
    return <Container className="side-menu-dialog-buttons">{children}</Container>;
};


/**
 * Side menu dialog button component.
 */
export const SideMenuDialogButton = ({ text, icon, color, onClick }) => {
    const { areDialogButtonsStacked } = useContext(SideMenuContext);
    const { isChecked } = useContext(SideMenuDialogCheckboxContext);
    
    icon = icon && <Icon name={icon} />;
    text = !areDialogButtonsStacked && text;

    const _onClick = useMemo(() => () => onClick(isChecked), [onClick, isChecked]);

    return (
        <Button className="side-menu-dialog-button" size="small" icon={areDialogButtonsStacked} 
            color={color} onClick={_onClick} title={text}>
            {icon}
            {text}
        </Button>
    );
};
