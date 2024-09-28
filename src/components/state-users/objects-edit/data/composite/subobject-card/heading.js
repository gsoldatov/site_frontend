import React, { useMemo, useState } from "react";
import { Button, Icon } from "semantic-ui-react";
import { useSelector } from "react-redux";
import { createSelector } from "reselect";

import { objectAttributesAreModified, objectTagsAreModified, objectDataIsModified, getObjectDataFromStore } from "../../../../../../store/state-util/objects";
import { subobjectStateIsModified, nonCompositeSubobjectIsValid, getNonCompositeSubobjectValidationError } from "../../../../../../store/state-util/composite";
import { enumDeleteModes } from "../../../../../../store/state-templates/composite-subobjects";
import { enumObjectTypes } from "../../../../../../util/enum-object-types";

/**
 * Subobject card heading line with object type and name, object name and indicators.
 */
export const Heading = ({ objectID, subobjectID, updateCallback, setIsMouseOverDraggable }) => {
    // Mouse enter and leave event handlers which toggles drag and drop functionality of the card
    // DND is enabled is cursor is hovered over heading, but not over expand/collapse toggle
    const [isOverHeading, setIsOverHeading] = useState(false);
    const [isOverExpandCollapse, setIsOverExpandCollapse] = useState(false);

    const onHeadingMouseEnter = useMemo(() => () => {
        setIsOverHeading(true);
        setIsMouseOverDraggable(!isOverExpandCollapse);
    }, [objectID, subobjectID, isOverExpandCollapse]);

    const onHeadingMouseLeave = useMemo(() => () => {
        setIsOverHeading(false);
        setIsMouseOverDraggable(false);
    }, [objectID, subobjectID]);

    const onExpandCollapseMouseEnter = useMemo(() => () => {
        setIsOverExpandCollapse(true);
        setIsMouseOverDraggable(false);
    }, [objectID, subobjectID]);

    const onExpandCollapseMouseLeave = useMemo(() => () => {
        setIsOverExpandCollapse(false);
        setIsMouseOverDraggable(isOverHeading);
    }, [objectID, subobjectID, isOverHeading]);
    
    // Heading container classname
    let containerHeadingClassName = "composite-subobjct-card-heading-container";
    if (isOverHeading) containerHeadingClassName += " is-hovered-over";

    return (
        <div className={containerHeadingClassName} onMouseEnter={onHeadingMouseEnter} onMouseLeave={onHeadingMouseLeave} >
            <div className="composite-subobjct-card-heading">
                <div className="composite-subobject-card-heading-left">
                    <HeadingLeft objectID={objectID} subobjectID={subobjectID} updateCallback={updateCallback} isHoveredOver={isOverHeading}
                        onExpandCollapseMouseEnter={onExpandCollapseMouseEnter} onExpandCollapseMouseLeave={onExpandCollapseMouseLeave} />
                </div>
                <div className="composite-subobject-card-heading-right">
                    <Indicators objectID={objectID} subobjectID={subobjectID} />
                </div>
            </div>
        </div>
    );
};


const HeadingLeft = ({ objectID, subobjectID, updateCallback, isHoveredOver, onExpandCollapseMouseEnter, onExpandCollapseMouseLeave }) => {
    // Expand/collapse toggle
    const isExpanded = useSelector(state => state.editedObjects[objectID].composite.subobjects[subobjectID].is_expanded);
    const expandToggleOnClick = useMemo(() => () => { 
        updateCallback({ compositeUpdate: { command: "updateSubobject", subobjectID, is_expanded: !isExpanded }}); 
    }, [objectID, subobjectID, isExpanded]);

    const expandToggleTitle = isExpanded ? "Collapse subobject card" : "Expand subobject card";
    const expandToggleClassName = isExpanded ? "subobject-card-expand-toggle expanded" : "subobject-card-expand-toggle";
    
    const expandButton = <Button basic circular size="mini" className={expandToggleClassName} icon="angle right" onClick={expandToggleOnClick} title={expandToggleTitle}
        onMouseEnter={onExpandCollapseMouseEnter} onMouseLeave={onExpandCollapseMouseLeave} />;

    // Type and name
    const objectName = useSelector(state => state.editedObjects[subobjectID].object_name);
    const objectType = useSelector(state => state.editedObjects[subobjectID].object_type);

    let headingTextClassName = objectName.length > 0 ? "composite-subobject-card-heading-text" : "composite-subobject-card-heading-text unnamed";
    if (isHoveredOver) headingTextClassName += " is-hovered-over";
    const headingText = objectName.length > 0 ? objectName : "<Unnamed>";
    return (
        <>
            {expandButton}
            <div className="composite-subobject-card-heading-object-type-icon" title={enumObjectTypes[objectType].name}>
                <Icon name={enumObjectTypes[objectType].icon} />
            </div>
            <div className={headingTextClassName} title={headingText}>
                {headingText}
            </div>
        </>
    );
};


const Indicators = ({ objectID, subobjectID }) => {
    const indicatorList = useMemo(() => {
        // Non-composite validation error & composite selectors
        const validationErrorTitleTextSelector = createSelector(
            state => state.editedObjects[subobjectID],
            editedObject => getNonCompositeSubobjectValidationError(editedObject)
        );
        const validationErrorIsDisplayedSelector = createSelector(
            state => state.editedObjects[subobjectID],
            editedObject => !nonCompositeSubobjectIsValid(editedObject)
        );

        // Existing modifed selectors
        const attributesModifiedIsDisplayedSelector = createSelector(
            state => state.objects[subobjectID],
            state => state.editedObjects[subobjectID],
            (object, editedObject) => objectAttributesAreModified(object, editedObject)
        );
        const tagsModifiedIsDisplayedSelector = createSelector(
            state => state.objectsTags[subobjectID],
            state => state.editedObjects[subobjectID],
            (objectTags, editedObject) => objectTagsAreModified(objectTags, editedObject)
        );
        const dataModifiedIsDisplayedSelector = createSelector(
            state => getObjectDataFromStore(state, subobjectID),
            state => state.editedObjects[subobjectID],
            (objectData, editedObject) => objectDataIsModified(objectData, editedObject)
        )
        const subobjectParamsModifiedIsDisplayedSelector = createSelector(
            state => (state.composite[objectID] || {subobjects: {}}).subobjects[subobjectID],
            state => (state.editedObjects[objectID] || {composite: {subobjects: {}}}).composite.subobjects[subobjectID],
            (stateInObjectData, stateInEditedObject) => subobjectStateIsModified(stateInObjectData, stateInEditedObject)
        );


        return [
            // Non-composite validation error & composite
            { name: "warning", color: "red", title: "Subobject is not valid: ", 
                titleTextSelector: state => validationErrorTitleTextSelector(state),
                isDisplayedSelector: state => validationErrorIsDisplayedSelector(state) },
            
            { name: "copy outline", color: "black", title: "Subobject is composite. All changes made to it must be saved from its page.", 
                isDisplayedSelector: state => state.editedObjects[subobjectID].object_type === "composite"},

            // New
            { name: "plus", color: "green", title: "Subobject is new and will be created when main object is saved", isDisplayed: parseInt(subobjectID) < 0 },

            // Existing modified
            { name: "font", color: "yellow", title: "Subobject attributes were modified", isDisplayedSelector: state => attributesModifiedIsDisplayedSelector(state) },
            { name: "tags", color: "yellow", title: "Subobject tags were modified", isDisplayedSelector: state => tagsModifiedIsDisplayedSelector(state) },
            { name: "file alternate outline", color: "yellow", title: "Subobject data was modified", isDisplayedSelector: state => dataModifiedIsDisplayedSelector(state) },

            { name: "list", color: "yellow", title: "Subobject parameters were modified", isDisplayedSelector: state => subobjectParamsModifiedIsDisplayedSelector(state) },
            
            // Deleted
            { name: "trash alternate", color: "black", title: "Subobject is marked for deletion", 
                isDisplayedSelector: state => state.editedObjects[objectID].composite.subobjects[subobjectID].deleteMode === enumDeleteModes.subobjectOnly },
            { name: "trash alternate", color: "red", title: "Subobject is marked for full deletion", 
                isDisplayedSelector: state => state.editedObjects[objectID].composite.subobjects[subobjectID].deleteMode === enumDeleteModes.full }
        ]
    }, [objectID, subobjectID]);

    const indicators = indicatorList.map((i, k) => 
        <Indicator key={k} name={i.name} color={i.color} title={i.title} titleTextSelector={i.titleTextSelector} isDisplayed={i.isDisplayed} isDisplayedSelector={i.isDisplayedSelector} />
    );

    return (
        <>
        {indicators}
        </>
    );
};


const Indicator = ({ name, color, title, titleTextSelector, isDisplayed, isDisplayedSelector }) => {
    // Use `isDisplayed` if it's passed into props, otherwise use the value returned by `isDisplayedSelector` selector.
    const isDisplayedFromSelector = useSelector(isDisplayedSelector || (state => false));
    isDisplayed = isDisplayed !== undefined ? isDisplayed : isDisplayedFromSelector;
    let titleText = title;
    const selectedTitleText = useSelector(titleTextSelector || (state => undefined));
    if (selectedTitleText) titleText += selectedTitleText;

    return isDisplayed && (
        <div className="composite-subobject-heading-indicator" title={titleText}>
            <Icon name={name} color={color} />
        </div>
    );
};
