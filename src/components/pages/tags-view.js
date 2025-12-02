import React, { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

import { Layout } from "../modules/layout/layout";
import { TagsViewDropdown } from "../page-parts/tags-view/dropdown";
import { TagsViewMenu } from "../page-parts/tags-view/tags-view-menu";
import { SelectPrompt } from "../page-parts/tags-view/select-prompt";
import { SelectedTags } from "../page-parts/tags-view/selected-tags";
import { TagInformation } from "../page-parts/tags-view/tag-information";
import { TagsViewObjectsFeed } from "../page-parts/tags-view/objects-feed";

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

    // Pagination info
    const [pI, setPI] = useState({
            page,
            items_per_page: 10,
            order_by: "feed_timestamp",
            sort_order: "desc",
            show_only_displayed_in_feed: false,

            totalItems: 0,
            currentPageObjectIDs: []
    });
    
    // Partial pagination info state updater
    const setPaginationInfo = useMemo(() => partialPI => setPI({ ...pI, ...partialPI }), [pI]);

    const body = (
        <div className="tags-view-container">
            <TagsViewDropdown />
            <TagsViewMenu setPaginationInfo={setPaginationInfo}
                show_only_displayed_in_feed={pI.show_only_displayed_in_feed} />
            <SelectedTags />
            <SelectPrompt />
            <TagInformation />
            <TagsViewObjectsFeed page={page} paginationInfo={pI} setPaginationInfo={setPaginationInfo} />
        </div>
    );
    
    return <Layout body={body} layoutType={LayoutType.shortWidth} />;
};
