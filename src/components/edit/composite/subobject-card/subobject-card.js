import React from "react";

import { Heading } from "./heading";
import { CardMenu } from "./card-menu";
import { CardGeneralTab } from "./general-tab";
import { CardDataTab } from "./data-tab";
import { ErrorPlaceholder } from "./placeholders/error";
import { LoadingPlaceholder } from "./placeholders/loading";
import { DeletedPlaceholder } from "./placeholders/deleted";
import { ResetSubobjectDialog } from "./dialogs/reset-subobject-dialog";


/*
    Composite subobject card
*/
export class SubobjectCard extends React.PureComponent {
    constructor(props) {
        super(props);

        this.setIsResetDialogDisplayed = this.setIsResetDialogDisplayed.bind(this);
        
        this.state = {
            isResetDialogDisplayed: false
        };
    }

    setIsResetDialogDisplayed (isResetDialogDisplayed) { this.setState({ isResetDialogDisplayed }); }

    render() {
        const { objectID, subobjectID, updateCallback, selectedTab, isSubbjectEdited, fetchError, isSubobjectDeleted } = this.props;
        const { isResetDialogDisplayed } = this.state;
        
        // Render fetch error message, when object could not 
        if (!isSubbjectEdited && fetchError.length > 0) return <ErrorPlaceholder fetchError={fetchError} />;

        // Render placeholder if object is not added into state.editedObjects
        if (!isSubbjectEdited) return <LoadingPlaceholder />;

        // Render object card
        // Heading & menu
        const heading = <Heading subobjectID={subobjectID} />;
        const menu = <CardMenu objectID={objectID} subobjectID={subobjectID} updateCallback={updateCallback} isResetDialogDisplayed={isResetDialogDisplayed} setIsResetDialogDisplayed={this.setIsResetDialogDisplayed} />;

        // Card body
        const body = 
            isResetDialogDisplayed ? <ResetSubobjectDialog objectID={objectID} subobjectID={subobjectID} updateCallback={updateCallback} setIsResetDialogDisplayed={this.setIsResetDialogDisplayed} />
            : isSubobjectDeleted ? <DeletedPlaceholder />
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
