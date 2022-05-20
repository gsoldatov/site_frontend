import React, { useEffect, useMemo, useState } from "react";
import { useHistory } from "react-router";
import { Button, Input } from "semantic-ui-react";


/**
 * Search page input & button.
 */
export const SearchInput = ({ query }) => {
    const history = useHistory();
    const [inputQuery, setInputQuery] = useState("");

    // Set `inputQuery` wheneven URL param `query` changes
    useEffect(() => {
        if (query) setInputQuery(query);
    }, [query]);

    // Submit handler
    const onSubmit = () => {
        if (inputQuery.length > 0) {
            const params = new URLSearchParams();
            params.append("q", inputQuery);
            history.push(`/search?${params.toString()}`);
        }
    };

    // Key down handler
    const handleKeyDown = e => {
        if (e.key === "Enter") {
            onSubmit();
        }

        if (e.key === "Escape") {
            e.target.blur();
        }
    };

    const handleChange = useMemo(() => e => { setInputQuery(e.target.value); }, []);
    
    return (
        <div className="search-input-container">
            <Input placeholder="Search" value={inputQuery} onChange={handleChange} onKeyDown={handleKeyDown} />
            <Button color="blue" icon="search" title="Search" onClick={onSubmit} className="search-input-button" />
        </div>
    );
};
