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
    // Get object IDs in the Breadcrumb
    let { current } = hierarchyElements;
    const objectIDs = [current.objectID];
    const elementURLs = [null];

    while (current.parentElement) {
        current = current.parentElement;
        objectIDs.unshift(current.objectID);
        elementURLs.unshift(current.URL);
    }

    // Get object names
    const objectNames = useSelector(state => 
        objectIDs.map(objectID => (state.objects[objectID] || {}).object_name || "<Object is unavailable>"
    ));

    // Don't render for the root component
    if (objectIDs.length < 2) return null;

    // Render Breadcrumb
    const sectionsAndDividers = [];
    objectIDs.forEach((objectID, i) => {
        const isActive = i === objectIDs.length - 1;
        const sectionContent = isActive
            ? objectNames[i]
            : (
                <Link to={elementURLs[i]}>
                    {objectNames[i]}
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
    // Parent, previous & next controls
    const elementControls = {};
    for (let [elementName, iconName, iconPosition] of [
        ["previous", "long arrow alternate left", "left"], 
        // ["parent", "long arrow alternate up", "left"], 
        ["next", "long arrow alternate right", "right"]]
    ) {
        const element = hierarchyElements[elementName];
        const objectName = useSelector(state => element ? state.objects[element.objectID].object_name : undefined);
        if (element) elementControls[elementName] = { URL: element.URL, text: objectName, iconName, iconPosition };
        else elementControls[elementName] = null;
    }

    return (
        <div className="composite-chapters-hierarchy-navigation-left-right-container">
            {
                Object.keys(elementControls).map((k, i) => {
                    if (!elementControls[k]) return <div key={i} className="composite-chapters-hierarchy-navigation-left-right-item" />

                    const { URL, text, iconName, iconPosition } = elementControls[k];
                    const icon = <Icon name={iconName} />;
                    return (
                        <div key={i} className="composite-chapters-hierarchy-navigation-left-right-item">
                            {iconPosition === "left" && icon}
                            <Link to={URL} title={text}>
                                {text}
                            </Link>
                            {iconPosition === "right" && icon}
                        </div>
                    );
                })
            }
        </div>
    );
};
