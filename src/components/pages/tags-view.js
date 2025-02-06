import React from "react";
import { useLocation } from "react-router-dom";

import { Layout } from "../modules/layout/layout";
import { TagDropdown } from "../page-parts/tags-view/tag-dropdown";
import { SelectPrompt } from "../page-parts/tags-view/select-prompt";
import { SelectedTags } from "../page-parts/tags-view/selected-tags";
import { TagInformation } from "../page-parts/tags-view/tag-information";
import { TagPageObjectsFeed } from "../page-parts/tags-view/tag-page-objects-feed";

import { LayoutType } from "../../types/store/ui/general/layout-type";


import StyleTagsView from "../../styles/pages/tags-view.css";


/**
 * /tags/view top-level component.
 */
export const TagsViewPage = () => {
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
    
    return <Layout body={body} layoutType={LayoutType.shortWidth} />;
};
