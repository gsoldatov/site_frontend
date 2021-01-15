import React, { useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Dropdown, Input, Menu } from "semantic-ui-react";

import intervalWrapper from "../../util/interval-wrapper";

import StlyeFieldMenu from "../../styles/field-menu.css";


/* Field menu component with customizable items. */
export default ({ items }) => {
    let k = 0;
    const menuItems = items.map(item => <FieldMenuElement key={k++} {...item} />);

    return (
        <Menu className="field-menu">{menuItems}</Menu>
    )
}


// Component for switching between different types of field menu items
const FieldMenuElement = props => {
    switch(props.type) {
        case "item":
            return <FieldMenuItem {...props} />;
        case "filter":
            return <FieldMenuFilter {...props} />;
        case "itemGroup":
            return <FieldMenuItemGroup {...props} />;
        case "dropdown":
            return <FieldMenuDropdown {...props} />;
        default:
            throw Error(`Received incorrect 'type' property for <FieldMenuElement> component: ${props.type}`);
    }
};


// Field menu button
const FieldMenuItem = ({ icon, title, getIsDisabled, getIsActive, onClick, getOnClickParams, onClickParams }) => {
    const dispatch = useDispatch();
    const isDisabled = typeof(getIsDisabled) === "function" ? useSelector(getIsDisabled) : false;
    const isActiveTemp = typeof(getIsActive) === "function" ? useSelector(getIsActive) : false;     // temp variable is used to avoid placing the hook in a condition block
    const isActive = isDisabled ? false : isActiveTemp;
    const _onClickParams = useSelector(typeof(getOnClickParams) === "function" ? getOnClickParams : state => null) || onClickParams;
    const handleClick = () => {
        if (isDisabled) return;
        dispatch(typeof(onClick) === "function" ? onClick(_onClickParams) : onClick);
    };

    return <Button basic icon={icon} title={title} active={isActive} disabled={isDisabled} onClick={handleClick} />;
};


// Field menu filter
const FieldMenuFilter = ({ placeholder, disabledSelector, getValueSelector, onChange, onChangeDelayed, getOnChangeParams }) => {
    const dispatch = useDispatch();
    const _placeholder = placeholder || "Filter";
    const disabled = useSelector(disabledSelector);
    const value = useSelector(getValueSelector);
    const _onChangeDelayed = useRef(intervalWrapper(params => dispatch(onChangeDelayed(params))
                                    , 250, true)).current;     // wrap onChangeDelayed action to limit its execution frequency and save the wrapped object as a ref
    const handleChange = e => {
        const onChangeParams = getOnChangeParams(e.target.value);
        dispatch(onChange(onChangeParams));                         // onChange is called on every change to properly dispatch state updates for input value
        _onChangeDelayed(onChangeParams);                           // onChangeDelayed is called after a delay since last input value change (and dispatches a fetch)
    };

    return <Input icon="search" disabled={disabled} className="field-menu-filter" placeholder={_placeholder} value={value} onChange={handleChange} />;
};


// Field menu dropdown
const FieldMenuDropdown = ({ placeholder, disabledSelector, defaultValueSelector, options, getOnChangeAction }) => {
    const dispatch = useDispatch();
    const isDisabled = useSelector(disabledSelector);
    const defaultValue = useSelector(defaultValueSelector);
    
    return <Dropdown multiple selection
        placeholder={placeholder}
        disabled={isDisabled}
        defaultValue={defaultValue}
        options={options}
        onChange={(e, data) => dispatch(getOnChangeAction(e, data))} 
    />;
}


// Field menu group
const FieldMenuItemGroup = ({ items, noBorder }) => {
    let k = 0;
    const _items = items.map(item => <FieldMenuElement key={k++} {...item} />);
    const style = { borderRight: noBorder ? "none" : "solid 1px lightgrey" };
    return <Button.Group className="field-menu-group" style={style}>{_items}</Button.Group>;
};
