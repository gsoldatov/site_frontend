import React from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

import { ObjectAttributes } from "../../object-attributes/object-attributes";
import { HierarchyNavigation } from "./hierarchy-navigation";

import { getSubobjectShowDescriptionSelector } from "../../../../store/state-util/ui-objects-view";

import StyleCompositeChapters from "../../../../styles/objects-view/composite-chapters.css";


/**
 * Renders a table of contents for the elemenets below the `hierarchyElements.current`.
 */
export const TableOfContents = ({ hierarchyElements }) => {
    const rootObjectID = (hierarchyElements.root || {}).objectID;
    const numerateChapters = (hierarchyElements.root || {}).numerateChapters;
    const { objectID, chapter } = hierarchyElements.current;

    // Exit if hierarchy was not build
    if (!rootObjectID) return null;
    
    // Current object attributes
    const parentID = (hierarchyElements.parent || {}).objectID;
    const showDescriptionSelector = isNaN(parentID) ? undefined : getSubobjectShowDescriptionSelector(parentID, objectID);

    const attributeProps = {
        timestampProps: { displayTimestamp: parseInt(rootObjectID) === parseInt(objectID) },
        headerProps: { displayViewButton: false, prefixText: numerateChapters && chapter.length > 0 ? chapter + "." : null },

        // Custom selector for subobject description display condition
        descriptionProps: { showDescriptionSelector }
    };

    const attributes = <ObjectAttributes objectID={objectID} attributeProps={attributeProps} />;

    // Table of contents
    const tableOfContents = (
        <div className="composite-chapters-table-of-contents">
            <ListTag numerateChapters={numerateChapters}>
                {hierarchyElements.current.childElements.map((child, i) => 
                    <TableOfContentsElement key={i} currentElement={child} numerateChapters={numerateChapters} />)}
            </ListTag>
        </div>
    );

    return (
        <>
            <HierarchyNavigation hierarchyElements={hierarchyElements} />
            {attributes}
            {tableOfContents}
        </>
    );
};


/**
 * Recursively generates list item `currentElement` and a nested list for its `childElements`.
 * `numerateChapters` toggles the use of ordered lists.
 */
const TableOfContentsElement = ({ currentElement, numerateChapters }) => {
    const { objectID, chapter } = currentElement;

    // Get element text (object name)
    const currentElementText = useSelector(state => (state.objects[objectID] || {}).object_name);
    const currentElementLink = currentElementText 
        ? <Link to={currentElement.URL}>{currentElementText}</Link>
        : "<Object is unavailable>";
    
    // Generate nested list

    let nestedList = null;
    if (currentElement.childElements) {
        nestedList = (
            <ListTag numerateChapters={numerateChapters}>
                {currentElement.childElements.map((child, i) => <TableOfContentsElement key={i} currentElement={child} numerateChapters={numerateChapters} />)}
            </ListTag>
        );
    }

    // List item style (values are stored in data attributes of the tag to be accessed in the CSS rules for :before pseudoclass)
    let dataContent = numerateChapters ? chapter + "." : "";

    // Return current and nested elements
    return (
        <li data-content={dataContent} data-object-id={objectID}>
            {currentElementLink}
            {nestedList}
        </li>
    );
};


/**
 * Wraps its children with an appropriate HTML tag (<ol> or <ul>).
 */
const ListTag = ({ numerateChapters, children }) => {
    return numerateChapters
        ? <ol>{children}</ol>
        : <ul>{children}</ul>;
};
