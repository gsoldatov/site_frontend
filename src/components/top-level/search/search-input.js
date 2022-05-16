import React, { useEffect, useMemo, useState } from "react";
import { useHistory } from "react-router";
import { Input } from "semantic-ui-react";

import { FieldMenuButton } from "../../field/field-menu";

import { useMountedState } from "../../../util/use-mounted-state";


/**
 * Search page input & button.
 */
export const SearchInput = ({ }) => {
    const history = useHistory();
    const isMounted = useMountedState();
    const [query, setQuery] = useState("");

    // Set initial input text whenever URL param changes
    const URLParams = new URLSearchParams(history.location.search);
    const URLQuery = URLParams.get("q");

    useEffect(() => {
        setQuery(URLQuery);
    }, [URLQuery]);

    // Submit handler
    const onSubmit = () => {
        if (query.length > 0) {
            const params = new URLSearchParams();
            params.append("q", query);
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

    const handleChange = useMemo(() => e => { setQuery(e.target.value); }, []);
    
    return (
        <div className="search-input-container">
            <Input placeholder="Search" value={query} onChange={handleChange} onKeyDown={handleKeyDown} />
            <FieldMenuButton icon="search" title="Search" onClick={onSubmit} className="search-input-button" />
        </div>
    );
};
