import React from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

import { ObjectAttributes } from "../../object-attributes/object-attributes";
import { HierarchyNavigation } from "./hierarchy-navigation";

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
    const attributeProps = {
        timestampProps: { displayTimestamp: parseInt(rootObjectID) === parseInt(objectID) },
        headerProps: { displayViewButton: false, prefixText: numerateChapters && chapter.length > 0 ? chapter + "." : null }
    };

    const attributes = <ObjectAttributes objectID={objectID} attributeProps={attributeProps} />;

    // Table of contents
    // const listStyle = numerateChapters ? { }
    const tableOfContents = (
        <div className="composite-chapters-table-of-contents">
            <ListTag numerateChapters={numerateChapters} >
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


const TableOfContentsElement = ({ currentElement, numerateChapters }) => {
    const objectNames = useSelector(state => {
        const getElementObjectNames = element => {
            const { objectID } = element;
            result[objectID] = (state.objects[objectID] || {}).object_name;
            if (element.childElements) element.childElements.forEach(child => getElementObjectNames(child));
        };

        const result = {};
        getElementObjectNames(currentElement);
        return result;
    });

    const currentElementText = objectNames[currentElement.objectID];
    const currentElementLink = currentElementText 
        ? <Link to={currentElement.URL}>{currentElementText}</Link>
        : "<Object is unavailable>";
    
    let nestedList = null;
    if (currentElement.childElements) {
        nestedList = (
            <ListTag numerateChapters={numerateChapters}>
                {currentElement.childElements.map((child, i) => <TableOfContentsElement key={i} currentElement={child} numerateChapters={numerateChapters} />)}
            </ListTag>
        );
    }

    return (
        <li>
            {currentElementLink}
            {nestedList}
        </li>
    );
};


const ListTag = ({ numerateChapters, style, children }) => {
    return numerateChapters
        ? <ol style={style}>{children}</ol>
        : <ul>{children}</ul>;
};

