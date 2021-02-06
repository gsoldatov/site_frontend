import React, { useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Divider, Dropdown, Input, Menu } from "semantic-ui-react";

import intervalWrapper from "../../util/interval-wrapper";

import StlyeFieldMenu from "../../styles/field-menu.css";


/* Field menu component with customizable items. */
export default ({ items, className = "field-menu", compact, size }) => {
    let k = 0;
    const menuItems = items.map(item => <FieldMenuElement key={k++} {...item} size={size} />);

    return (
        <Menu className={className} compact={compact} size={size}>{menuItems}</Menu>
    );
}


// Component for switching between different types of field menu items
const FieldMenuElement = props => {
    switch(props.type) {
        case "item":
            return <FieldMenuItem {...props} />;
        case "filter":
            return <FieldMenuFilter {...props} />;
        case "separator":
            return <FieldMenuSeparator {...props} />;
        case "itemGroup":
            return <FieldMenuItemGroup {...props} />;
        case "dropdown":
            return <FieldMenuDropdown {...props} />;
        case "updatableDropdown":
            return <FieldMenuUpdatableDropdown {...props} />;
        default:
            throw Error(`Received incorrect 'type' property for <FieldMenuElement> component: ${props.type}`);
    }
};


// Field menu button
const FieldMenuItem = ({ icon, title, size = "medium", isDisabledSelector, isActiveSelector, onClick, onClickParamsSelector, onClickParams }) => {
    const dispatch = useDispatch();
    const isDisabled = typeof(isDisabledSelector) === "function" ? useSelector(isDisabledSelector) : false;
    const isActiveTemp = typeof(isActiveSelector) === "function" ? useSelector(isActiveSelector) : false;     // temp variable is used to avoid placing the hook in a condition block
    const isActive = isDisabled ? false : isActiveTemp;
    const _onClickParams = useSelector(typeof(onClickParamsSelector) === "function" ? onClickParamsSelector : state => null) || onClickParams;
    const handleClick = () => {
        if (isDisabled) return;
        dispatch(typeof(onClick) === "function" ? onClick(_onClickParams) : onClick);
    };

    return <Button basic className="field-menu-button" size={size} icon={icon} title={title} active={isActive} disabled={isDisabled} onClick={handleClick} />;
};


// Field menu filter
const FieldMenuFilter = ({ placeholder, isDisabledSelector, valueSelector, onChange, onChangeDelayed, getOnChangeParams }) => {
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

    return <Input icon="search" disabled={isDisabled} className="field-menu-filter" placeholder={_placeholder} value={value} onChange={handleChange} />;
};


// Field menu dropdown
const FieldMenuDropdown = ({ placeholder, isDisabledSelector, defaultValueSelector, options, getOnChangeAction }) => {
    const dispatch = useDispatch();
    const isDisabled = useSelector(isDisabledSelector);
    const defaultValue = useSelector(defaultValueSelector);
    
    return <Dropdown multiple selection className="field-menu-dropdown"
        placeholder={placeholder}
        disabled={isDisabled}
        defaultValue={defaultValue}
        options={options}
        onChange={(e, data) => dispatch(getOnChangeAction(e, data))}
    />;
}


// Field menu dropdown with updatable options
const FieldMenuUpdatableDropdown = ({ placeholder, isDisabledSelector, inputStateSelector, existingIDsSelector, onSearchChange, onSearchChangeDelayed, onChange, getDropdownItemTextSelectors }) => {
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

    return <Dropdown search selectOnNavigation={false} selection selectOnBlur={false} className="field-menu-updatable-dropdown"
        placeholder={placeholder}
        disabled={isDisabled}
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


// Field menu separator
const FieldMenuSeparator = () => {
    // return <Divider vertical />;
    return <div className="field-menu-separator" />;
}


// Field menu group
const FieldMenuItemGroup = ({ items, noBorder }) => {
    let k = 0;
    const _items = items.map(item => <FieldMenuElement key={k++} {...item} />);
    const style = { borderRight: noBorder ? "none" : "solid 1px lightgrey" };
    return <Button.Group className="field-menu-group" style={style}>{_items}</Button.Group>;
};
