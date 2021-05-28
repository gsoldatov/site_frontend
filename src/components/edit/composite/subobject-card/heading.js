import React, { useMemo } from "react";
import { Icon } from "semantic-ui-react";
import { useSelector } from "react-redux";


export const Heading = ({ subobjectID }) => {
    return (
        <div className="composite-subobjct-card-heading-container">
            <div className="composite-subobjct-card-heading">
                <div className="composite-subobject-card-heading-left">
                    <ObjectTypeAndName subobjectID={subobjectID} />
                </div>
                <div className="composite-subobject-card-heading-right">
                    <Indicators subobjectID={subobjectID} />
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


const Indicators = ({ subobjectID }) => {
    const indicatorList = useMemo(() => [
        /*
            - new subobject / existing subobject with modified attributes;      icons: "plus" / "edit outline"
            - existing subobject with modified tags;
            - existing subobject with modified data;
            - exsting subobject parameters modified;
            - subobject is deleted / fully deleted;
        */
        { name: "plus", color: "green", title: "New subobject", isDisplayedSelector: state => true },
        { name: "tags", color: "yellow", title: "Tags were modified", isDisplayedSelector: state => true },
        { name: "file alternate outline", color: "yellow", title: "Data was modified", isDisplayedSelector: state => true },
        { name: "list", color: "yellow", title: "Subobject parameters were modified", isDisplayedSelector: state => true },
        { name: "trash alternate", color: "red", title: "Subobject is marked for deletion", isDisplayedSelector: state => true }        
    ], [subobjectID]);

    const indicators = indicatorList.map((i, k) => 
        <Indicator key={k} name={i.name} color={i.color} title={i.title} isDisplayedSelector={i.isDisplayedSelector} />
    );

    return (
        <>
        {indicators}
        </>
    );
};

const Indicator = ({ name, color, title, isDisplayedSelector }) => {
    const isDisplayed = useSelector(isDisplayedSelector);

    return isDisplayed && (
        <div className="composite-subobject-heading-indicator" title={title}>
            <Icon name={name} color={color} />
        </div>
    );
};
