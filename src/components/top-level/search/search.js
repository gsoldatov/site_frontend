import React from "react";
import { useLocation } from "react-router";

import Layout from "../../common/layout";
import { SearchFeed } from "./search-feed";
import { SearchInput } from "./search-input";

import StyleSearch from "../../../styles/search.css";


/**
 * Search page component.
 */
export const SearchPage = () => {
    const location = useLocation();
    const URLParams = new URLSearchParams(location.search);
    const query = URLParams.get("q");
    const p = URLParams.get("p");
    const page = parseInt(p) >= 1 ? parseInt(p) : 1;

    const body = (
        <div className="search-page-container">
            <SearchInput query={query} />
            <SearchFeed query={query} page={page} />
        </div>
    );
    
    return <Layout body={body} />;
};
