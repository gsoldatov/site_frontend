import React, { memo, useMemo, useState } from "react";
import { useHistory } from "react-router";
import { Button, Input, Menu } from "semantic-ui-react";

import { useMountedState } from "../../../util/hooks/use-mounted-state";


/**
 * Navigation bar search input & button.
 */
export const NavbarSearch = memo(({ isStacked }) => {
    const history = useHistory();
    const isMounted = useMountedState();
    const [query, setQuery] = useState("");

    // Submit handler
    const onSubmit = () => {
        if (query.length > 0) {
            const params = new URLSearchParams();
            params.append("q", query);
            history.push(`/search?${params.toString()}`);

            if (isMounted()) setQuery("");
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

    // Hide search if stacked and on /search page
    if (isStacked && history.location.pathname === "/search") return null;

    const containerClassName = "navbar-search-container"
        .concat(isStacked ? " is-stacked" : "");
    
    return (
        <Menu.Item position="right" className={containerClassName}>
            <Input placeholder="Search" size="small" value={query} onChange={handleChange} onKeyDown={handleKeyDown} />
            <Button color="blue" icon="search" title="Search" onClick={onSubmit} className="navbar-search-button" />
        </Menu.Item>
    );
});
