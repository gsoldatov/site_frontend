import React, { useEffect, useRef, useMemo, memo } from "react";
import { Dropdown, Icon } from "semantic-ui-react";
import { useDispatch, useSelector } from "react-redux";

import intervalWrapper from "../../util/interval-wrapper";


/**
 * Component with input for adding new items in inline item lists.
 */
export const InlineInput = memo(({ placeholder, inputStateSelector, setInputState, onSearchChangeDelayed, existingIDsSelector, setItem, getDropdownItemTextSelectors }) => {
    const dispatch = useDispatch();
    const is = useSelector(inputStateSelector);
    const existingIDs = useSelector(existingIDsSelector);

    const abortFetch = useRef();    // ref for storing abort fetch function
    const inputRef = useRef();
    const setIsDisplayed = useMemo(() => isDisplayed => dispatch(setInputState({ isDisplayed })));
    let itemAdded = false;

    // Focus the input after it's rendered
    useEffect(() => {
        if (inputRef.current) inputRef.current.handleFocus();
    }, [is.isDisplayed]);

    // Handle focus removal event (onBlur)
    const handleBlur = () => resetInput();

    // Close input & add item handlers
    const resetInput = () => {
        if (abortFetch.current) abortFetch.current();
        dispatch(setInputState({ isDisplayed: false, inputText: "", matchingIDs: [] }));
    };
    const addItem = id => {
        if (!itemAdded) {
            if (abortFetch.current) abortFetch.current();
            const params = { added: [id ? id : is.inputText] };
            dispatch(setItem(params));
            dispatch(setInputState({ inputText: "", matchingIDs: [] }));
            itemAdded = true;
        }
    };

    // Width update effect (if placed in `handleKeyDown`, it's not triggered when adding an item or pasting text)
    useEffect(() => {
        if (inputRef.current) {
            // Ref to HTML container element must be obtained separately
            const container = inputRef.current.ref.current;
            const inputElement = container.querySelector("input.search");
            const dividerElement = container.querySelector("div.divider");
            
            if (inputElement) {
                inputElement.style.width = "inherit";  // reset
                inputElement.style.width = `clamp(14em, calc(${inputElement.scrollWidth}px + 0.8em), 42em)`;    // set to text width

                // Update width of a placeholder <div>
                if (dividerElement) {
                    dividerElement.style.width = "inherit";  // reset
                    dividerElement.style.width = inputElement.style.width;
                }
            }
        }
    });

    // Handle keydown event (Enter + Esc) + update width
    const handleKeyDown = (e, data) => {
        // Handle specific keys
        if (e.key === "Enter" && is.inputText.length > 0) addItem();
        else if (e.key === "Escape") resetInput();
    };

    const handleChange = (e, data) => {
        addItem(data.value);
    };

    const handleAddItem = (e, data) => {
        addItem(data.value);
    }

    // Handle input text change event
    const _onSearchChangeDelayed = useRef(intervalWrapper(params => dispatch(onSearchChangeDelayed(params))
                                    , 250, true)).current;     // wrap onSearchChangeDelayed action to limit its execution frequency and save the wrapped object as a ref
    const handleSearchChange = (e) => {
        dispatch(setInputState({ inputText: e.target.value }));     // inputText is updated immediately after every change
        abortFetch.current = _onSearchChangeDelayed({                     // onSearchChangeDelayed is called after a delay since last input value change (and dispatches a fetch)
            queryText: e.target.value, 
            existingIDs: existingIDs 
        });
    };

    // Components
    const inputToggle = !is.isDisplayed && <Icon className="input-toggle" name="plus" title="Click to add tags" onClick={() => setIsDisplayed(true)} />;

    const itemStore = useSelector(getDropdownItemTextSelectors.itemStoreSelector);
    const options = is.matchingIDs.map(id => ({ key: id, text: getDropdownItemTextSelectors.itemTextSelector(itemStore, id), value: id }));

    const input = is.isDisplayed && <Dropdown search selectOnNavigation={false} selection selectOnBlur={false} className="inline-input" ref={inputRef}
        icon={false}
        placeholder={placeholder}
        open={options.length > 0}

        searchQuery={is.inputText}
        options={options}

        allowAdditions
        onAddItem={handleAddItem}
        onSearchChange={handleSearchChange}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
    />;

    // Add button currently can't add selected value from dropdown and can't be clicked if onBlur event is enabled
    // const addButton = is.isDisplayed && is.inputText.length > 0 && <Icon className="input-toggle" name="plus" title="Add a new tag" onClick={() => addItem()} />;

    return (
        <span className="inline-input-span">
            {inputToggle}
            {input}
            {/* {addButton} */}
        </span>
    );
});


/* InlineInput implemented with input + datalist tags (has add button, doesn't always update dropdown values) */
// export const InlineInput = ({ inputStateSelector, setInputState, inputPlaceholder, onChangeDelayed, existingIDsSelector, getItemTextSelector, setItem }) => {
//     const dispatch = useDispatch();
//     const is = useSelector(inputStateSelector);
//     const placeholder = inputPlaceholder || "Add items by name";
//     const existingIDs = useSelector(existingIDsSelector);

//     const abortFetch = useRef();    // ref for storing abort fetch function
//     const inputRef = useRef();
//     const setIsDisplayed = isDisplayed => dispatch(setInputState({ isDisplayed: isDisplayed }));
//     const resetInput = () => {
//         if (abortFetch.current) abortFetch.current();
//         dispatch(setInputState({ isDisplayed: false, inputText: "", matchingIDs: [] }));
//     };
//     const addItem = id => {
//         if (abortFetch.current) abortFetch.current();
//         const params = { added: [id ? id : is.inputText] };
//         dispatch(setItem(params));
//         dispatch(setInputState({ inputText: "", matchingIDs: [] }));
//     };

//     // Handle keydown event (Enter + Esc)
//     const handleKeyDown = e => {
//         if (e.key === "Enter" && is.inputText.length > 0) addItem();
//         else if (e.key === "Escape") resetInput();
//     };

//     // // Handle focus removal event (onBlur)
//     // const handleOnBlur = () => resetInput();

//     // Handle input text change event
//     const _onChangeDelayed = useRef(intervalWrapper(params => dispatch(onChangeDelayed(params))
//                                     , 250, true)).current;     // wrap onChangeDelayed action to limit its execution frequency and save the wrapped object as a ref
//     const handleChange = (e) => {
//         dispatch(setInputState({ inputText: e.target.value }));     // inputText is updated immediately after every change
//         abortFetch.current = _onChangeDelayed({                     // onChangeDelayed is called after a delay since last input value change (and dispatches a fetch)
//             queryText: e.target.value, 
//             existingIDs: existingIDs 
//         });
//     };

//     // Focus the input after it's rendered
//     useEffect(() => {
//         if (inputRef.current) inputRef.current.focus();
//     }, [is.isDisplayed]);
    
//     const inputToggle = !is.isDisplayed && <Icon className="input-toggle" name="plus" title="Click to add tags" onClick={() => setIsDisplayed(true)} />;

//     const inputDatalist = is.isDisplayed && (
//         <datalist id="matching-tags">
//             <>
//             {/* {is.inputText.length === 0 ? null : is.matchingIDs.map(id => <InputDropDownItem key={id} id={id} textSelector={getItemTextSelector(id)} onClick={() => addItem(id);} />)} */}
//             {is.inputText.length === 0 ? null : is.matchingIDs.map(id => {
//                 return <InputDropDownItem key={id} id={id} textSelector={getItemTextSelector(id)} onClick={() => addItem(id) } />
//             })}
//             </>
//         </datalist>
//     );

//     const input = is.isDisplayed && (
//         <input ref={inputRef} className="inline-input" list="matching-tags" value={is.inputText} placeholder={placeholder}
//             onChange={handleChange} onKeyDown={handleKeyDown} //onBlur={handleOnBlur}
//             >
//         </input>
//     );

//     const addButton = is.isDisplayed && is.inputText.length > 0 && <Icon className="input-toggle" name="plus" title="Add a new tag" onClick={() => addItem()} />;

//     return (
//         <span className="inline-input-span">
//             {inputToggle}
//             {input}
//             {inputDatalist}
//             {addButton}
//         </span>
//     );
// };


// // Component rendering an item in dropdown list for item input
// const InputDropDownItem = ({ id, textSelector, onClick }) => {
//     const text = useSelector(textSelector) || id;
//     return <option onClick={onClick}>{text}</option>;
// };
