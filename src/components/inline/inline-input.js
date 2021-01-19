import React, { useEffect, useRef } from "react";
import { Icon } from "semantic-ui-react";
import { useDispatch, useSelector } from "react-redux";

import intervalWrapper from "../../util/interval-wrapper";


export const InlineInput = ({ inputStateSelector, setInputState, inputPlaceholder, onChangeDelayed, existingIDsSelector, getItemTextSelector, setItem }) => {
    const dispatch = useDispatch();
    const is = useSelector(inputStateSelector);
    const placeholder = inputPlaceholder || "Add items by name";
    const existingIDs = useSelector(existingIDsSelector);

    const abortFetch = useRef();    // ref for storing abort fetch function
    const inputRef = useRef();
    const setIsDisplayed = isDisplayed => dispatch(setInputState({ isDisplayed: isDisplayed }));
    const resetInput = () => {
        if (abortFetch.current) abortFetch.current();
        dispatch(setInputState({ isDisplayed: false, inputText: "", matchingIDs: [] }));
    };
    const addItem = id => {
        if (abortFetch.current) abortFetch.current();
        const params = { added: [id ? id : is.inputText] };
        dispatch(setItem(params));
        dispatch(setInputState({ inputText: "", matchingIDs: [] }));
    };

    // Handle keydown event (Enter + Esc)
    const handleKeyDown = e => {
        if (e.key === "Enter" && is.inputText.length > 0) addItem();
        else if (e.key === "Escape") resetInput();
    };

    // // Handle focus removal event (onBlur)
    // const handleOnBlur = () => resetInput();

    // Handle input text change event
    const _onChangeDelayed = useRef(intervalWrapper(params => dispatch(onChangeDelayed(params))
                                    , 250, true)).current;     // wrap onChangeDelayed action to limit its execution frequency and save the wrapped object as a ref
    const handleChange = (e) => {
        dispatch(setInputState({ inputText: e.target.value }));     // inputText is updated immediately after every change
        abortFetch.current = _onChangeDelayed({                     // onChangeDelayed is called after a delay since last input value change (and dispatches a fetch)
            queryText: e.target.value, 
            existingIDs: existingIDs 
        });
    };

    // Focus the input after it's rendered
    useEffect(() => {
        if (inputRef.current) inputRef.current.focus();
    }, [is.isDisplayed]);
    
    const inputToggle = !is.isDisplayed && <Icon className="input-toggle" name="plus" title="Click to add tags" onClick={() => setIsDisplayed(true)} />;

    const inputDatalist = is.isDisplayed && (
        <datalist id="matching-tags">
            <>
            {/* {is.inputText.length === 0 ? null : is.matchingIDs.map(id => <InputDropDownItem key={id} id={id} textSelector={getItemTextSelector(id)} onClick={() => addItem(id);} />)} */}
            {is.inputText.length === 0 ? null : is.matchingIDs.map(id => {
                return <InputDropDownItem key={id} id={id} textSelector={getItemTextSelector(id)} onClick={() => addItem(id) } />
            })}
            </>
        </datalist>
    );

    const input = is.isDisplayed && (
        <input ref={inputRef} className="inline-input" list="matching-tags" value={is.inputText} placeholder={placeholder}
            onChange={handleChange} onKeyDown={handleKeyDown} //onBlur={handleOnBlur}
            >
        </input>
    );

    const addButton = is.isDisplayed && is.inputText.length > 0 && <Icon className="input-toggle" name="plus" title="Add a new tag" onClick={() => addItem()} />;

    return (
        <span className="inline-input-span">
            {inputToggle}
            {input}
            {inputDatalist}
            {addButton}
        </span>
    );
};


// Component rendering an item in dropdown list for item input
const InputDropDownItem = ({ id, textSelector, onClick }) => {
    const text = useSelector(textSelector) || id;
    return <option onClick={onClick}>{text}</option>;
};
