import React from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

import { ObjectAttributes } from "../../object-attributes/object-attributes";
import { HierarchyNavigation } from "./hierarchy-navigation";


/**
 * Renders a table of contents for the elemenets below the `hierarchyElements.current`.
 */
export const TableOfContents = ({ hierarchyElements }) => {
    const rootObjectID = (hierarchyElements.root || {}).objectID;
    const { objectID } = hierarchyElements.current;

    // Exit if hierarchy was not build
    if (!rootObjectID) return null;
    
    // Current object attributes
    const displayTimestamp = parseInt(rootObjectID) === parseInt(objectID);
    const attributes = <ObjectAttributes objectID={objectID} disableCompositeDisplayModeCheck displayTimestamp={displayTimestamp} />;

    const tableOfContents = (
        <ul>
            {hierarchyElements.current.childElements.map((child, i) => 
                <TableOfContentsElement key={i} currentElement={child} />)}
            
        </ul>
    );

    return (
        <>
            <HierarchyNavigation hierarchyElements={hierarchyElements} />
            {attributes}
            {tableOfContents}
        </>
    );
};


const TableOfContentsElement = ({ currentElement }) => {
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
            <ul>
                {currentElement.childElements.map((child, i) => <TableOfContentsElement key={i} currentElement={child} />)}
            </ul>
        );
    }

    return (
        <li>
            {currentElementLink}
            {nestedList}
        </li>
    );
};


