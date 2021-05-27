import React from "react";
import { Header, Segment } from "semantic-ui-react";

import { CardMenu } from "./menu";
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
                <>
                    <Header as="h3">Object is unavailable.</Header>
                    <div>{fetchError}</div>
                </>
            );
        }

        // Render placeholder if object is not added into state.editedObjects
        if (!isObjectEdited) {
            return (
                <div>Loading object...</div>
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
                {menu}
                <Segment attached="bottom" className="composite-subobject-card-segment">
                    {generalTab}
                    {dataTab}
                </Segment>
            </div>
        );
    }
}
