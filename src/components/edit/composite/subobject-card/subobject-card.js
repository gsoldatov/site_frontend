import React from "react";
import { DragSource, DropTarget } from "react-dnd";

import { Heading } from "./heading";
import { CardMenu } from "./card-menu";
import { CardGeneralTab } from "./general-tab";
import { CardDataTab } from "./data-tab";
import { CardPlaceholder } from "./placeholders/error";
import { LoadingPlaceholder } from "./placeholders/loading";
import { DeletedPlaceholder } from "./placeholders/deleted";
import { ResetSubobjectDialog } from "./dialogs/reset-subobject-dialog";
import { SubobjectCardDropZone } from "./card-dropzone";


/**
 * Composite subobject card component.
 */
class SubobjectCard extends React.PureComponent {
    constructor(props) {
        super(props);

        this.setIsResetDialogDisplayed = this.setIsResetDialogDisplayed.bind(this);
        this.setIsMouseOverDraggable = this.setIsMouseOverDraggable.bind(this);
        
        this.state = {
            isResetDialogDisplayed: false,
            isMouseOverDraggable: false     // component can be dragged by its heading (except for expand/collapse toggle)
        };
    }

    setIsResetDialogDisplayed (isResetDialogDisplayed) { this.setState({ isResetDialogDisplayed }); }
    setIsMouseOverDraggable (isMouseOverDraggable) { this.setState({ isMouseOverDraggable }); }

    render() {
        const { objectID, subobjectID, updateCallback, selectedTab, isExpanded, isSubbjectEdited, fetchError, isSubobjectDeleted } = this.props;
        const { isResetDialogDisplayed } = this.state;
        const { connectDragSource, connectDropTarget, isDragging, isDraggedOver } = this.props;
        let result, isPlaceholder = false;

        // Don't render the element which is being dragged
        if (isDragging) return null;
        
        // Render fetch error message, when object could not be fetched
        if (!isSubbjectEdited && fetchError.length > 0) {
            result = <CardPlaceholder fetchError={fetchError} isSubobjectDeleted={isSubobjectDeleted} subobjectID={subobjectID} updateCallback={updateCallback} />;
            isPlaceholder = true;
        }

        // Render placeholder if object is not added into state.editedObjects
        else if (!isSubbjectEdited) {
            result = <LoadingPlaceholder />;
            isPlaceholder = true;
        }

        // Render object card
        else {
            // Heading & menu
            const heading = <Heading objectID={objectID} subobjectID={subobjectID} updateCallback={updateCallback} setIsMouseOverDraggable={this.setIsMouseOverDraggable} />;
            const menu = isExpanded && <CardMenu objectID={objectID} subobjectID={subobjectID} updateCallback={updateCallback} isResetDialogDisplayed={isResetDialogDisplayed} 
                                            setIsResetDialogDisplayed={this.setIsResetDialogDisplayed} />;

            // Card body
            const body = 
                isResetDialogDisplayed ? <ResetSubobjectDialog objectID={objectID} subobjectID={subobjectID} updateCallback={updateCallback} 
                                            setIsResetDialogDisplayed={this.setIsResetDialogDisplayed} />
                : isExpanded ? 
                (
                    isSubobjectDeleted ? <DeletedPlaceholder />
                    : selectedTab === 0 ? <CardGeneralTab subobjectID={subobjectID} />
                    : selectedTab === 1 ? <CardDataTab subobjectID={subobjectID} />
                    : null
                )
                : null;
            
            // CSS card classname
            const cardClassName = isExpanded ? "composite-subobject-card expanded" : "composite-subobject-card";
            
            result = (
                <div className={cardClassName} id={subobjectID}>
                    {heading}
                    {menu}
                    {body}
                </div>
            );
        }

        // Dropzone & container <div>
        const dropzone = isDraggedOver && <SubobjectCardDropZone />;

        result = (
            <div className="composite-subobject-card-container">
                {dropzone}
                {result}
            </div>
        );

        // Disable dragging if not hovering over component's heading (except for expand/collapse toggle)
        if (!this.state.isMouseOverDraggable) return connectDropTarget(result);
        return connectDropTarget(connectDragSource(result));
    }
}


// Drag & drop specifications, collecting functions and wrapping
const dragSourceSpec = {
    beginDrag: props => {
        return { objectID: props.objectID, subobjectID: props.subobjectID };
    },
    endDrag: (props, monitor, component) => {
        if (!monitor.didDrop()) return;
        
        const { subobjectID, newColumn, newRow } = monitor.getDropResult();
        props.updateCallback({ compositeUpdate: { command: "updatePositionsOnDrop", subobjectID: props.subobjectID, dropTargetSubobjectID: subobjectID,
            newColumn, newRow }});
    },
    canDrag: props => props.canDrag
};

const dragSourceCollect = (connect, monitor) => ({
    connectDragSource: connect.dragSource(),
    isDragging: monitor.isDragging()
});

const dropTargetSpec = {
    drop: props => ({ objectID: props.objectID, subobjectID: props.subobjectID }),
    canDrop: (props, monitor) => props.objectID === monitor.getItem().objectID
};

const dropTargetCollect = (connect, monitor) => ({
    connectDropTarget: connect.dropTarget(),
    isDraggedOver: monitor.canDrop() && monitor.isOver()
});

export const DraggableSubobjectCard = DropTarget("composite subobject", dropTargetSpec, dropTargetCollect)(DragSource("composite subobject", dragSourceSpec, dragSourceCollect)(SubobjectCard));
