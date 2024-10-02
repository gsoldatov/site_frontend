import React, { createContext, memo, useContext, useMemo, useState } from "react";
import { Icon, Menu } from "semantic-ui-react";

import { OnResizeWrapper } from "../wrappers/on-resize-wrapper";
import { WindowWidthContext } from "../wrappers/window-width-provider";

import StyleSideMenu from "../../../styles/modules/side-menu.css";


/**
 * Basic side menu container component.
 */
export const SideMenu = ({ children, usePlaceholderWhenStacked }) => {
    if (!children) return null;

    return (
        <SideMenuContextProvider>
            <SideMenuContainer>
                {children}
            </SideMenuContainer>
            <StackedMenuFlowPlaceholder usePlaceholderWhenStacked={usePlaceholderWhenStacked} />
        </SideMenuContextProvider>
    );
};


export const SideMenuContext = createContext({});


/**
 * Stores, updates and provides via context shared side menu state.
 * 
 * NOTE: `useContext` hooks forces all consumers to rerender on value change, even if attributes they take from value didn't change.
 * Reducing the amount of rerenders requires either using multiple context providers to decouple components or using a state manager library to handle updates
 * (e.g.: another Redux store or https://zustand.docs.pmnd.rs/guides/initialize-state-with-props)
 */
const SideMenuContextProvider = ({ children }) => {
    // Side menu state
    const isStacked = useContext(WindowWidthContext) === 0;
    const [isExpanded, setIsExpanded] = useState(false);
    const [height, setHeight] = useState(0);

    // Side menu item state
    const [isItemStacked, setIsItemStacked] = useState(false);
    const [areDialogButtonsStacked, setAreDialogButtonsStacked] = useState(false)

    // On resize callback, which is used by <SideMenuContainer> to keep track of its size in state
    // (<SideMenuContextProvider> can wrap multiple components, and, therefore, 
    // <OnResizeWrapper> is used in <SideMenuContainer>, rather than here)
    const onSideMenuResize = useMemo(() => sideMenuRef => {
        const width = parseInt(getComputedStyle(sideMenuRef).width.replace("px", ""));
        const height = parseInt(getComputedStyle(sideMenuRef).height.replace("px", ""));
        
        setHeight(height);
        setIsItemStacked(width < 100);
        setAreDialogButtonsStacked(width < 170);
    }, []);

    const context = useMemo(() => ({ 
        isStacked, isExpanded, setIsExpanded, height, isItemStacked, areDialogButtonsStacked, onSideMenuResize 
    }), [isStacked, isExpanded, setIsExpanded, height, isItemStacked, areDialogButtonsStacked]);

    return (
        <SideMenuContext.Provider value={context}>
            {children}
        </SideMenuContext.Provider>
    );
};


/**
 * Side menu container component.
 * Renders provided `children` and <ExpandToggle>. 
 */
const SideMenuContainer = memo(({ children }) => {
    const { isStacked, isExpanded, onSideMenuResize } = useContext(SideMenuContext);

    const className = "side-menu" + (isStacked ? " is-stacked" : "");
    children = !isStacked || isExpanded ? children : null;  // Don't render children in collapsed & stacked menu

    return (
        <OnResizeWrapper callback={onSideMenuResize}>
            <Menu vertical fluid className={className}>
                <ExpandToggle />
                {children}
            </Menu>
        </OnResizeWrapper>
    );
});


/**
 * Expand toggle for stacked side menu
 */
const ExpandToggle = () => {
    const { isStacked, isExpanded, setIsExpanded } = useContext(SideMenuContext);

    if (!isStacked) return null;

    const icon = isExpanded ? "close" : "options";
    const onClick = () => setIsExpanded(!isExpanded);

    return (
        <Menu.Item className="side-menu-expand-container">
            <Icon className="side-menu-expand-toggle" name={icon} onClick={onClick}/>
        </Menu.Item>
    );
};


/**
 * Placeholder component for side menu.
 * Takes position of <SideMenuContainer>, when it's position is set to `fixed`.
 */
const StackedMenuFlowPlaceholder = (usePlaceholderWhenStacked) => {
    const { isStacked, height } = useContext(SideMenuContext);

    if (!usePlaceholderWhenStacked) return null;

    const style = { height };
    return isStacked && (
        <div className="side-menu-placeholder" style={style} />
    );
};
