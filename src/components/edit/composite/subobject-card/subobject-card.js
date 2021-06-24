import React from "react";

import { Heading } from "./heading";
import { CardMenu } from "./card-menu";
import { CardGeneralTab } from "./general-tab";
import { CardDataTab } from "./data-tab";
import { CardPlaceholder } from "./placeholders/error";
import { LoadingPlaceholder } from "./placeholders/loading";
import { DeletedPlaceholder } from "./placeholders/deleted";
import { ResetSubobjectDialog } from "./dialogs/reset-subobject-dialog";


/**
 * Composite subobject card component.
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
        const { objectID, subobjectID, updateCallback, selectedTab, isExpanded, isSubbjectEdited, fetchError, isSubobjectDeleted } = this.props;
        const { isResetDialogDisplayed } = this.state;
        
        // Render fetch error message, when object could not be fetched
        if (!isSubbjectEdited && fetchError.length > 0) return <CardPlaceholder fetchError={fetchError} isSubobjectDeleted={isSubobjectDeleted}
            subobjectID={subobjectID} updateCallback={updateCallback} />;

        // Render placeholder if object is not added into state.editedObjects
        if (!isSubbjectEdited) return <LoadingPlaceholder />;

        // Render object card
        // Heading & menu
        const heading = <Heading objectID={objectID} subobjectID={subobjectID} updateCallback={updateCallback} />;
        const menu = isExpanded && <CardMenu objectID={objectID} subobjectID={subobjectID} updateCallback={updateCallback} isResetDialogDisplayed={isResetDialogDisplayed} setIsResetDialogDisplayed={this.setIsResetDialogDisplayed} />;

        // Card body
        const body = 
            isResetDialogDisplayed ? <ResetSubobjectDialog objectID={objectID} subobjectID={subobjectID} updateCallback={updateCallback} setIsResetDialogDisplayed={this.setIsResetDialogDisplayed} />
            : isExpanded ? 
            (
                isSubobjectDeleted ? <DeletedPlaceholder />
                : selectedTab === 0 ? <CardGeneralTab subobjectID={subobjectID} />
                : selectedTab === 1 ? <CardDataTab subobjectID={subobjectID} />
                : null
            )
            : null;
        
        // Card CSS class
        const cardClassName = isExpanded ? "composite-subobject-card expanded" : "composite-subobject-card";

        return (
            <div className={cardClassName} id={subobjectID}>
                {heading}
                {menu}
                {body}
            </div>
        );
    }
}
