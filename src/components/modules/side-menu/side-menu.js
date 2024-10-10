import React, { createContext, memo, useContext, useEffect, useMemo } from "react";
import { createDispatchHook, createSelectorHook, Provider } from "react-redux";
import { Icon, Menu } from "semantic-ui-react";

import { createComponentStore } from "../../../util/components";
import { OnResizeWrapper } from "../wrappers/on-resize-wrapper";
import { WindowWidthContext } from "../wrappers/window-width-provider";

import StyleSideMenu from "../../../styles/modules/side-menu.css";


/**
 * Basic side menu container component.
 */
export const SideMenu = ({ children, usePlaceholderWhenStacked }) => {
    if (!children) return null;

    return (
        <SideMenuStoreProvider>
            <SideMenuContainer>
                {children}
            </SideMenuContainer>
            <StackedMenuFlowPlaceholder usePlaceholderWhenStacked={usePlaceholderWhenStacked} />
        </SideMenuStoreProvider>
    );
};


// Set up custom hooks for side menu store
export const SideMenuContext = createContext({});
export const useSideMenuState = createSelectorHook(SideMenuContext);
const _useSideMenuDispatch = createDispatchHook(SideMenuContext);
// Wrapper over dispatch hook, which adds `type` attribute to the `stateProps` (required by Redux), so it can be omitted when declaring them
export const useSideMenuDispatch = () => {
    const dispatch = _useSideMenuDispatch();
    return stateProps => dispatch({ type: "", ...stateProps });
};


const SideMenuStoreProvider = ({ children }) => {
    const isStacked = useContext(WindowWidthContext) === 0;

    const store = useMemo(() => createComponentStore({
        isStacked,
        isExpanded: false,
        height: 0,
        isItemStacked: false,
        areDialogButtonsStacked: false
    }), []);

    // Propagate `isStacked` changes to the component store
    useEffect(() => {
        store.dispatch({ type: "", isStacked });
    }, [isStacked]);

    return (
        <Provider store={store} context={SideMenuContext}>
            {children}
        </Provider>
    );
};


/**
 * Side menu container component.
 * Renders provided `children` and <ExpandToggle>. 
 */
const SideMenuContainer = memo(({ children }) => {
    const sideMenuDispatch = useSideMenuDispatch();
    const isStacked = useSideMenuState(state => state.isStacked);
    const isExpanded = useSideMenuState(state => state.isExpanded);
    
    // On resize callback, which is used to keep track of component size in state
    const onSideMenuResize = useMemo(() => sideMenuRef => {
        const width = parseInt(getComputedStyle(sideMenuRef).width.replace("px", ""));
        const height = parseInt(getComputedStyle(sideMenuRef).height.replace("px", ""));

        sideMenuDispatch({
            height,
            isItemStacked: width < 100,
            areDialogButtonsStacked: width < 170
        });
    }, []);

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
    const sideMenuDispatch = useSideMenuDispatch();
    const isStacked = useSideMenuState(state => state.isStacked);
    const isExpanded = useSideMenuState(state => state.isExpanded);

    if (!isStacked) return null;

    const icon = isExpanded ? "close" : "options";
    const onClick = () => sideMenuDispatch({ isExpanded: !isExpanded });

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
    const isStacked = useSideMenuState(state => state.isStacked);
    const height = useSideMenuState(state => state.height);

    if (!usePlaceholderWhenStacked) return null;

    const style = { height };
    return isStacked && (
        <div className="side-menu-placeholder" style={style} />
    );
};
