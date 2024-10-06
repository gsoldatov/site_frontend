import React, { memo, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router";

import { InlineItemListWrapper } from "../../modules/inline/inline-item-list-containers";
import { InlineItemList } from "../../modules/inline/inline-item-list";
import { InlineItem } from "../../modules/inline/inline-item";

import { tagsViewLoadSelectedTags } from "../../../fetches/ui-tags-view";
import { useURLParamIDs } from "../../../util/use-url-param-array";


/**
 * Currently selected tags on the /tags/view page
 */
export const SelectedTags = () => {
    const dispatch = useDispatch();
    const history = useHistory();
    const tagIDs = useURLParamIDs("tagIDs");

    // Fetch missing tag data when tagIDs change
    useEffect(() => {
        dispatch(tagsViewLoadSelectedTags(tagIDs));
    }, [tagIDs]);

    // Remove tag icon onClick callback
    const removeCallback = useMemo(() => id => {
        const newIDs = tagIDs.filter(i => i !== id);
        let URL = "/tags/view";

        if (newIDs.length > 0) {
            const params = new URLSearchParams();
            params.append("tagIDs", encodeURIComponent(newIDs));
            URL += `?${params}`;
        }

        history.push(URL);
    }, [tagIDs]);

    // A single selected tag on the /tags/view page
    const Tag = memo(({ id }) => {
        const tagName = useSelector(state => (state.tags[id] || {}).tag_name);
        if (!tagName) return null;

        const URL = `/tags/view?tagIDs=${id}`;

        const icons = [{ name: "remove", title: "Remove tag", onClick: () => removeCallback(id) }];

        return <InlineItem className="tags-view-selected-tag" text={tagName} URL={URL} icons={icons} />;
    });

    return tagIDs.length > 0 && (
        <InlineItemListWrapper>
            <InlineItemList itemIDs={tagIDs} ItemComponent={Tag} />
        </InlineItemListWrapper>
    );
};
