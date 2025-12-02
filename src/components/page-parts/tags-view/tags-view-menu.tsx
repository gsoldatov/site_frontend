import React, { useMemo } from "react";

import type { ObjectsPaginationInfo } from "../../../types/fetches/data/objects/general";
import { DisplayControlCheckbox } from "../../modules/edit/display/display-control-checkbox";


interface TagsViewMenuProps {
    show_only_displayed_in_feed: boolean,
    setPaginationInfo: (pI: Partial<ObjectsPaginationInfo>) => void
};


export const TagsViewMenu = ({ show_only_displayed_in_feed, setPaginationInfo }: TagsViewMenuProps) => {
    return (
        <div className="tags-view-menu" >
            <ShowDisplayInFeedOnlyCheckbox 
                show_only_displayed_in_feed={show_only_displayed_in_feed}
                setPaginationInfo={setPaginationInfo}
            />
        </div>
    );
};


const ShowDisplayInFeedOnlyCheckbox = ({ show_only_displayed_in_feed, setPaginationInfo }: TagsViewMenuProps) => {
    const onClick = useMemo(
        () => () => setPaginationInfo({ show_only_displayed_in_feed: !show_only_displayed_in_feed })
    , [show_only_displayed_in_feed]);

    return (
        <DisplayControlCheckbox checked={show_only_displayed_in_feed} onClick={onClick} label="Show Only Displayed in Feed" />
    );
};
