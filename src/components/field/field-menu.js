import React, { useState, useRef, memo, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Dropdown, Input, Menu } from "semantic-ui-react";

import intervalWrapper from "../../util/interval-wrapper";

import { OnResizeWrapper } from "../common/on-resize-wrapper";

import StlyeFieldMenu from "../../styles/field-menu.css";


const menuIsFullscreenThreshold = 768;
/**
 * Field menu component with customizable items.
 */
export default memo(({ items, className = "field-menu", compact, size }) => {
    const [isFullscreenStyle, setIsFullscreenStyle] = useState(window.innerWidth >= menuIsFullscreenThreshold);

    const onResizeCallback = useMemo(() => menuRef => {
        setIsFullscreenStyle(window.innerWidth >= menuIsFullscreenThreshold);
    }, []);

    const menuItems = items.map((item, k) => <FieldMenuElement key={k} {...item} size={size} isFullscreenStyle={isFullscreenStyle} />);

    return (
        <OnResizeWrapper callback={onResizeCallback}>
            <Menu className={className} compact={compact} size={size}>
                {menuItems}
            </Menu>
        </OnResizeWrapper>
    );
});


/**
 * Component for switching between different types of field menu items.
 */
const FieldMenuElement = props => {
    switch(props.type) {
        case "group":
            return <FieldMenuGroup {...props} />;
        case "item":
            return <FieldMenuItem {...props} />;
        case "filter":
            return <FieldMenuFilter {...props} />;
        case "separator":
            return <FieldMenuSeparator {...props} />;
        case "dropdown":
            return <FieldMenuDropdown {...props} />;
        case "updatableDropdown":
            return <FieldMenuUpdatableDropdown {...props} />;
        default:
            throw Error(`Received incorrect 'type' property for <FieldMenuElement> component: ${props.type}`);
    }
};


/**
 * Groupping container for holding other elements.
 */
const FieldMenuGroup = ({ items, size, isFullscreenStyle }) => {
    const groupClassName = "field-menu-group" + (isFullscreenStyle ? "" : " small");
    const groupItems = items.map((item, k) => <FieldMenuElement key={k} {...item} size={size} isFullscreenStyle={isFullscreenStyle} />);
    return (
        <div className={groupClassName}>
            {groupItems}
        </div>
    );
};


/**
 * Field menu button.
 */
const FieldMenuItem = ({ icon, title, size = "medium", isDisabledSelector, isActiveSelector, onClick, onClickParamsSelector, onClickParams, dontDispatchOnClickHandler = false }) => {
    const dispatch = useDispatch();
    const isDisabled = typeof(isDisabledSelector) === "function" ? useSelector(isDisabledSelector) : false;
    const isActiveTemp = typeof(isActiveSelector) === "function" ? useSelector(isActiveSelector) : false;     // temp variable is used to avoid placing the hook in a condition block
    const isActive = isDisabled ? false : isActiveTemp;
    const _onClickParams = useSelector(typeof(onClickParamsSelector) === "function" ? onClickParamsSelector : state => null) || onClickParams;
    const handleClick = () => {
        if (isDisabled) return;
        if (dontDispatchOnClickHandler) onClick(_onClickParams);
        else dispatch(typeof(onClick) === "function" ? onClick(_onClickParams) : onClick);
    };

    return <Button basic className="field-menu-button" size={size} icon={icon} title={title} active={isActive} disabled={isDisabled} onClick={handleClick} />;
};


/**
 * Field menu filter.
 */
const FieldMenuFilter = ({ placeholder, isDisabledSelector, valueSelector, onChange, onChangeDelayed, getOnChangeParams, isFullscreenStyle }) => {
    const dispatch = useDispatch();
    const _placeholder = placeholder || "Filter";
    const isDisabled = useSelector(isDisabledSelector);
    const value = useSelector(valueSelector);
    const _onChangeDelayed = useRef(intervalWrapper(params => dispatch(onChangeDelayed(params))
                                    , 250, true)).current;     // wrap onChangeDelayed action to limit its execution frequency and save the wrapped object as a ref
    const handleChange = e => {
        const onChangeParams = getOnChangeParams(e.target.value);
        dispatch(onChange(onChangeParams));                         // onChange is called on every change to properly dispatch state updates for input value
        _onChangeDelayed(onChangeParams);                           // onChangeDelayed is called after a delay since last input value change (and dispatches a fetch)
    };

    const inputClassName = "field-menu-filter" + isFullscreenStyle ? "" : " small";

    return <Input icon="search" disabled={isDisabled} className={inputClassName}  fluid={!isFullscreenStyle} placeholder={_placeholder} value={value} onChange={handleChange} />;
};


/**
 * Field menu dropdown.
 */
const FieldMenuDropdown = ({ placeholder, isDisabledSelector, defaultValueSelector, options, getOnChangeAction, isFullscreenStyle }) => {
    const dispatch = useDispatch();
    const isDisabled = useSelector(isDisabledSelector);
    const defaultValue = useSelector(defaultValueSelector);

    const dropdownClassName = "field-menu-dropdown" + isFullscreenStyle ? "" : " small";
    
    return <Dropdown multiple selection className={dropdownClassName}
        placeholder={placeholder}
        disabled={isDisabled}
        fluid={!isFullscreenStyle}
        defaultValue={defaultValue}
        options={options}
        onChange={(e, data) => dispatch(getOnChangeAction(e, data))}
    />;
}


/**
 * Field menu dropdown with updatable options.
 */
const FieldMenuUpdatableDropdown = ({ placeholder, isDisabledSelector, inputStateSelector, existingIDsSelector, onSearchChange, onSearchChangeDelayed, 
        onChange, getDropdownItemTextSelectors, isFullscreenStyle }) => {
    const dispatch = useDispatch();
    const isDisabled = useSelector(isDisabledSelector);
    const inputState = useSelector(inputStateSelector);
    const existingIDs = useSelector(existingIDsSelector);

    // Search text change handlers (updates state & runs a delayed fetch to get dropdown items)
    const _onSearchChangeDelayed = useRef(intervalWrapper(params => dispatch(onSearchChangeDelayed(params))
                                    , 250, true)).current;
    const handleSearchChange = (e, data) => {
        dispatch(onSearchChange({ inputText: data.searchQuery }));
        _onSearchChangeDelayed({ queryText: data.searchQuery, existingIDs });
    };

    // Item selection handler (dispatches onChange action with selected value as argument & clears the value of the dropdown)
    const [value, setValue] = useState("");
    const handleChange = (e, data) => {
        dispatch(onChange(data.value));
        dispatch(onSearchChange({ inputText: "", matchingIDs: [] }));
        setValue("");
    };

    // Clear input text & matchingIDs when focus is removed from the item (dropdown value is cleared automatically)
    const handleBlur = (e, data) => {
        dispatch(onSearchChange({ inputText: "", matchingIDs: [] }));
    };

    // Clos on Escape key press
    const handleKeyDown = e => {
        if (e.key === "Escape") {
            dispatch(onSearchChange({ inputText: "", matchingIDs: [] }));
            setValue("");
        }
    };

    // Dropdown options (get item store => get item text from the store for each item id)
    const itemStore = useSelector(getDropdownItemTextSelectors.itemStoreSelector);
    const options = inputState.matchingIDs.map(id => ({ key: id, text: getDropdownItemTextSelectors.itemTextSelector(itemStore, id), value: id }));

    // Styling
    const dropdownClassName = "field-menu-updatable-dropdown" + isFullscreenStyle ? "" : " small";

    return <Dropdown search selectOnNavigation={false} selection selectOnBlur={false} className={dropdownClassName}
        placeholder={placeholder}
        disabled={isDisabled}
        fluid={!isFullscreenStyle}
        open={options.length > 0}

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


/**
 * Field menu separator.
 */
const FieldMenuSeparator = ({ isFullscreenStyle, hideWhenNotFullscreen }) => {
    const separatorClassName = "field-menu-separator" + (!isFullscreenStyle && hideWhenNotFullscreen ? " hidden" : "");
    return <div className={separatorClassName} />;
};
