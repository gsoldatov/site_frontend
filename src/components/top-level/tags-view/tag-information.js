import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import { Link } from "react-router-dom";
import { Icon, Header } from "semantic-ui-react";

import { RenderedMarkdown } from "../../modules/markdown/rendered-markdown";

import { enumUserLevels } from "../../../util/enum-user-levels";
import { useParsedMarkdownState } from "../../../util/use-parsed-markdown-state";
import { useURLParamIDs } from "../../../util/use-url-param-array";

/**
 * /tags/view tag information block with header, description and prev/next tag selectors
 */
export const TagInformation = () => {
    const tagIDs = useURLParamIDs("tagIDs");

    // Index of selected tag ID in tagIDs
    const [currentIndex, setCurrentIndex] = useState(0);

    // Index updating function for buttons in the header
    const changeCurrentIndex = i => {
    if (Math.abs(i) !== 1) throw Error("Increment must be 1 or -1");
    const newIndex = currentIndex + i < 0 ? tagIDs.length - 1
        : currentIndex + i === tagIDs.length ? 0
        : currentIndex + i;
    setCurrentIndex(newIndex);        
    };
    
    // Reset index when tag IDs are modified
    useEffect(() => {
        setCurrentIndex(0);
    }, [tagIDs]);

    // Don't render if no tags are selected
    if (tagIDs.length === 0) return null;

    // Main render options
    const renderSelectButtons = tagIDs.length > 1;
    const tagCardClassname = "tags-view-tag-card" + (renderSelectButtons ? " with-select-buttons" : "");

    // Previous & next tag selectors
    const prevButton = renderSelectButtons && (
        <div className="tags-view-tag-information-select-button" onClick={() => changeCurrentIndex(-1)} title="Display information about previous tag" >
            <Icon size="big" name="angle left" />
        </div>
    );

    const nextButton = renderSelectButtons && (
        <div className="tags-view-tag-information-select-button" onClick={() => changeCurrentIndex(1)} title="Display information about next tag" >
            <Icon size="big" name="angle right" />
        </div>
    );

    return (
        <div className="tags-view-tag-information-container">
            {prevButton}
            <div className={tagCardClassname}>
                <TagInformationHeader tagID={tagIDs[currentIndex]} changeCurrentIndex={changeCurrentIndex} />
                <TagInformationDescription tagID={tagIDs[currentIndex]} />
            </div>
            {nextButton}
        </div>
    );
};


/**
 * Tag header & edit button
 */
const TagInformationHeader = ({ tagID }) => {
    const text = useSelector(state => tagID in state.tags ? state.tags[tagID].tag_name : "");
    const renderEditButton = useSelector(state => state.auth.numeric_user_level === enumUserLevels.admin);

    const header = text.length > 0 && <Header as="h2" className="tags-view-information-header">{text}</Header>;

    const editButton = text.length > 0 && renderEditButton && (
        <Link className="tags-view-tag-information-edit-button-container" to={`/tags/edit/${tagID}`} title="Edit tag">
            {/* <Button className="tags-view-tag-information-edit-button" basic icon="pencil" color="black" size="small" /> */}
            <Icon className="tags-view-tag-information-edit-button" name="pencil" color="black" />
        </Link>
    );

    return (
        <div className="tags-view-tag-information-header-container">
            {header}
            {editButton}
        </div>
    );
};


/**
 * Tag description as rendered Markdown
 */
const TagInformationDescription = ({ tagID }) => {
    const description = useSelector(state => (state.tags[tagID] || {}).tag_description);
    let parsed = useParsedMarkdownState(description || "");

    if (description === undefined) return null;

    parsed = parsed || "&lt;No description&gt;";

    return (
        <div className="tags-view-tag-information-description-container">
            <RenderedMarkdown parsedMarkdown={parsed} />
        </div>
    ); 
};
