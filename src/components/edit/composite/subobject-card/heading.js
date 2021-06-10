import React, { useMemo } from "react";
import { Icon } from "semantic-ui-react";
import { useSelector } from "react-redux";

import { objectAttributesAreModified, objectTagsAreModified, objectDataIsModified } from "../../../../store/state-util/objects";
import { subobjectStateIsModified, nonCompositeSubobjectIsValid, getNonCompositeSubobjectValidationError } from "../../../../store/state-util/composite";
import { enumDeleteModes } from "../../../../store/state-templates/composite-subobjects";


/**
 * Subobject card heading line with object type and name, object name and indicators.
 */
export const Heading = ({ objectID, subobjectID }) => {
    return (
        <div className="composite-subobjct-card-heading-container">
            <div className="composite-subobjct-card-heading">
                <div className="composite-subobject-card-heading-left">
                    <ObjectTypeAndName subobjectID={subobjectID} />
                </div>
                <div className="composite-subobject-card-heading-right">
                    <Indicators objectID={objectID} subobjectID={subobjectID} />
                </div>
            </div>
        </div>
    );
};


const ObjectTypeAndName = ({ subobjectID }) => {
    const objectName = useSelector(state => state.editedObjects[subobjectID].object_name);
    const objectType = useSelector(state => state.editedObjects[subobjectID].object_type);

    const headingTextClassName = objectName.length > 0 ? "composite-subobject-card-heading-text" : "composite-subobject-card-heading-text unnamed";
    const headingText = objectName.length > 0 ? objectName : "<Unnamed>";

    return (
        <>
            <div className="composite-subobject-card-heading-object-type-icon" title={objectTypeIconTitleMapping[objectType]}>
                <Icon name={objectTypeIconMapping[objectType]} />
            </div>
            <div className={headingTextClassName} title={headingText}>
                {headingText}
            </div>
        </>
    );
};


const objectTypeIconMapping = {
    link: "linkify",
    markdown: "arrow down",
    to_do_list: "check square outline",
    composite: "copy outline"
};

const objectTypeIconTitleMapping = {
    link: "Link",
    markdown: "Markdown",
    to_do_list: "To-do list",
    composite: "Composite object"
};


const Indicators = ({ objectID, subobjectID }) => {
    const indicatorList = useMemo(() => [
        // non-composite validation error & composite
        { name: "warning", color: "red", title: "Subobject is not valid: ", 
            titleTextSelector: state => getNonCompositeSubobjectValidationError(state, subobjectID), 
            isDisplayedSelector: state => !nonCompositeSubobjectIsValid(state, subobjectID) },
        
        { name: "copy outline", color: "black", title: "Subobject is composite. All changed made to it must be saved from its page.", 
            isDisplayedSelector: state => state.editedObjects[subobjectID].object_type === "composite"},

        // new
        { name: "plus", color: "green", title: "Subobject is new and will be created when main object is saved", isDisplayedSelector: state => subobjectID < 0 },

        // existing modified
        { name: "font", color: "yellow", title: "Subobject attributes were modified", isDisplayedSelector: state => objectAttributesAreModified(state, subobjectID) },
        { name: "tags", color: "yellow", title: "Subobject tags were modified", isDisplayedSelector: state => objectTagsAreModified(state, subobjectID) },
        { name: "file alternate outline", color: "yellow", title: "Subobject data was modified", isDisplayedSelector: state => objectDataIsModified(state, subobjectID) },
        { name: "list", color: "yellow", title: "Subobject parameters were modified", isDisplayedSelector: state => subobjectStateIsModified(state, objectID, subobjectID) },
        
        // deleted
        { name: "trash alternate", color: "black", title: "Subobject is marked for deletion", 
            isDisplayedSelector: state => state.editedObjects[objectID].composite.subobjects[subobjectID].deleteMode === enumDeleteModes.subobjectOnly },
        { name: "trash alternate", color: "red", title: "Subobject is marked for full deletion", 
            isDisplayedSelector: state => state.editedObjects[objectID].composite.subobjects[subobjectID].deleteMode === enumDeleteModes.full }
    ], [objectID, subobjectID]);

    const indicators = indicatorList.map((i, k) => 
        <Indicator key={k} name={i.name} color={i.color} title={i.title} titleTextSelector={i.titleTextSelector} isDisplayedSelector={i.isDisplayedSelector} />
    );

    return (
        <>
        {indicators}
        </>
    );
};

const Indicator = ({ name, color, title, titleTextSelector, isDisplayedSelector }) => {
    const isDisplayed = useSelector(isDisplayedSelector);
    let titleText = title;
    const selectedTitleText = useSelector(titleTextSelector || (state => undefined));
    if (selectedTitleText) titleText += selectedTitleText;

    return isDisplayed && (
        <div className="composite-subobject-heading-indicator" title={titleText}>
            <Icon name={name} color={color} />
        </div>
    );
};
