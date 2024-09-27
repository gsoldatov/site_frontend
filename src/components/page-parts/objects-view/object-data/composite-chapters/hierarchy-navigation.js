import React from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Breadcrumb, Icon } from "semantic-ui-react";

/**
 * Hierarchy navigation elements (Breadcrumb & previous + next)
 */
export const HierarchyNavigation = ({ hierarchyElements }) => {
    const isRendered = hierarchyElements.current.parentElement;     // Breadcrumb is always rendered for non-root objects; don't render for root to avoid unnecessary margin after container

    return isRendered && (
        <div className="composite-chapters-hierarchy-navigation-container">
            <HierarchyBreadcrumb hierarchyElements={hierarchyElements} />
            <PreviousNext hierarchyElements={hierarchyElements} />
        </div>
    )
};


/**
 * Breadcrumb with links to elements above the hierarchy & current element name
 */
const HierarchyBreadcrumb = ({ hierarchyElements }) => {
    const { numerateChapters } = hierarchyElements.root;
    
    // Get object IDs in the Breadcrumb
    let { current } = hierarchyElements;
    const elements = [current];

    while (current.parentElement) {
        current = current.parentElement;
        elements.unshift(current);
        // objectIDs.unshift(current.objectID);
        // elementURLs.unshift(current.URL);
    }

    // Get object names
    const objectNames = useSelector(state => 
        elements.map(element => (state.objects[element.objectID] || {}).object_name || "<Object is unavailable>"
    ));

    // Don't render for the root component
    if (elements.length < 2) return null;

    // Render Breadcrumb
    const sectionsAndDividers = [];
    elements.forEach((element, i) => {
        const isActive = i === elements.length - 1;

        // Full section text
        const sectionText = <ObjectNameWithChapter element={element} objectName={objectNames[i]} numerateChapters={numerateChapters} />;

        const sectionContent = isActive
            ? sectionText
            : (
                <Link to={element.URL}>
                    {sectionText}
                </Link>
            );
        
        sectionsAndDividers.push(
            <Breadcrumb.Section key={i} active={isActive}>
                {sectionContent}
            </Breadcrumb.Section>
        );

        if (!isActive) sectionsAndDividers.push(
            <Breadcrumb.Divider key={`divider ${i}`} icon="right angle" />
        );
    });

    return (
        <Breadcrumb className="composite-chapters-hierarchy-navigation-breadcrumb">
            {sectionsAndDividers}
        </Breadcrumb>
    );
};


/**
 * Links to previous & next hierarchy elements
 */
const PreviousNext = ({ hierarchyElements }) => {
    const { numerateChapters } = hierarchyElements.root;
    
    // Parent, previous & next controls
    const elementControls = {};
    for (let [elementName, iconName, iconPosition] of [
        ["previous", "long arrow alternate left", "prev"], 
        // ["parent", "long arrow alternate up", "left"], 
        ["next", "long arrow alternate right", "next"]]
    ) {
        const element = hierarchyElements[elementName];
        const objectName = useSelector(state => element ? state.objects[element.objectID].object_name : undefined);
        
        if (element) {
            // Get full text of the control and 
            const controlText = <ObjectNameWithChapter element={element} objectName={objectName} numerateChapters={numerateChapters} />;
            const title = numerateChapters ? `${element.chapter}. ${objectName}` : objectName;

            // Add control to the list
            elementControls[elementName] = { URL: element.URL, controlText, title, iconName, iconPosition };
        }
        else elementControls[elementName] = null;
    }

    return (
        <div className="composite-chapters-hierarchy-navigation-prev-next-container">
            {
                Object.keys(elementControls).map((k, i) => {
                    let className = "composite-chapters-hierarchy-navigation-prev-next-item";
                    if (!elementControls[k]) return <div key={i} className={className} />;

                    const { URL, controlText, title, iconName, iconPosition } = elementControls[k];
                    const icon = <Icon name={iconName} />;
                    className += " " + iconPosition;
                    return (
                        <div key={i} className={className}>
                            {iconPosition === "prev" && icon}
                            <Link to={URL} title={title}>
                                {controlText}
                            </Link>
                            {iconPosition === "next" && icon}
                        </div>
                    );
                })
            }
        </div>
    );
};


/**
 * Returns `objectName` with the chapter prefix, if `numerateChapter` is true.
 */
const ObjectNameWithChapter = ({ element, objectName, numerateChapters }) => {
    // Chapter prefix
    const prefix = numerateChapters && element.chapter.length > 0 && (
        <span className="composite-chapters-hierarchy-navigation-chapter-number">{element.chapter + "."}</span>
    );

    // Object name
    const name = <span className="composite-chapters-hierarchy-navigation-chapter-name">{objectName}</span>;

    // Full text
    return (
        <span className="composite-chapters-hierarchy-navigation-object-name-with-chapter">
            {prefix}
            {name}
        </span>
    );
};
