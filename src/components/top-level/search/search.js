import React from "react";

import Layout from "../../common/layout";
import { SearchFeed } from "./search-feed";
import { SearchInput } from "./search-input";

import StyleSearch from "../../../styles/search.css";


/**
 * Search page component.
 */
export const SearchPage = () => {
    const body = (
        <div className="search-page-container">
            <SearchInput />
            <SearchFeed />
        </div>
    );
    
    return <Layout body={body} />;
};
