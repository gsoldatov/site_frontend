import React from "react";
import { Loader, Segment } from "semantic-ui-react";

import Error from "../../../common/error";
import { Heading } from "./heading";
import { CardMenu } from "./card-menu";
import { CardGeneralTab } from "./general-tab";
import { CardDataTab } from "./data-tab";


/*
    Composite subobject card
*/
export class SubobjectCard extends React.PureComponent {
    render() {
        const { objectID, subobjectID, updateCallback, selectedTab, isObjectEdited, fetchError } = this.props;
        
        // Render fetch error message, when object could not 
        if (!isObjectEdited && fetchError.length > 0) {
            return (
                <div className="composite-subobject-card no-padding">
                    <div className="composite-subobject-loader-error-container">
                        <Error header="Object is unavailable." text={fetchError} containerClassName="subobject-error-container" messageClassName="subobject-error-message" />
                    </div>
                </div>
            );
        }

        // Render placeholder if object is not added into state.editedObjects
        if (!isObjectEdited) {
            return (
                <div className="composite-subobject-card no-padding">
                    <div className="composite-subobject-loader-error-container">
                        <Loader active inline="centered">Loading object...</Loader>
                    </div>
                </div>
            );
        }

        // Render object card
        // Menu
        const menu = <CardMenu objectID={objectID} subobjectID={subobjectID} updateCallback={updateCallback} />;

        // Tabs
        const generalTab = selectedTab === 0 && <CardGeneralTab subobjectID={subobjectID} />;
        const dataTab = selectedTab === 1 && <CardDataTab subobjectID={subobjectID} />;
        
        // Segment is used to style menu and tabs as <Tab> component
        return (
            <div className="composite-subobject-card">
                <Heading subobjectID={subobjectID} />
                {menu}
                {generalTab}
                {dataTab}
            </div>
        );
    }
}
