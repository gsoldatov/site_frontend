import React from "react";
import { Loader, Segment } from "semantic-ui-react";

import Error from "../../../common/error";
import { Heading } from "./heading";
import { CardMenu } from "./card-menu";
import { CardGeneralTab } from "./general-tab";
import { CardDataTab } from "./data-tab";
import { DeletedPlaceholder } from "./placeholders/deleted";


/*
    Composite subobject card
*/
export class SubobjectCard extends React.PureComponent {
    render() {
        const { objectID, subobjectID, updateCallback, selectedTab, isSubbjectEdited, fetchError, isSubobjectDeleted } = this.props;
        
        // Render fetch error message, when object could not 
        if (!isSubbjectEdited && fetchError.length > 0) {
            return (
                <div className="composite-subobject-card no-padding">
                    <div className="composite-subobject-placeholder-container">
                        <Error header="Object is unavailable." text={fetchError} containerClassName="subobject-error-container" messageClassName="subobject-error-message" />
                    </div>
                </div>
            );
        }

        // Render placeholder if object is not added into state.editedObjects
        if (!isSubbjectEdited) {
            return (
                <div className="composite-subobject-card no-padding">
                    <div className="composite-subobject-placeholder-container">
                        <Loader active inline="centered">Loading object...</Loader>
                    </div>
                </div>
            );
        }

        // Render object card
        // Heading & menu
        const heading = <Heading subobjectID={subobjectID} />;
        const menu = <CardMenu objectID={objectID} subobjectID={subobjectID} updateCallback={updateCallback} />;

        // Card body
        const body = 
            isSubobjectDeleted ? <DeletedPlaceholder />
            : selectedTab === 0 ? <CardGeneralTab subobjectID={subobjectID} />
            : selectedTab === 1 ? <CardDataTab subobjectID={subobjectID} />
            : null;

        return (
            <div className="composite-subobject-card">
                {heading}
                {menu}
                {body}
            </div>
        );
    }
}
