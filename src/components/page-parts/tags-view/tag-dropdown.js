import React, { useState, useRef, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router";

import { Dropdown } from "semantic-ui-react";

import { tagsViewDropdownOptionsSearch } from "../../../fetches/ui-tags-view";

import debounce from "../../../util/debounce";
import { useMountedState } from "../../../util/hooks/use-mounted-state";
import { useURLParamIDs } from "../../../util/hooks/use-url-param-ids";


/**
 * /tags/view page tag filter
 */
export const TagDropdown = () => {
    const dispatch = useDispatch();
    const history = useHistory();
    const isMounted = useMountedState();
    const inputRef = useRef();

    const tagIDs = useURLParamIDs("tagIDs");
    const [matchingIDs, setMatchingIDs] = useState([]);
    const [inputText, setInputText] = useState("");
    const resetInput = useMemo(() => blur => {
        setMatchingIDs([]);
        setInputText("");

        if (blur && inputRef.current) inputRef.current.searchRef.current.blur();    // Remove focus from input
    }, []);
    const tagsStore = useSelector(state => state.tags);
    const options = matchingIDs.map(id => ({ key: id, text: tagsStore[id].tag_name, value: id }));

    // Dropdown Esc keypress event handler
    const handleKeyDown = e => {
        if (e.key === "Escape") {
            resetInput(true);
        }
    };
    
    // Search text change handlers (updates state, runs a delayed fetch to get dropdown items & updates dropdown items)
    const onSearchChangeDelayed = useRef(debounce(async (queryText, existingIDs) => {
        const result = await dispatch(tagsViewDropdownOptionsSearch(queryText, existingIDs));

        // Update state if component is still mounted (no redirect occured)
        if (isMounted()) {
            if (result.failed) setMatchingIDs([]);
            else setMatchingIDs(result.tagIDs);
        }
    }, 250, "onCall")).current;

    const handleSearchChange = (e, data) => {
        setInputText(data.searchQuery);
        onSearchChangeDelayed(data.searchQuery, tagIDs);
    };

    // Tag selection handler
    const handleChange = (e, data) => {
        resetInput();
        const newTagIDs = tagIDs.concat(data.value);
        const params = new URLSearchParams();
        params.append("tagIDs", encodeURIComponent(newTagIDs));
        const URL = `/tags/view?${params}`;
        history.push(URL);
    };

    return (
        <Dropdown search fluid selectOnNavigation={false} selection selectOnBlur={false} className="tags-view-tag-dropdown" ref={inputRef}
            placeholder="Enter tag name"
            open={options.length > 0}

            searchQuery={inputText}
            options={options}
            value={null}    // Don't store value after selection, so that it doesn't become stale when the last added tag is removed

            onSearchChange={handleSearchChange}
            onChange={handleChange}

            onKeyDown={handleKeyDown}
        />
    );
};
