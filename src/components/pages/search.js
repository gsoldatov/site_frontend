import React from "react";
import { useLocation } from "react-router";

import { Layout } from "../modules/layout/layout";
import { SearchFeed } from "../page-parts/search/search-feed";
import { SearchInput } from "../page-parts/search/search-input";

import { enumLayoutTypes } from "../../util/enum-layout-types";

import StyleSearch from "../../styles/pages/search.css";


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
    
    return <Layout body={body} layoutType={enumLayoutTypes.shortWidth} />;
};
