import React from "react";
import { useLocation } from "react-router-dom";

import Layout from "../../common/layout";
import { TagDropdown } from "./tag-dropdown";
import { SelectPrompt } from "./select-prompt";
import { SelectedTags } from "./selected-tags";
import { TagInformation } from "./tag-information";

import { enumLayoutTypes } from "../../../util/enum-layout-types";
import { TagPageObjectsFeed } from "./tag-page-objects-feed";

import StyleTagsView from "../../../styles/tags-view.css";


/**
 * /tags/view top-level component.
 */
export const TagsView = () => {
    const location = useLocation();
    const URLParams = new URLSearchParams(location.search);
    const p = URLParams.get("p");
    const page = parseInt(p) >= 1 ? parseInt(p) : 1;

    const body = (
        <div className="tags-view-container">
            <TagDropdown />
            <SelectedTags />
            <SelectPrompt />
            <TagInformation />
            <TagPageObjectsFeed page={page} />
        </div>
    );
    
    return <Layout body={body} layoutType={enumLayoutTypes.shortWidth} />;
};
