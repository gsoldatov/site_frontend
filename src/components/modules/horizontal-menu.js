import React, { useState, useRef, memo, createContext, useContext } from "react";
import { Button, Dropdown, Input, Menu } from "semantic-ui-react";

import { debounce } from "../../util/debounce";

import { WindowWidthContext } from "./wrappers/window-width-provider";

import StlyeHorizontalMenu from "../../styles/modules/horizontal-menu.css";


/**
 * Context for passing `size` prop of <HorizontalMenu> into its children.
 */
const HorizontalMenuSizeContext = createContext(undefined);


/**
 * Horizontal menu component.
 * 
 * Renders SUIR <Menu> with the provided `size` and `compact` props and controls its fullscreen/smallscreen styling.
 */
export const HorizontalMenu = memo(({ className = "horizontal-menu", compact, size, children }) => {
    const isStacked = useContext(WindowWidthContext) === 0;
    
    if (isStacked) className += " smallscreen";

    return (
        <HorizontalMenuSizeContext.Provider value={size}>
            <Menu className={className} compact={compact} size={size}>
                {children}
            </Menu>
        </HorizontalMenuSizeContext.Provider>
    );
});


/**
 * Renders children as a group.
 * 
 * Container can be set to SUIR <Button.Group> by `isButtonGroup` prop or rendered as a div by default.
 * If `disableSmallScreenStyling` is true, disables smallscreen styling for the group and its children. 
 */
export const HorizontalMenuGroup = memo(({ isButtonGroup, disableSmallScreenStyling = false, children }) => {
    const size = useContext(HorizontalMenuSizeContext);
    let groupClassName = "horizontal-menu-group";
    if (disableSmallScreenStyling) groupClassName += " smallscreen-disabled";

    if (isButtonGroup) {
        return (
            <Button.Group className={groupClassName} size={size}>
                {children}
            </Button.Group>
        ); 
    } else {
        return (
            <div className={groupClassName}>
                {children}
            </div>
        );
    }
});


/**
 * Horizontal menu button.
 */
export const HorizontalMenuButton = memo(({ icon, title, isDisabled = false, isActive = false, onClick, className }) => {
    const size = useContext(HorizontalMenuSizeContext);
    className = "horizontal-menu-button" + (
        className === undefined ? ""
        : (className.startsWith(" ") ? className : (" " + className))
    );

    return <Button basic size={size} className={className} icon={icon} title={title} active={isActive} disabled={isDisabled} onClick={onClick} />;
});


/**
 * Horizontal menu filter.
 */
export const HorizontalMenuFilter = memo(({ value, placeholder = "Filter", isDisabled, onChange, onChangeDelayed }) => {
    const _onChangeDelayed = useRef(debounce(onChangeDelayed, 500, 
        "onCall")).current;     // wrap onChangeDelayed action to limit its execution frequency and save the wrapped object as a ref
    const handleChange = e => {
        const value = e.target.value;
        onChange(value);                         // onChange is called on every change to properly dispatch state updates for input value
        _onChangeDelayed(value);                 // onChangeDelayed is called after a delay since last input value change (and dispatches a fetch)
    };

    return <Input className="horizontal-menu-filter" fluid icon="search" disabled={isDisabled} placeholder={placeholder} value={value} onChange={handleChange} />;
});


/**
 * Horizontal menu dropdown.
 */
export const HorizontalMenuDropdown = memo(({ placeholder, isDisabled, defaultValue, options, onChange }) => {
    return <Dropdown multiple selection fluid className="horizontal-menu-dropdown"
        placeholder={placeholder}
        disabled={isDisabled}
        defaultValue={defaultValue}
        options={options}
        onChange={onChange}
    />;
});


/**
 * Horizontal menu dropdown with updatable options.
 */
export const HorizontalMenuUpdatableDropdown = ({ placeholder, isDisabled, inputState, existingIDs, onSearchChange, onSearchChangeDelayed, 
        onChange, options }) => {
    // Search text change handlers (updates state & runs a delayed fetch to get dropdown items)
    const _onSearchChangeDelayed = useRef(debounce(onSearchChangeDelayed , 500, "onCall")).current;
    const handleSearchChange = (e, data) => {
        onSearchChange({ inputText: data.searchQuery });
        _onSearchChangeDelayed(data.searchQuery, existingIDs);
    };

    // Item selection handler (dispatches onChange action with selected value as argument & clears the value of the dropdown)
    const [value, setValue] = useState("");
    const handleChange = (e, data) => {
        onChange(data.value);
        onSearchChange({ inputText: "", matchingIDs: [] });
        setValue("");
    };

    // Clear input text & matchingIDs when focus is removed from the item (dropdown value is cleared automatically)
    const handleBlur = (e, data) => {
        onSearchChange({ inputText: "", matchingIDs: [] });
    };

    // Close on Escape key press
    const handleKeyDown = e => {
        if (e.key === "Escape") {
            onSearchChange({ inputText: "", matchingIDs: [] });
            setValue("");
        }
    };

    return <Dropdown search selectOnNavigation={false} selection selectOnBlur={false} className="horizontal-menu-updatable-dropdown"
        placeholder={placeholder}
        disabled={isDisabled}
        open={options.length > 0}
        fluid
        //defaultSearchQuery={inputState.inputText}
        searchQuery={inputState.inputText}
        value={value}
        options={options}

        onSearchChange={handleSearchChange}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
    />;
};
