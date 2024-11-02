import React, { useEffect, useRef, useMemo, memo } from "react";
import { Dropdown, Icon } from "semantic-ui-react";

import debounce from "../../../util/debounce";


/**
 * Component with input for adding new items in inline item lists.
 */
export const InlineInput = memo(({ placeholder, inputState, setInputState, setItem, existingIDs, matchingIDsText, onSearchChangeDelayed }) => {
    const { isDisplayed, inputText, matchingIDs } = inputState;

    const abortFetch = useRef();    // ref for storing abort fetch function
    const inputRef = useRef();
    let itemAdded = false;

    // Focus the input after it's rendered
    useEffect(() => {
        if (inputRef.current) inputRef.current.handleFocus();
    }, [isDisplayed]);

    // Handle focus removal event (onBlur)
    const handleBlur = () => resetInput();

    // Close input & add item handlers
    const resetInput = () => {
        if (abortFetch.current) abortFetch.current();
        setInputState({ isDisplayed: false, inputText: "", matchingIDs: [] });
    };
    const addItem = id => {
        if (!itemAdded) {
            if (abortFetch.current) abortFetch.current();
            const params = { added: [id ? id : inputText] };
            setItem(params);
            setInputState({ inputText: "", matchingIDs: [] });
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
        if (e.key === "Enter" && inputText.length > 0) addItem();
        else if (e.key === "Escape") resetInput();
    };

    const handleChange = (e, data) => {
        addItem(data.value);
    };

    const handleAddItem = (e, data) => {
        addItem(data.value);
    }

    // Handle input text change event
    const _onSearchChangeDelayed = useRef(debounce(onSearchChangeDelayed, 
        250, "onCall")).current;     // wrap onSearchChangeDelayed action to limit its execution frequency and save the wrapped object as a ref
    const handleSearchChange = (e) => {
        setInputState({ inputText: e.target.value });     // inputText is updated immediately after every change
        abortFetch.current = _onSearchChangeDelayed({     // onSearchChangeDelayed is called after a delay since last input value change (and dispatches a fetch)
            queryText: e.target.value, existingIDs
        });
    };

    // Components
    const inputToggleOnClick = useMemo(() => () => setInputState({ isDisplayed: true }), []);
    const inputToggle = !isDisplayed && <Icon className="input-toggle" name="plus" title="Click to add tags" onClick={inputToggleOnClick} />;

    const options = matchingIDs.map(id => ({ key: id, text: matchingIDsText[id], value: id }));

    const input = isDisplayed && <Dropdown search selectOnNavigation={false} selection selectOnBlur={false} className="inline-input" ref={inputRef}
        icon={false}
        placeholder={placeholder}
        open={options.length > 0}

        searchQuery={inputText}
        options={options}

        allowAdditions
        onAddItem={handleAddItem}
        onSearchChange={handleSearchChange}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
    />;

    // Add button currently can't add selected value from dropdown and can't be clicked if onBlur event is enabled
    // const addButton = isDisplayed && inputText.length > 0 && <Icon className="input-toggle" name="plus" title="Add a new tag" onClick={() => addItem()} />;

    return (
        <span className="inline-input-span">
            {inputToggle}
            {input}
            {/* {addButton} */}
        </span>
    );
});
